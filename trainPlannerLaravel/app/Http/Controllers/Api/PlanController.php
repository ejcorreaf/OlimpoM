<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Obtener todos los planes activos
     */
    public function index()
    {
        $planes = Plan::activos()->ordenados()->get();

        return response()->json($planes);
    }

    /**
     * Mostrar un plan específico
     */
    public function show($id)
    {
        $plan = Plan::activos()->findOrFail($id);

        return response()->json($plan);
    }

    /**
     * Crear un nuevo plan (solo admin)
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'required|string|max:255',
            'precio' => 'required|numeric|min:0',
            'dias_por_semana' => 'required|integer|min:1|max:7',
            'duracion_dias' => 'integer|min:1',
            'caracteristicas' => 'array',
            'caracteristicas.*' => 'string|max:100',
            'activo' => 'boolean'
        ]);

        $plan = Plan::create($request->all());

        return response()->json([
            'message' => 'Plan creado exitosamente',
            'plan' => $plan
        ], 201);
    }

    /**
     * Actualizar un plan (solo admin)
     */
    public function update(Request $request, $id)
    {
        $plan = Plan::findOrFail($id);

        $request->validate([
            'nombre' => 'string|max:100',
            'descripcion' => 'string|max:255',
            'precio' => 'numeric|min:0',
            'dias_por_semana' => 'integer|min:1|max:7',
            'duracion_dias' => 'integer|min:1',
            'caracteristicas' => 'array',
            'caracteristicas.*' => 'string|max:100',
            'activo' => 'boolean'
        ]);

        $plan->update($request->all());

        return response()->json([
            'message' => 'Plan actualizado exitosamente',
            'plan' => $plan
        ]);
    }

    /**
     * Eliminar un plan (solo admin)
     */
    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);

        // Verificar si hay usuarios con este plan
        if ($plan->usuarios()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el plan porque hay usuarios suscritos'
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'message' => 'Plan eliminado exitosamente'
        ]);
    }
}
