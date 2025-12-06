<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Suscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Customer;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Obtener clave pública de Stripe
     */
    public function getPublicKey()
    {
        return response()->json([
            'public_key' => config('services.stripe.key'),
            'currency' => 'eur',
            'country' => 'ES'
        ]);
    }

    /**
     * Crear Payment Intent para Stripe - TODO EN CÉNTIMOS
     */
    public function createPaymentIntent(Request $request)
    {
        Log::info('CreatePaymentIntent llamado', [
            'plan_id' => $request->plan_id,
            'user_id' => Auth::id(),
            'save_payment_method' => $request->save_payment_method ?? false
        ]);

        $request->validate([
            'plan_id' => 'required|exists:planes,id',
            'datos_facturacion' => 'nullable|array',
            'save_payment_method' => 'boolean',
        ]);

        $usuario = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        Log::info('Usuario y plan verificados', [
            'usuario_id' => $usuario->id,
            'usuario_role' => $usuario->getRoleNames()->first(),
            'plan_id' => $plan->id,
            'plan_precio' => $plan->precio
        ]);

        // Verificar que sea trainee
        if (!$usuario->hasRole('trainee')) {
            Log::warning('Usuario no es trainee', [
                'user_id' => $usuario->id,
                'role' => $usuario->getRoleNames()->first()
            ]);

            return response()->json([
                'message' => 'Solo los trainees pueden suscribirse'
            ], 403);
        }

        // Convertir precios a céntimos inmediatamente
        $precioPlanNuevoCentimos = (int) round($plan->precio * 100);

        // Calcular si es cambio de plan
        $tieneSuscripcionActiva = $usuario->tieneSuscripcionActiva();
        $montoACobrarCentimos = $precioPlanNuevoCentimos;
        $esCambioPlan = false;
        $planAnteriorId = null;
        $creditoAplicadoCentimos = 0;

        if ($tieneSuscripcionActiva) {
            $planActual = $usuario->plan;
            $planAnteriorId = $planActual->id;

            // Si es el mismo plan, error
            if ($planActual->id == $plan->id) {
                return response()->json([
                    'message' => 'Ya tienes este plan activo',
                    'es_mismo_plan' => true
                ], 400);
            }

            Log::info('Cambio de plan detectado', [
                'plan_actual' => $planActual->nombre,
                'plan_nuevo' => $plan->nombre,
                'precio_actual_centimos' => (int) round($planActual->precio * 100),
                'precio_nuevo_centimos' => $precioPlanNuevoCentimos
            ]);

            $esCambioPlan = true;

            // Calcular días restantes
            $diasRestantes = 0;
            if ($usuario->suscripcion_expira_en) {
                $diasRestantes = now()->diffInDays($usuario->suscripcion_expira_en, false);
                if ($diasRestantes < 0) $diasRestantes = 0;
            }

            // Si tiene días restantes, calcular prorrateo EN CÉNTIMOS
            if ($diasRestantes > 0) {
                $precioPlanActualCentimos = (int) round($planActual->precio * 100);

                // Calcular precio diario en céntimos (sin decimales)
                $precioDiarioActualCentimos = (int) floor($precioPlanActualCentimos / 30);
                $creditoCentimos = $diasRestantes * $precioDiarioActualCentimos;

                $precioDiarioNuevoCentimos = (int) floor($precioPlanNuevoCentimos / 30);
                $costoNuevoParaDiasRestantesCentimos = $diasRestantes * $precioDiarioNuevoCentimos;

                // Calcular diferencia EN CÉNTIMOS
                $diferenciaCentimos = $costoNuevoParaDiasRestantesCentimos - $creditoCentimos;

                Log::info('Cálculo cambio de plan (céntimos)', [
                    'dias_restantes' => $diasRestantes,
                    'precio_diario_actual_centimos' => $precioDiarioActualCentimos,
                    'precio_diario_nuevo_centimos' => $precioDiarioNuevoCentimos,
                    'credito_centimos' => $creditoCentimos,
                    'costo_nuevo_dias_restantes_centimos' => $costoNuevoParaDiasRestantesCentimos,
                    'diferencia_centimos' => $diferenciaCentimos
                ]);

                // Si es upgrade (plan más caro), cobrar diferencia
                // Si es downgrade (plan más barato), aplicar crédito
                if ($diferenciaCentimos > 0) {
                    $montoACobrarCentimos = $diferenciaCentimos;
                    $creditoAplicadoCentimos = $creditoCentimos;
                    Log::info('Upgrade - Cobrando diferencia', [
                        'monto_a_cobrar_centimos' => $montoACobrarCentimos,
                        'monto_a_cobrar_euros' => $montoACobrarCentimos / 100
                    ]);
                } else {
                    // Downgrade con crédito - mínimo 100 céntimos (1€) o la diferencia
                    $montoACobrarCentimos = max(100, abs($diferenciaCentimos));
                    $creditoAplicadoCentimos = $creditoCentimos;
                    Log::info('Downgrade - Aplicando crédito', [
                        'monto_a_cobrar_centimos' => $montoACobrarCentimos,
                        'monto_a_cobrar_euros' => $montoACobrarCentimos / 100
                    ]);
                }
            }
        }

        try {
            // Buscar cliente Stripe por email
            $customerId = null;
            $customers = Customer::all(['email' => $usuario->email]);

            if ($customers->data && count($customers->data) > 0) {
                $customerId = $customers->data[0]->id;
                Log::info('Cliente Stripe existente encontrado', ['customer_id' => $customerId]);
            } else {
                Log::info('Creando nuevo cliente Stripe');
                $customer = Customer::create([
                    'email' => $usuario->email,
                    'name' => $usuario->name,
                    'metadata' => [
                        'user_id' => $usuario->id,
                    ],
                ]);
                $customerId = $customer->id;
                Log::info('Cliente Stripe creado', ['customer_id' => $customerId]);
            }

            // Asegurarnos de que el monto es un entero
            $montoACobrarCentimos = (int) $montoACobrarCentimos;

            // Validar que el monto sea válido para Stripe (mínimo 100 céntimos = 1€)
            if ($montoACobrarCentimos < 100) {
                $montoACobrarCentimos = 100;
                Log::warning('Monto ajustado al mínimo de Stripe', [
                    'nuevo_monto_centimos' => $montoACobrarCentimos
                ]);
            }

            // Crear Payment Intent con el monto ENTERO en céntimos
            Log::info('Creando Payment Intent (céntimos)', [
                'amount' => $montoACobrarCentimos,
                'amount_euros' => $montoACobrarCentimos / 100,
                'currency' => 'eur',
                'customer' => $customerId,
                'es_cambio_plan' => $esCambioPlan
            ]);

            $paymentIntent = PaymentIntent::create([
                'amount' => $montoACobrarCentimos,
                'currency' => 'eur',
                'customer' => $customerId,
                'metadata' => [
                    'plan_id' => $plan->id,
                    'plan_nombre' => $plan->nombre,
                    'user_id' => $usuario->id,
                    'user_email' => $usuario->email,
                    'es_cambio_plan' => $esCambioPlan,
                    'plan_anterior_id' => $planAnteriorId,
                    'credito_aplicado_centimos' => $creditoAplicadoCentimos,
                    'credito_aplicado_euros' => $creditoAplicadoCentimos / 100,
                    'monto_original_centimos' => $precioPlanNuevoCentimos,
                    'monto_original_euros' => $plan->precio,
                    'monto_ajustado_centimos' => $montoACobrarCentimos,
                    'monto_ajustado_euros' => $montoACobrarCentimos / 100,
                ],
                'description' => $esCambioPlan
                    ? "Cambio de plan a {$plan->nombre}"
                    : "Suscripción a {$plan->nombre}",
                'automatic_payment_methods' => [
                    'enabled' => true,
                    'allow_redirects' => 'never',
                ],
                'setup_future_usage' => $request->save_payment_method ? 'off_session' : null,
            ]);

            Log::info('Payment Intent creado', [
                'payment_intent_id' => $paymentIntent->id,
                'client_secret' => substr($paymentIntent->client_secret, 0, 20) . '...',
                'amount_centimos' => $paymentIntent->amount,
                'amount_euros' => $paymentIntent->amount / 100,
                'status' => $paymentIntent->status,
                'es_cambio_plan' => $esCambioPlan
            ]);

            // Crear suscripción pendiente
            $suscripcionData = [
                'usuario_id' => $usuario->id,
                'plan_id' => $plan->id,
                'estado' => 'pendiente',
                'metodo_pago' => 'tarjeta',
                'datos_facturacion' => $request->datos_facturacion,
                'transaccion_id' => $paymentIntent->id,
                'es_cambio_plan' => $esCambioPlan,
                'datos_pago' => [
                    'stripe_payment_intent_id' => $paymentIntent->id,
                    'stripe_customer_id' => $customerId,
                    'client_secret' => $paymentIntent->client_secret,
                    'amount_centimos' => $paymentIntent->amount,
                    'amount_euros' => $paymentIntent->amount / 100,
                    'currency' => $paymentIntent->currency,
                    'es_cambio_plan' => $esCambioPlan,
                    'plan_anterior_id' => $planAnteriorId,
                    'credito_aplicado_centimos' => $creditoAplicadoCentimos,
                    'credito_aplicado_euros' => $creditoAplicadoCentimos / 100,
                    'monto_original_centimos' => $precioPlanNuevoCentimos,
                    'monto_original_euros' => $plan->precio,
                ]
            ];

            $suscripcion = Suscripcion::create($suscripcionData);

            Log::info('Suscripción pendiente creada', [
                'suscripcion_id' => $suscripcion->id,
                'estado' => 'pendiente',
                'es_cambio_plan' => $esCambioPlan,
                'monto_euros' => $montoACobrarCentimos / 100
            ]);

            return response()->json([
                'message' => $esCambioPlan ? 'Intención de pago para cambio de plan creada' : 'Intención de pago creada',
                'es_cambio_plan' => $esCambioPlan,
                'monto_original_euros' => $plan->precio,
                'monto_ajustado_euros' => $montoACobrarCentimos / 100,
                'credito_aplicado_euros' => $creditoAplicadoCentimos / 100,
                'payment_intent' => [
                    'id' => $paymentIntent->id,
                    'client_secret' => $paymentIntent->client_secret,
                    'amount' => $paymentIntent->amount, // Devuelve en céntimos
                    'amount_euros' => $paymentIntent->amount / 100,
                    'currency' => $paymentIntent->currency,
                    'customer' => $customerId,
                ],
                'suscripcion' => $suscripcion
            ]);

        } catch (\Exception $e) {
            Log::error('Error en createPaymentIntent', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'plan_id' => $request->plan_id,
                'user_id' => $usuario->id ?? 'null'
            ]);

            return response()->json([
                'message' => 'Error al crear la intención de pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirmar pago de Stripe
     */
    public function confirmPayment(Request $request)
    {
        Log::info('ConfirmPayment llamado', [
            'payment_intent_id' => $request->payment_intent_id,
            'payment_method_id' => $request->payment_method_id,
            'user_id' => Auth::id()
        ]);

        $request->validate([
            'payment_intent_id' => 'required',
            'payment_method_id' => 'required',
        ]);

        try {
            Log::info('Intentando recuperar Payment Intent', [
                'payment_intent_id' => $request->payment_intent_id
            ]);

            // Recuperar el Payment Intent
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            Log::info('Payment Intent recuperado', [
                'id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
                'amount_centimos' => $paymentIntent->amount,
                'amount_euros' => $paymentIntent->amount / 100,
                'customer' => $paymentIntent->customer,
                'metadata' => $paymentIntent->metadata
            ]);

            // Buscar la suscripción
            $suscripcion = Suscripcion::where('transaccion_id', $paymentIntent->id)
                ->with('plan', 'usuario')
                ->first();

            Log::info('Suscripción encontrada', [
                'suscripcion_id' => $suscripcion ? $suscripcion->id : 'null',
                'estado_actual' => $suscripcion ? $suscripcion->estado : 'null',
                'es_cambio_plan' => $suscripcion ? ($suscripcion->es_cambio_plan ?? false) : false
            ]);

            if (!$suscripcion) {
                Log::error('Suscripción no encontrada', [
                    'payment_intent_id' => $paymentIntent->id
                ]);

                return response()->json([
                    'exito' => false,
                    'message' => 'Suscripción no encontrada'
                ], 404);
            }

            // Verificar estado del pago
            if ($paymentIntent->status === 'succeeded') {
                Log::info('Pago exitoso, activando suscripción');

                $esCambioPlan = $suscripcion->es_cambio_plan ?? false;
                $planAnteriorId = $suscripcion->datos_pago['plan_anterior_id'] ?? null;

                // Si es cambio de plan, cancelar suscripción anterior
                if ($esCambioPlan && $planAnteriorId) {
                    Log::info('Cancelando suscripción anterior por cambio de plan', [
                        'user_id' => $suscripcion->usuario_id,
                        'plan_anterior_id' => $planAnteriorId,
                        'nuevo_plan_id' => $suscripcion->plan_id
                    ]);

                    // Buscar y cancelar suscripción anterior activa
                    $suscripcionAnterior = Suscripcion::where('usuario_id', $suscripcion->usuario_id)
                        ->where('plan_id', $planAnteriorId)
                        ->where('estado', 'activa')
                        ->first();

                    if ($suscripcionAnterior) {
                        $suscripcionAnterior->update(['estado' => 'cancelada']);
                        Log::info('Suscripción anterior cancelada', [
                            'suscripcion_anterior_id' => $suscripcionAnterior->id
                        ]);
                    }
                }

                // Calcular fecha de expiración
                // Si es cambio de plan, mantener la fecha original de expiración
                // Si es nueva suscripción, calcular nueva fecha
                $fechaExpiracion = null;
                if ($esCambioPlan && $suscripcion->usuario->suscripcion_expira_en) {
                    $fechaExpiracion = $suscripcion->usuario->suscripcion_expira_en;
                    Log::info('Manteniendo fecha de expiración original para cambio de plan', [
                        'fecha_expiracion' => $fechaExpiracion
                    ]);
                } else {
                    $fechaExpiracion = now()->addDays($suscripcion->plan->duracion_dias);
                    Log::info('Nueva fecha de expiración calculada', [
                        'fecha_expiracion' => $fechaExpiracion
                    ]);
                }

                // Activar suscripción
                $suscripcion->update([
                    'estado' => 'activa',
                    'inicio_en' => now(),
                    'expira_en' => $fechaExpiracion,
                    'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                        'stripe_payment_method_id' => $request->payment_method_id,
                        'stripe_charge_id' => $paymentIntent->latest_charge,
                        'status' => $paymentIntent->status,
                        'captured_at' => now(),
                        'confirmed_at' => now(),
                        'amount_paid_centimos' => $paymentIntent->amount,
                        'amount_paid_euros' => $paymentIntent->amount / 100,
                    ])
                ]);

                Log::info('Suscripción actualizada', [
                    'nuevo_estado' => 'activa',
                    'expira_en' => $suscripcion->expira_en,
                    'es_cambio_plan' => $esCambioPlan,
                    'monto_pagado_euros' => $paymentIntent->amount / 100
                ]);

                // Actualizar usuario
                $suscripcion->usuario->update([
                    'estado_suscripcion' => 'activa',
                    'suscripcion_expira_en' => $fechaExpiracion,
                    'plan_id' => $suscripcion->plan_id
                ]);

                Log::info('Usuario actualizado', [
                    'user_id' => $suscripcion->usuario->id,
                    'nuevo_estado_suscripcion' => 'activa',
                    'nuevo_plan_id' => $suscripcion->plan_id
                ]);

                return response()->json([
                    'exito' => true,
                    'message' => $esCambioPlan ? 'Cambio de plan completado exitosamente' : 'Pago confirmado exitosamente',
                    'es_cambio_plan' => $esCambioPlan,
                    'monto_pagado_euros' => $paymentIntent->amount / 100,
                    'suscripcion' => $suscripcion->load('plan'),
                    'payment_intent' => [
                        'id' => $paymentIntent->id,
                        'status' => $paymentIntent->status,
                        'amount_centimos' => $paymentIntent->amount,
                        'amount_euros' => $paymentIntent->amount / 100,
                        'currency' => $paymentIntent->currency,
                    ]
                ]);
            } else {
                Log::warning('Pago no completado', [
                    'status' => $paymentIntent->status,
                    'last_error' => $paymentIntent->last_payment_error ?? null
                ]);

                $suscripcion->update([
                    'estado' => 'pendiente',
                    'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                        'stripe_payment_method_id' => $request->payment_method_id,
                        'status' => $paymentIntent->status,
                        'last_error' => $paymentIntent->last_payment_error,
                    ])
                ]);

                return response()->json([
                    'exito' => false,
                    'message' => 'El pago no se completó',
                    'status' => $paymentIntent->status,
                    'requires_action' => $paymentIntent->status === 'requires_action',
                    'next_action' => $paymentIntent->next_action ?? null,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error en confirmPayment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payment_intent_id' => $request->payment_intent_id ?? 'null'
            ]);

            return response()->json([
                'exito' => false,
                'message' => 'Error al confirmar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar pago pendiente
     */
    public function cancelPayment(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required'
        ]);

        try {
            // Cancelar Payment Intent
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);
            $paymentIntent->cancel();

            // Actualizar suscripción
            $suscripcion = Suscripcion::where('transaccion_id', $request->payment_intent_id)->first();
            if ($suscripcion) {
                $suscripcion->update([
                    'estado' => 'cancelada',
                    'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                        'cancelled_at' => now(),
                        'reason' => 'user_cancelled'
                    ])
                ]);
            }

            return response()->json([
                'message' => 'Pago cancelado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al cancelar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manejar webhooks de Stripe
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, $endpointSecret
            );
        } catch (\UnexpectedValueException $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Procesar el evento
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $paymentIntent = $event->data->object;
                $this->handlePaymentIntentSucceeded($paymentIntent);
                break;

            case 'payment_intent.payment_failed':
                $paymentIntent = $event->data->object;
                $this->handlePaymentIntentFailed($paymentIntent);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Manejar pago exitoso desde webhook
     */
    private function handlePaymentIntentSucceeded($paymentIntent)
    {
        $suscripcion = Suscripcion::where('transaccion_id', $paymentIntent->id)->first();

        if ($suscripcion && $suscripcion->estado !== 'activa') {
            $suscripcion->update([
                'estado' => 'activa',
                'inicio_en' => now(),
                'expira_en' => now()->addDays($suscripcion->plan->duracion_dias),
                'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                    'stripe_charge_id' => $paymentIntent->latest_charge,
                    'status' => $paymentIntent->status,
                    'captured_at' => now(),
                    'webhook_processed' => true,
                    'amount_paid_centimos' => $paymentIntent->amount,
                    'amount_paid_euros' => $paymentIntent->amount / 100,
                ])
            ]);

            $suscripcion->usuario->update([
                'estado_suscripcion' => 'activa',
                'suscripcion_expira_en' => now()->addDays($suscripcion->plan->duracion_dias),
                'plan_id' => $suscripcion->plan_id
            ]);
        }
    }

    /**
     * Manejar pago fallido desde webhook
     */
    private function handlePaymentIntentFailed($paymentIntent)
    {
        $suscripcion = Suscripcion::where('transaccion_id', $paymentIntent->id)->first();

        if ($suscripcion) {
            $suscripcion->update([
                'estado' => 'cancelada',
                'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                    'status' => $paymentIntent->status,
                    'last_error' => $paymentIntent->last_payment_error,
                    'webhook_processed' => true,
                ])
            ]);
        }
    }

    /**
     * Endpoint de diagnóstico para Stripe
     */
    public function diagnose(Request $request)
    {
        Log::info('Diagnóstico Stripe llamado', [
            'user_id' => Auth::id(),
            'stripe_key_exists' => !empty(config('services.stripe.key')),
            'stripe_secret_exists' => !empty(config('services.stripe.secret')),
            'env' => app()->environment()
        ]);

        try {
            // Probar conexión con Stripe
            $balance = \Stripe\Balance::retrieve();

            // Probar que podemos crear un Payment Intent de prueba
            $testIntent = \Stripe\PaymentIntent::create([
                'amount' => 100,
                'currency' => 'eur',
                'payment_method_types' => ['card'],
                'metadata' => ['test' => 'diagnostic']
            ]);

            return response()->json([
                'status' => 'ok',
                'stripe_connection' => true,
                'balance_available' => $balance->available ?? [],
                'test_payment_intent' => [
                    'id' => $testIntent->id,
                    'client_secret' => substr($testIntent->client_secret, 0, 20) . '...',
                    'status' => $testIntent->status
                ],
                'config' => [
                    'key_exists' => !empty(config('services.stripe.key')),
                    'secret_exists' => !empty(config('services.stripe.secret')),
                    'mode' => app()->environment(),
                    'currency' => 'eur'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error en diagnóstico Stripe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'stripe_connection' => false,
                'error' => $e->getMessage(),
                'config' => [
                    'key_exists' => !empty(config('services.stripe.key')),
                    'secret_exists' => !empty(config('services.stripe.secret')),
                    'key_first_10' => substr(config('services.stripe.key'), 0, 10) . '...',
                    'secret_first_10' => substr(config('services.stripe.secret'), 0, 10) . '...',
                    'mode' => app()->environment()
                ]
            ], 500);
        }
    }
}
