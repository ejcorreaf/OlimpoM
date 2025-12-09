<?php

namespace App\Http\Controllers\Api\Entrenador;

use App\Http\Controllers\Controller;
use App\Http\Requests\RutinasStoreRequest;
use App\Http\Requests\RutinasUpdateRequest;
use App\Models\Rutina;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RutinasController extends Controller
{
    /**
     * Muestra un listado de todas las rutinas de trainees asignados.
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
                ->whereIn('user_id', $traineeIds)
                ->when($search, function($q) use ($search) {
                    return $q->whereHas('usuario', function($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%");
                    });
                })
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json($rutinas);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@index: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al cargar las rutinas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Almacena una rutina recien creada para un trainee dado.
     */
    public function store(RutinasStoreRequest $request)
    {
        try {
            $data = $request->validated();
            $entrenador = auth()->user();

            Log::info('Creando rutina para entrenador', [
                'entrenador_id' => $entrenador->id,
                'email_buscado' => $data['email']
            ]);

            // Buscar el trainee por email
            $trainee = User::where('email', $data['email'])->first();

            if (!$trainee) {
                return response()->json([
                    'message' => 'Trainee no encontrado con el email proporcionado'
                ], 404);
            }

            // Verificar que el trainee tenga rol 'trainee'
            if (!$trainee->hasRole('trainee')) {
                return response()->json([
                    'message' => 'El usuario debe ser un trainee'
                ], 422);
            }

            // Verificar que el trainee esté asignado a este entrenador
            $estaAsignado = $entrenador->traineesAsignados()
                ->where('users.id', $trainee->id)
                ->exists();

            if (!$estaAsignado) {
                return response()->json([
                    'message' => 'Este trainee no está asignado a ti'
                ], 403);
            }

            // Crear la rutina
            $rutina = Rutina::create([
                'user_id' => $trainee->id,
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
            ]);

            Log::info('Rutina creada exitosamente', [
                'rutina_id' => $rutina->id,
                'trainee_id' => $trainee->id,
                'entrenador_id' => $entrenador->id
            ]);

            return response()->json([
                'message' => 'Rutina creada exitosamente',
                'rutina' => $rutina->load('usuario:id,name,email')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@store: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->all(),
                'user' => auth()->user()->id
            ]);

            return response()->json([
                'message' => 'Error interno al crear la rutina',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Muestra la rutina especificada.
     */
    public function show(Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para ver esta rutina'
                ], 403);
            }

            $rutina->load(['usuario:id,name,email', 'ejercicios']);
            return response()->json($rutina);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@show: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al cargar la rutina'
            ], 500);
        }
    }

    /**
     * Actualiza la rutina especificada.
     */
    public function update(RutinasUpdateRequest $request, Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para editar esta rutina'
                ], 403);
            }

            $data = $request->validated();

            // Si se cambia el email, verificar el nuevo trainee
            if (isset($data['email']) && $data['email'] !== $rutina->usuario->email) {
                $user = User::where('email', $data['email'])->first();

                if (!$user) {
                    return response()->json([
                        'message' => 'Usuario no encontrado'
                    ], 404);
                }

                // Verificar que el nuevo trainee esté asignado al entrenador
                if (!in_array($user->id, $traineeIds)) {
                    return response()->json([
                        'message' => 'El nuevo trainee no está asignado a ti'
                    ], 403);
                }

                $data['user_id'] = $user->id;
            }

            $rutina->update($data);

            return response()->json([
                'message' => 'Rutina actualizada',
                'rutina' => $rutina->load('usuario:id,name,email')
            ]);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@update: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar la rutina'
            ], 500);
        }
    }

    /**
     * Elimina la rutina especificada.
     */
    public function destroy(Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para eliminar esta rutina'
                ], 403);
            }

            $rutina->delete();

            return response()->json([
                'message' => 'Rutina eliminada'
            ]);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@destroy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la rutina'
            ], 500);
        }
    }

    /**
     * Asigna ejercicios a una rutina.
     */
    public function asignarEjercicios(Request $request, Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para modificar esta rutina'
                ], 403);
            }

            $request->validate([
                'ejercicios' => 'required|array|min:1',
                'ejercicios.*.id' => 'required|exists:ejercicios,id',
                'ejercicios.*.series' => 'required|integer|min:1',
                'ejercicios.*.repeticiones' => 'required|integer|min:1',
                'ejercicios.*.peso' => 'required|numeric|min:0',
                'ejercicios.*.descanso' => 'required|integer|min:0',
            ]);

            $datos = [];
            foreach ($request->ejercicios as $ej) {
                $datos[$ej['id']] = [
                    'series' => $ej['series'],
                    'repeticiones' => $ej['repeticiones'],
                    'descanso' => $ej['descanso'],
                    'peso' => $ej['peso'] ?? 0,
                ];
            }


            $rutina->ejercicios()->attach($datos);

            return response()->json([
                'message' => 'Ejercicios asignados'
            ]);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@asignarEjercicios: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al asignar ejercicios'
            ], 500);
        }
    }

    /**
     * Devuelve todos los ejercicios asociados a una rutina.
     */
    public function verEjercicios(Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para ver esta rutina'
                ], 403);
            }

            return response()->json(
                $rutina->load('ejercicios')->ejercicios
            );

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@verEjercicios: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al cargar ejercicios'
            ], 500);
        }
    }

    /**
     * Reemplaza completamente los ejercicios de una rutina.
     */
    public function sincronizarEjercicios(Request $request, Rutina $rutina)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para modificar esta rutina'
                ], 403);
            }

            $request->validate([
                'ejercicios' => 'required|array|min:1',
                'ejercicios.*.id' => 'required|exists:ejercicios,id',
                'ejercicios.*.series' => 'required|integer|min:1',
                'ejercicios.*.repeticiones' => 'required|integer|min:1',
                'ejercicios.*.peso' => 'required|numeric|min:0',
                'ejercicios.*.descanso' => 'required|integer|min:0',
            ]);

            $datos = [];
            foreach ($request->ejercicios as $ej) {
                $datos[$ej['id']] = [
                    'series' => $ej['series'],
                    'repeticiones' => $ej['repeticiones'],
                    'descanso' => $ej['descanso'],
                    'peso' => $ej['peso'] ?? 0,
                ];
            }

            $rutina->ejercicios()->sync($datos);

            return response()->json([
                'message' => 'Ejercicios sincronizados'
            ]);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@sincronizarEjercicios: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al sincronizar ejercicios'
            ], 500);
        }
    }

    /**
     * Elimina un ejercicio de la rutina.
     */
    public function eliminarEjercicio(Rutina $rutina, $ejercicioId)
    {
        try {
            // Verificar que la rutina pertenezca a un trainee asignado
            $entrenador = auth()->user();
            $traineeIds = $entrenador->traineesAsignados()->pluck('users.id')->toArray();

            if (!in_array($rutina->user_id, $traineeIds)) {
                return response()->json([
                    'message' => 'No tienes permiso para modificar esta rutina'
                ], 403);
            }

            $rutina->ejercicios()->detach($ejercicioId);

            return response()->json([
                'message' => 'Ejercicio eliminado de la rutina'
            ]);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@eliminarEjercicio: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el ejercicio'
            ], 500);
        }
    }

    /**
     * Devuelve todos los trainees asignados al entrenador.
     */
    public function trainees()
    {
        try {
            $entrenador = auth()->user();

            $trainees = $entrenador->traineesAsignados()
                ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                ->get();

            return response()->json($trainees);

        } catch (\Exception $e) {
            Log::error('Error en RutinasController@trainees: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al cargar trainees'
            ], 500);
        }
    }
}
