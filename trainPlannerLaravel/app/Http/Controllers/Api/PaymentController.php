<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Suscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PaymentController extends Controller
{
    private $provider;

    public function __construct()
    {
        $this->provider = new PayPalClient;

        // Configurar credenciales
        $config = [
            'mode'    => config('paypal.mode'),
            'sandbox' => [
                'client_id'     => config('paypal.sandbox.client_id'),
                'client_secret' => config('paypal.sandbox.client_secret'),
                'app_id'        => config('paypal.sandbox.app_id'),
            ],
            'live' => [
                'client_id'     => config('paypal.live.client_id'),
                'client_secret' => config('paypal.live.client_secret'),
                'app_id'        => config('paypal.live.app_id'),
            ],
            'payment_action' => 'Sale',
            'currency'       => config('paypal.currency', 'EUR'),
            'notify_url'     => '',
            'locale'         => config('paypal.locale', 'es_ES'),
            'validate_ssl'   => true,
        ];

        $this->provider->setApiCredentials($config);
        $this->provider->getAccessToken();
    }

    /**
     * Crear orden de PayPal
     */
    public function createOrder(Request $request)
    {
        Log::info('CreateOrder PayPal llamado', [
            'plan_id' => $request->plan_id,
            'user_id' => Auth::id()
        ]);

        $request->validate([
            'plan_id' => 'required|exists:planes,id',
            'datos_facturacion' => 'nullable|array',
        ]);

        $usuario = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        // Verificar que sea trainee
        if (!$usuario->hasRole('trainee')) {
            return response()->json([
                'message' => 'Solo los trainees pueden suscribirse'
            ], 403);
        }

        // CORRECCIÓN IMPORTANTE: No cancelar suscripción actual aquí
        $tieneSuscripcionActiva = $usuario->tieneSuscripcionActiva();
        $esCambioPlan = $tieneSuscripcionActiva && $usuario->plan_id != $plan->id;

        if ($esCambioPlan) {
            Log::info('Cambio de plan via PayPal detectado - NO cancelar suscripción actual', [
                'user_id' => $usuario->id,
                'plan_actual_id' => $usuario->plan_id,
                'nuevo_plan_id' => $plan->id,
                'es_upgrade' => $plan->precio > $usuario->plan->precio
            ]);

            // IMPORTANTE: NO cancelamos la suscripción actual aquí
            // Solo se cancelará después de que el nuevo pago sea exitoso
        }

        // Crear orden en PayPal
        $orderData = [
            'intent' => 'CAPTURE',
            'purchase_units' => [
                [
                    'reference_id' => 'plan_' . $plan->id . '_user_' . $usuario->id,
                    'amount' => [
                        'currency_code' => config('paypal.currency', 'EUR'),
                        'value' => number_format($plan->precio, 2, '.', '')
                    ],
                    'description' => $plan->nombre . ' - ' . $plan->descripcion,
                ]
            ],
            'application_context' => [
                'brand_name' => 'TrainPlanner',
                'locale' => 'es-ES',
                'landing_page' => 'BILLING',
                'shipping_preference' => 'NO_SHIPPING',
                'user_action' => 'PAY_NOW',
                'return_url' => config('app.frontend_url') . '/subscription/success',
                'cancel_url' => config('app.frontend_url') . '/subscription/cancel',
            ]
        ];

        try {
            $response = $this->provider->createOrder($orderData);

            if (isset($response['id']) && $response['status'] === 'CREATED') {
                // Crear suscripción pendiente en nuestra base de datos
                $suscripcion = Suscripcion::create([
                    'usuario_id' => $usuario->id,
                    'plan_id' => $plan->id,
                    'estado' => 'pendiente',
                    'metodo_pago' => 'paypal',
                    'datos_facturacion' => $request->datos_facturacion,
                    'transaccion_id' => $response['id'],
                    'es_cambio_plan' => $esCambioPlan, // Marcar si es cambio
                    'plan_anterior_id' => $esCambioPlan ? $usuario->plan_id : null // Guardar plan anterior
                ]);

                Log::info('Orden PayPal creada', [
                    'order_id' => $response['id'],
                    'suscripcion_id' => $suscripcion->id,
                    'es_cambio_plan' => $esCambioPlan,
                    'plan_anterior_id' => $esCambioPlan ? $usuario->plan_id : null
                ]);

                return response()->json([
                    'message' => $esCambioPlan ? 'Cambio de plan iniciado' : 'Orden creada exitosamente',
                    'es_cambio_plan' => $esCambioPlan,
                    'order_id' => $response['id'],
                    'approval_url' => collect($response['links'])->firstWhere('rel', 'approve')['href'],
                    'suscripcion' => $suscripcion
                ]);
            }

            Log::error('Error creando orden PayPal', ['response' => $response]);
            return response()->json([
                'message' => 'Error al crear la orden de PayPal',
                'error' => $response
            ], 500);

        } catch (\Exception $e) {
            Log::error('Error en createOrder PayPal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al procesar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Capturar orden de PayPal (cuando el usuario completa el pago)
     */
    public function captureOrder(Request $request, $orderId)
    {
        Log::info('CaptureOrder PayPal llamado', ['order_id' => $orderId]);

        try {
            // Capturar el pago en PayPal
            $response = $this->provider->capturePaymentOrder($orderId);

            // Buscar la suscripción pendiente
            $suscripcion = Suscripcion::where('transaccion_id', $orderId)
                ->with('plan', 'usuario')
                ->first();

            if (!$suscripcion) {
                Log::error('Suscripción no encontrada para PayPal', ['order_id' => $orderId]);
                return response()->json([
                    'exito' => false,
                    'message' => 'Suscripción no encontrada'
                ], 404);
            }

            if (isset($response['status']) && $response['status'] === 'COMPLETED') {
                $esCambioPlan = $suscripcion->es_cambio_plan ?? false;
                $planAnteriorId = $suscripcion->plan_anterior_id ?? null;

                Log::info('Pago PayPal completado', [
                    'suscripcion_id' => $suscripcion->id,
                    'es_cambio_plan' => $esCambioPlan,
                    'plan_anterior_id' => $planAnteriorId
                ]);

                // SOLO si es cambio de plan y el pago fue exitoso, cancelar la anterior
                if ($esCambioPlan && $planAnteriorId) {
                    Log::info('Cambio de plan exitoso - Cancelando suscripción anterior', [
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

                // Activar suscripción
                $suscripcion->update([
                    'estado' => 'activa',
                    'inicio_en' => now(),
                    'expira_en' => now()->addDays($suscripcion->plan->duracion_dias),
                    'datos_pago' => array_merge($suscripcion->datos_pago ?? [], [
                        'capture_id' => $response['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                        'amount' => $response['purchase_units'][0]['payments']['captures'][0]['amount']['value'] ?? 0,
                        'paypal_response' => $response,
                        'captured_at' => now(),
                    ])
                ]);

                // Actualizar usuario
                $suscripcion->usuario->update([
                    'estado_suscripcion' => 'activa',
                    'suscripcion_expira_en' => now()->addDays($suscripcion->plan->duracion_dias),
                    'plan_id' => $suscripcion->plan_id
                ]);

                Log::info('Suscripción activada via PayPal', [
                    'user_id' => $suscripcion->usuario->id,
                    'es_cambio_plan' => $esCambioPlan
                ]);

                return response()->json([
                    'exito' => true,
                    'message' => $esCambioPlan ? 'Cambio de plan completado' : 'Pago completado exitosamente',
                    'es_cambio_plan' => $esCambioPlan,
                    'suscripcion' => $suscripcion->load('plan'),
                    'paypal_response' => $response
                ]);
            }

            Log::warning('Pago PayPal no completado', [
                'status' => $response['status'] ?? 'unknown',
                'suscripcion_id' => $suscripcion->id
            ]);

            return response()->json([
                'exito' => false,
                'message' => 'No se pudo completar el pago',
                'response' => $response
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error en captureOrder PayPal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'order_id' => $orderId
            ]);

            return response()->json([
                'exito' => false,
                'message' => 'Error al capturar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar orden (cuando el usuario cancela en PayPal)
     * IMPORTANTE: NO cancelar la suscripción actual si es cambio de plan
     */
    public function cancelOrder(Request $request)
    {
        $request->validate([
            'order_id' => 'required'
        ]);

        Log::info('CancelOrder PayPal llamado', [
            'order_id' => $request->order_id,
            'user_id' => Auth::id()
        ]);

        $usuario = Auth::user();
        $suscripcionPendiente = Suscripcion::where('transaccion_id', $request->order_id)
            ->where('estado', 'pendiente')
            ->first();

        if ($suscripcionPendiente) {
            $esCambioPlan = $suscripcionPendiente->es_cambio_plan ?? false;

            Log::info('Cancelando suscripción pendiente de PayPal', [
                'suscripcion_id' => $suscripcionPendiente->id,
                'es_cambio_plan' => $esCambioPlan,
                'plan_anterior_id' => $suscripcionPendiente->plan_anterior_id ?? null
            ]);

            // Solo marcar como cancelada la suscripción PENDIENTE
            // NO cancelar la suscripción ACTIVA actual si es cambio de plan
            $suscripcionPendiente->update([
                'estado' => 'cancelada',
                'datos_pago' => array_merge($suscripcionPendiente->datos_pago ?? [], [
                    'cancelled_at' => now(),
                    'reason' => 'user_cancelled_paypal',
                    'es_cambio_plan' => $esCambioPlan
                ])
            ]);

            Log::info('Suscripción pendiente cancelada - SUSCRIPCIÓN ACTUAL MANTENIDA', [
                'user_id' => $usuario->id,
                'tiene_suscripcion_activa' => $usuario->tieneSuscripcionActiva(),
                'plan_actual_id' => $usuario->plan_id
            ]);
        }

        return response()->json([
            'message' => 'Orden cancelada - Tu suscripción actual sigue activa',
            'redirect_url' => config('app.frontend_url') . '/subscription/cancel'
        ]);
    }

    /**
     * Verificar estado de una orden
     */
    public function checkOrderStatus($orderId)
    {
        try {
            $response = $this->provider->showOrderDetails($orderId);

            return response()->json([
                'estado' => $response['status'],
                'detalles' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'estado' => 'error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manejar webhook de PayPal
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        $eventType = $payload['event_type'] ?? null;

        Log::info('PayPal Webhook recibido', [
            'event_type' => $eventType,
            'payload' => $payload
        ]);

        switch ($eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                $orderId = $payload['resource']['supplementary_data']['related_ids']['order_id'] ?? null;
                if ($orderId) {
                    // Llamar al método captureOrder para procesar
                    $captureRequest = new Request();
                    $this->captureOrder($captureRequest, $orderId);
                }
                break;

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.REVERSED':
                $orderId = $payload['resource']['supplementary_data']['related_ids']['order_id'] ?? null;
                if ($orderId) {
                    $suscripcion = Suscripcion::where('transaccion_id', $orderId)->first();
                    if ($suscripcion) {
                        // Solo cancelar la suscripción pendiente
                        $suscripcion->update(['estado' => 'cancelada']);
                        Log::info('Suscripción cancelada por webhook PayPal', [
                            'order_id' => $orderId,
                            'event_type' => $eventType
                        ]);
                    }
                }
                break;
        }

        return response()->json(['status' => 'success']);
    }
}
