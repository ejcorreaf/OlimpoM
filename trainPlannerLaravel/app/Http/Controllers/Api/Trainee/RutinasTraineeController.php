<?php

namespace App\Http\Controllers\Api\Trainee;

use App\Http\Controllers\Controller;
use App\Models\Rutina;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RutinasTraineeController extends Controller
{
    /**
     * Muestra un listado de todas las rutinas del trainee autenticado.
     *
     * - Usa el ID del usuario autenticado (Auth::id()) para obtener solo sus rutinas.
     * - Incluye la relación 'ejercicios' para devolver también los ejercicios
     *   asignados a cada rutina.
     *
     */
    public function index()
    {
        // Obtiene todas las rutinas del usuario logueado junto con sus ejercicios
        $rutinas = Rutina::with('ejercicios')
            ->where('user_id', Auth::id())
            ->get();

        // Devuelve la colección en formato JSON
        return response()->json($rutinas);
    }

    /**
     * Muestra la rutina específicada del trainee autenticado.
     */
    public function show($id)
    {
        // Busca la rutina solo si pertenece al usuario autenticado
        $rutina = Rutina::with('ejercicios')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        // Si no se encuentra o no pertenece al trainee → error 404
        if (!$rutina) {
            return response()->json(['message' => 'Rutina no encontrada o acceso denegado'], 404);
        }

        // Devuelve la rutina junto a sus ejercicios
        return response()->json($rutina);
    }
}

