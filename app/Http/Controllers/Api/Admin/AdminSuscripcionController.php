<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Suscripcion;
use App\Models\User;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSuscripcionController extends Controller
{
    /**
     * Obtener todas las suscripciones
     */
    public function index(Request $request)
    {
        $query = Suscripcion::with(['usuario:id,name,email', 'plan:id,nombre'])
            ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('usuario_id')) {
            $query->where('usuario_id', $request->usuario_id);
        }

        $suscripciones = $query->paginate(20);

        return response()->json($suscripciones);
    }

    /**
     * Activar suscripción manualmente (admin)
     */
    public function activar(Request $request, $usuarioId)
    {
        $request->validate([
            'plan_id' => 'required|exists:planes,id',
            'duracion_dias' => 'integer|min:1|max:365',
            'nota' => 'nullable|string|max:255'
        ]);

        $usuario = User::findOrFail($usuarioId);
        $plan = Plan::findOrFail($request->plan_id);

        if (!$usuario->hasRole('trainee')) {
            return response()->json([
                'message' => 'Solo se pueden activar suscripciones para trainees'
            ], 422);
        }

        // Usar transacción para asegurar consistencia
        DB::beginTransaction();

        try {
            // Crear suscripción
            $suscripcion = Suscripcion::create([
                'usuario_id' => $usuario->id,
                'plan_id' => $plan->id,
                'estado' => 'activa',
                'inicio_en' => now(),
                'expira_en' => now()->addDays($request->duracion_dias ?? 30),
                'metodo_pago' => 'manual',
                'datos_facturacion' => [
                    'admin' => 'Administrador',
                    'nota' => $request->nota ?? 'Activado manualmente por admin'
                ],
                'transaccion_id' => 'admin_manual_' . now()->timestamp
            ]);

            // Actualizar usuario
            $usuario->update([
                'estado_suscripcion' => 'activa',
                'suscripcion_expira_en' => now()->addDays($request->duracion_dias ?? 30),
                'plan_id' => $plan->id
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Suscripción activada manualmente',
                'suscripcion' => $suscripcion->load('plan'),
                'usuario' => [
                    'id' => $usuario->id,
                    'name' => $usuario->name,
                    'email' => $usuario->email,
                    'estado_suscripcion' => $usuario->estado_suscripcion
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al activar suscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar suscripción de un usuario (admin)
     */
    public function cancelar($usuarioId)
    {
        $usuario = User::findOrFail($usuarioId);

        if (!$usuario->tieneSuscripcionActiva()) {
            return response()->json([
                'message' => 'El usuario no tiene una suscripción activa'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Cancelar suscripción activa
            $usuario->suscripcionActiva()->update(['estado' => 'cancelada']);

            // Actualizar usuario
            $usuario->update([
                'estado_suscripcion' => 'ninguna',
                'suscripcion_expira_en' => null,
                'plan_id' => null
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Suscripción cancelada',
                'usuario' => [
                    'id' => $usuario->id,
                    'name' => $usuario->name,
                    'email' => $usuario->email,
                    'estado_suscripcion' => $usuario->estado_suscripcion
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al cancelar suscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de suscripciones
     */
    public function estadisticas()
    {
        $total = Suscripcion::count();
        $activas = Suscripcion::where('estado', 'activa')
            ->where(function($query) {
                $query->whereNull('expira_en')
                    ->orWhere('expira_en', '>', now());
            })->count();

        $expiradas = Suscripcion::where('estado', 'expirada')->count();
        $canceladas = Suscripcion::where('estado', 'cancelada')->count();
        $pendientes = Suscripcion::where('estado', 'pendiente')->count();

        // Ingresos estimados de suscripciones activas
        $ingresosMensuales = Suscripcion::where('estado', 'activa')
            ->where(function($query) {
                $query->whereNull('expira_en')
                    ->orWhere('expira_en', '>', now());
            })
            ->with('plan')
            ->get()
            ->sum(function($suscripcion) {
                return $suscripcion->plan ? $suscripcion->plan->precio : 0;
            });

        $usuariosConSuscripcion = User::where('estado_suscripcion', 'activa')->count();
        $totalUsuariosTrainee = User::role('trainee')->count();

        return response()->json([
            'total_suscripciones' => $total,
            'suscripciones_activas' => $activas,
            'suscripciones_expiradas' => $expiradas,
            'suscripciones_canceladas' => $canceladas,
            'suscripciones_pendientes' => $pendientes,
            'ingresos_mensuales_estimados' => $ingresosMensuales,
            'usuarios_con_suscripcion' => $usuariosConSuscripcion,
            'total_usuarios_trainee' => $totalUsuariosTrainee,
            'porcentaje_con_suscripcion' => $totalUsuariosTrainee > 0 ?
                round(($usuariosConSuscripcion / $totalUsuariosTrainee) * 100, 2) : 0,
            'porcentaje_activas' => $total > 0 ? round(($activas / $total) * 100, 2) : 0
        ]);
    }

    /**
     * Obtener usuarios con/sin suscripción (para admin)
     */
    public function usuarios(Request $request)
    {
        $query = User::role('trainee')
            ->with(['plan:id,nombre', 'suscripcionActiva'])
            ->select('id', 'name', 'email', 'estado_suscripcion', 'suscripcion_expira_en', 'plan_id');

        // Filtrar por estado de suscripción
        if ($request->has('estado')) {
            if ($request->estado === 'activa') {
                $query->where('estado_suscripcion', 'activa')
                    ->where(function($q) {
                        $q->whereNull('suscripcion_expira_en')
                            ->orWhere('suscripcion_expira_en', '>', now());
                    });
            } else {
                $query->where('estado_suscripcion', $request->estado)
                    ->orWhere('estado_suscripcion', null);
            }
        }

        // Buscar por nombre o email
        if ($request->has('buscar')) {
            $buscar = $request->buscar;
            $query->where(function($q) use ($buscar) {
                $q->where('name', 'like', "%{$buscar}%")
                    ->orWhere('email', 'like', "%{$buscar}%");
            });
        }

        $usuarios = $query->orderBy('name')->paginate(20);

        return response()->json($usuarios);
    }
}
