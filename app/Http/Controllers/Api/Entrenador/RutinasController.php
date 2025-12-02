<?php

namespace App\Http\Controllers\Api\Entrenador;

use App\Http\Controllers\Controller;
use App\Http\Requests\RutinasStoreRequest;
use App\Http\Requests\RutinasUpdateRequest;
use App\Models\Rutina;
use App\Models\User;
use Illuminate\Http\Request;

class RutinasController extends Controller
{
    /**
     * Muestra un listado de todas las rutinas junto al trainee asociado.
     * Permite filtrar por nombre del usuario mediante ?search=.
     */
    public function index(Request $request)
    {
        try {
            $search = $request->get('search', '');
            $entrenador = auth()->user();

            // Obtener IDs de los trainees asignados
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            // Si no tiene trainees asignados, devolver array vacío
            if (empty($traineeIds)) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'total' => 0,
                    'per_page' => 10
                ]);
            }

            $rutinas = Rutina::with('usuario:id,name,email')
                ->whereIn('user_id', $traineeIds) // Solo rutinas de trainees asignados
                ->when($search, function($q) use ($search) {
                    return $q->whereHas('usuario', function($u) use ($search) {
                        $u->where('name','like',"%{$search}%");
                    });
                })
                ->paginate(10);

            return response()->json($rutinas);

        } catch (\Exception $e) {
            \Log::error('Error en RutinasController@index: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al cargar las rutinas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Almacena una rutina recien creada para un trainee dado.
     * El trainee se busca por su email.
     */
    public function store(RutinasStoreRequest $request)
    {
        $data = $request->validated();
        $entrenador = auth()->user();

        // Buscar el trainee por email
        $trainee = User::where('email', $data['email'])->first();

        if (!$trainee) {
            return response()->json(['message' => 'Trainee no encontrado'], 404);
        }

        // Verificar que el trainee tenga rol 'trainee'
        if (!$trainee->hasRole('trainee')) {
            return response()->json(['message' => 'El usuario debe ser un trainee'], 422);
        }

        // Verificar que el trainee esté asignado a este entrenador
        $estaAsignado = $entrenador->traineesAsignados()
            ->where('id', $trainee->id)
            ->exists();

        if (!$estaAsignado) {
            return response()->json(['message' => 'Este trainee no está asignado a ti'], 403);
        }

        $rutina = Rutina::create([
            'user_id' => $trainee->id,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
        ]);

        return response()->json(['message'=>'Rutina creada','rutina'=>$rutina], 201);
    }

    /**
     * Muestra la rutina especificada junto a su usuario y ejercicios asociados.
     */
    public function show(Rutina $rutina)
    {
        $rutina->load(['usuario','ejercicios']);
        return response()->json($rutina);
    }

    /**
     * Actualiza/Modifica la rutina especificada y reasigna el trainee si se cambia el email.
     */
    public function update(RutinasUpdateRequest $request, Rutina $rutina)
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();
        if (!$user) return response()->json(['message'=>'Usuario no encontrado'], 404);

        $rutina->update([
            'user_id' => $user->id,
            'nombre' => $data['nombre'] ?? $rutina->nombre,
            'descripcion' => $data['descripcion'] ?? $rutina->descripcion,
        ]);

        return response()->json(['message'=>'Rutina actualizada','rutina'=>$rutina]);
    }

    /**
     * Elimina la rutina especificada de la BBDD.
     */
    public function destroy(Rutina $rutina)
    {
        $rutina->delete();
        return response()->json(['message'=>'Rutina eliminada']);
    }

    /**
     * Asigna varios ejercicios a una rutina específica con
     * parámetros adicionales (series, repeticiones, descanso).
     */
    public function asignarEjercicios(Request $request, Rutina $rutina)
    {
        $request->validate([
            'ejercicios' => 'required|array|min:1',
            'ejercicios.*.id' => 'required|exists:ejercicios,id',
            'ejercicios.*.series' => 'required|integer|min:1',
            'ejercicios.*.repeticiones' => 'required|integer|min:1',
            'ejercicios.*.descanso' => 'required|integer|min:0',
        ]);

        // Preparamos los datos para attach/sync
        $datos = [];
        foreach ($request->ejercicios as $ej) {
            $datos[$ej['id']] = [
                'series' => $ej['series'],
                'repeticiones' => $ej['repeticiones'],
                'descanso' => $ej['descanso'],
            ];
        }

        // Asigna ejercicios sin eliminar los existentes (usa sync() para reemplazar)
        $rutina->ejercicios()->attach($datos);
        return response()->json(['message'=>'Ejercicios asignados']);
    }

    /**
     * Devuelve todos los ejercicios asociados a una rutina.
     */
    public function verEjercicios(Rutina $rutina)
    {
        return response()->json($rutina->load('ejercicios')->ejercicios);
    }

    /**
     * Reemplaza completamente los ejercicios de una rutina
     * por los enviados en la solicitud.
     */
    public function sincronizarEjercicios(Request $request, Rutina $rutina)
    {
        $request->validate([
            'ejercicios' => 'required|array|min:1',
            'ejercicios.*.id' => 'required|exists:ejercicios,id',
            'ejercicios.*.series' => 'required|integer|min:1',
            'ejercicios.*.repeticiones' => 'required|integer|min:1',
            'ejercicios.*.descanso' => 'required|integer|min:0',
        ]);

        $datos = [];
        foreach ($request->ejercicios as $ej) {
            $datos[$ej['id']] = [
                'series' => $ej['series'],
                'repeticiones' => $ej['repeticiones'],
                'descanso' => $ej['descanso'],
            ];
        }

        // sync() elimina los anteriores y asigna los nuevos
        $rutina->ejercicios()->sync($datos);
        return response()->json(['message'=>'Ejercicios sincronizados']);
    }

    /**
     * Quita un solo ejercicio de la rutina sin eliminarlo de la base de datos.
     */
    public function eliminarEjercicio(Rutina $rutina, $ejercicioId)
    {
        $rutina->ejercicios()->detach($ejercicioId);
        return response()->json(['message'=>'Ejercicio eliminado de la rutina']);
    }


    /**
     * Devuelve todos los trainees asignados al entrenador autenticado.
     */
    public function trainees()
    {
        $entrenador = auth()->user();

        // ESPECIFICA LA TABLA en el select
        $trainees = $entrenador->traineesAsignados()
            ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
            ->get();

        return response()->json($trainees);
    }
}

