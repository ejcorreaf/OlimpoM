<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Suscripcion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SuscripcionController extends Controller
{
    /**
     * Obtener suscripción del usuario actual
     */
    public function index()
    {
        $usuario = Auth::user();

        $suscripcion = $usuario->suscripcionActiva()->with('plan')->first();

        return response()->json([
            'suscripcion' => $suscripcion,
            'tiene_activa' => $usuario->tieneSuscripcionActiva()
        ]);
    }

    /**
     * Crear una nueva suscripción (iniciar pago)
     */
    public function store(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:planes,id',
            'metodo_pago' => 'required|in:paypal,tarjeta',
            'datos_facturacion' => 'nullable|array',
            'datos_facturacion.nombre' => 'required_with:datos_facturacion|string',
            'datos_facturacion.email' => 'required_with:datos_facturacion|email',
            'datos_facturacion.dni' => 'nullable|string'
        ]);

        $usuario = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        // Verificar que sea trainee
        if (!$usuario->hasRole('trainee')) {
            return response()->json([
                'message' => 'Solo los trainees pueden suscribirse'
            ], 403);
        }

        // Verificar si ya tiene suscripción activa
        if ($usuario->tieneSuscripcionActiva()) {
            return response()->json([
                'message' => 'Ya tienes una suscripción activa'
            ], 422);
        }

        // Crear intención de pago (simulada por ahora)
        $paymentIntent = [
            'intencion_pago_id' => 'pay_' . now()->timestamp . '_' . $usuario->id,
            'secreto_cliente' => null,
            'url_redireccion' => null,
            'estado' => 'pendiente'
        ];

        // En un entorno real, aquí integrarías con PayPal/Stripe
        if ($request->metodo_pago === 'paypal') {
            // Integración PayPal
            $paymentIntent['url_redireccion'] = $this->crearPagoPaypal($plan, $usuario);
        } else {
            // Integración tarjeta (Stripe)
            $paymentIntent['secreto_cliente'] = 'sk_test_' . uniqid();
        }

        // Crear suscripción pendiente
        $suscripcion = Suscripcion::create([
            'usuario_id' => $usuario->id,
            'plan_id' => $plan->id,
            'estado' => 'pendiente',
            'metodo_pago' => $request->metodo_pago,
            'datos_facturacion' => $request->datos_facturacion,
            'transaccion_id' => $paymentIntent['intencion_pago_id']
        ]);

        return response()->json([
            'message' => 'Intención de pago creada',
            'intencion_pago' => $paymentIntent,
            'suscripcion' => $suscripcion
        ]);
    }

    /**
     * Confirmar pago (webhook o callback)
     */
    public function confirmar($intencionPagoId)
    {
        $suscripcion = Suscripcion::where('transaccion_id', $intencionPagoId)
            ->with('usuario', 'plan')
            ->firstOrFail();

        // Verificar que el pago esté confirmado (en realidad esto vendría del webhook)
        $pagoConfirmado = true; // Simulación

        if ($pagoConfirmado) {
            // Activar suscripción
            $suscripcion->update([
                'estado' => 'activa',
                'inicio_en' => now(),
                'expira_en' => now()->addDays($suscripcion->plan->duracion_dias)
            ]);

            // Actualizar usuario
            $suscripcion->usuario->update([
                'estado_suscripcion' => 'activa',
                'suscripcion_expira_en' => now()->addDays($suscripcion->plan->duracion_dias),
                'plan_id' => $suscripcion->plan_id
            ]);

            return response()->json([
                'exito' => true,
                'message' => 'Pago confirmado y suscripción activada',
                'suscripcion' => $suscripcion->load('plan')
            ]);
        }

        return response()->json([
            'exito' => false,
            'message' => 'El pago no se ha confirmado'
        ], 400);
    }

    /**
     * Cancelar suscripción actual
     */
    public function destroy()
    {
        $usuario = Auth::user();

        if (!$usuario->tieneSuscripcionActiva()) {
            return response()->json([
                'message' => 'No tienes una suscripción activa'
            ], 422);
        }

        $usuario->cancelarSuscripcion();

        return response()->json([
            'message' => 'Suscripción cancelada exitosamente'
        ]);
    }

    /**
     * Verificar estado de pago
     */
    public function estado($intencionPagoId)
    {
        $suscripcion = Suscripcion::where('transaccion_id', $intencionPagoId)->first();

        if (!$suscripcion) {
            return response()->json([
                'estado' => 'no_encontrada'
            ], 404);
        }

        return response()->json([
            'estado' => $suscripcion->estado
        ]);
    }

    /**
     * Simular pago (solo para desarrollo)
     */
    public function simular(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:planes,id'
        ]);

        $usuario = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        // Activar suscripción manualmente
        $suscripcion = $usuario->activarSuscripcion(
            $plan->id,
            'manual',
            [
                'nombre' => $usuario->name,
                'email' => $usuario->email,
                'dni' => $usuario->dni
            ],
            $plan->duracion_dias
        );

        return response()->json([
            'exito' => true,
            'message' => 'Suscripción simulada y activada',
            'suscripcion' => $suscripcion->load('plan')
        ]);
    }

    /**
     * Crear pago PayPal (método simulado)
     */
    private function crearPagoPaypal($plan, $usuario)
    {
        // En producción, aquí integrarías con PayPal API
        // Por ahora simulamos una URL
        return 'https://www.sandbox.paypal.com/checkoutnow?token=' . uniqid();
    }

    /**
     * Cambiar de plan (upgrade/downgrade)
     */
    public function cambiarPlan(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:planes,id',
            'metodo_pago' => 'required|in:paypal,tarjeta',
            'confirmar_downgrade_gratuito' => 'boolean'
        ]);

        $usuario = Auth::user();
        $nuevoPlan = Plan::findOrFail($request->plan_id);

        // Verificar que sea trainee y tenga suscripción activa
        if (!$usuario->hasRole('trainee') || !$usuario->tieneSuscripcionActiva()) {
            return response()->json([
                'message' => 'Solo los trainees con suscripción activa pueden cambiar de plan'
            ], 403);
        }

        try {
            // Calcular cambio de plan
            $calculo = $usuario->cambiarPlan($nuevoPlan->id, $request->metodo_pago);

            // Si es downgrade gratuito (con crédito)
            if (isset($calculo['es_gratuito']) && $calculo['es_gratuito']) {
                if (!$request->confirmar_downgrade_gratuito) {
                    return response()->json([
                        'es_downgrade_gratuito' => true,
                        'credito_aplicado' => $calculo['credito_aplicado'],
                        'monto_cobrado' => 0,
                        'mensaje' => 'Este cambio de plan es gratuito. ¿Confirmar?'
                    ]);
                }

                // Aplicar cambio gratuito
                $suscripcion = $usuario->actualizarPlan($nuevoPlan->id);

                return response()->json([
                    'exito' => true,
                    'mensaje' => 'Plan cambiado exitosamente',
                    'es_gratuito' => true,
                    'credito_aplicado' => $calculo['credito_aplicado'],
                    'suscripcion' => $suscripcion->load('plan')
                ]);
            }

            // Si es upgrade o downgrade sin crédito suficiente
            $montoACobrar = $calculo['monto_a_cobrar'];

            if ($montoACobrar <= 0.01) { // Menos de 1 céntimo
                // Cambio prácticamente gratuito
                $suscripcion = $usuario->actualizarPlan($nuevoPlan->id);

                return response()->json([
                    'exito' => true,
                    'mensaje' => 'Plan cambiado exitosamente',
                    'monto_cobrado' => 0,
                    'suscripcion' => $suscripcion->load('plan')
                ]);
            }

            // Crear intención de pago por la diferencia
            // (Integrar con Stripe/PayPal similar a createPaymentIntent pero con el monto calculado)
            // Por ahora devolvemos los datos del cálculo

            return response()->json([
                'es_cambio_plan' => true,
                'monto_a_cobrar' => $montoACobrar,
                'credito_aplicado' => $calculo['credito_aplicado'],
                'dias_restantes' => $calculo['dias_restantes'],
                'plan_actual' => $usuario->plan,
                'nuevo_plan' => $nuevoPlan,
                'es_upgrade' => $calculo['es_upgrade'] ?? ($nuevoPlan->precio > $usuario->plan->precio),
                'necesita_pago' => $montoACobrar > 0
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al cambiar de plan: ' . $e->getMessage()
            ], 500);
        }
    }
}
