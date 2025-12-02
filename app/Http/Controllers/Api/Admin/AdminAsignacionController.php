<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminAsignacionController extends Controller
{
    /**
     * Obtener todos los entrenadores con sus trainees asignados
     */
    public function index()
    {
        $entrenadores = User::role('trainer')
            ->with(['traineesAsignados:id,name,email,photo_url'])
            ->select('id', 'name', 'email')
            ->get();

        return response()->json($entrenadores);
    }

    /**
     * Asignar un trainee a un entrenador
     */
    public function store(Request $request)
    {
        $request->validate([
            'entrenador_id' => 'required|exists:users,id',
            'trainee_id' => 'required|exists:users,id'
        ]);

        $entrenador = User::findOrFail($request->entrenador_id);
        $trainee = User::findOrFail($request->trainee_id);

        // Verificar roles
        if (!$entrenador->hasRole('trainer')) {
            return response()->json(['message' => 'El usuario debe ser un entrenador'], 422);
        }

        if (!$trainee->hasRole('trainee')) {
            return response()->json(['message' => 'El usuario debe ser un trainee'], 422);
        }

        // Verificar que no esté ya asignado
        if ($entrenador->traineesAsignados()->where('trainee_id', $trainee->id)->exists()) {
            return response()->json(['message' => 'Este trainee ya está asignado a este entrenador'], 422);
        }

        $entrenador->traineesAsignados()->attach($trainee->id);

        return response()->json(['message' => 'Trainee asignado correctamente al entrenador']);
    }

    /**
     * Desasignar un trainee de un entrenador
     */
    public function destroy($entrenadorId, $traineeId)
    {
        $entrenador = User::findOrFail($entrenadorId);
        $entrenador->traineesAsignados()->detach($traineeId);

        return response()->json(['message' => 'Trainee desasignado correctamente']);
    }

    /**
     * Obtener trainees no asignados
     */
    public function traineesNoAsignados()
    {
        $traineesAsignados = \DB::table('entrenador_trainee')->pluck('trainee_id');

        $trainees = User::role('trainee')
            ->whereNotIn('id', $traineesAsignados)
            ->select('id', 'name', 'email', 'photo_url')
            ->get();

        return response()->json($trainees);
    }

    /**
     * Obtener todos los entrenadores
     */
    public function entrenadores()
    {
        $entrenadores = User::role('trainer')
            ->select('id', 'name', 'email')
            ->get();

        return response()->json($entrenadores);
    }
}
