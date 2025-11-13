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
        $search = $request->get('search', '');
        $rutinas = Rutina::with('usuario')
            ->when($search, fn($q) => $q->whereHas('usuario', fn($u) => $u->where('name','like',"%$search%")))
            ->paginate(10);
        return response()->json($rutinas);
    }

    /**
     * Almacena una rutina recien creada para un trainee dado.
     * El trainee se busca por su email.
     */
    public function store(RutinasStoreRequest $request)
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();
        if (!$user) return response()->json(['message'=>'Usuario no encontrado'], 404);

        $rutina = Rutina::create([
            'user_id' => $user->id,
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
     * Devuelve todos los usuarios con el rol "trainee".
     * Útil para el entrenador al crear o asignar rutinas.
     */
    public function trainees()
    {
        $trainees = User::role('trainee')->select('name','email')->get();
        return response()->json($trainees);
    }
}

