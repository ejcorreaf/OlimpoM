<?php

namespace App\Http\Controllers\Api\Entrenador;

use App\Http\Controllers\Controller;
use App\Models\Ejercicio;
use Illuminate\Http\Request;

class EjerciciosController extends Controller
{
    /**
     * Muestra un listado de todos los ejercicios con filtros.
     */
    public function index(Request $request)
    {
        $query = Ejercicio::query();

        // Filtro por grupo muscular
        if ($request->has('grupo_muscular') && $request->grupo_muscular) {
            $query->where('grupo_muscular', $request->grupo_muscular);
        }

        // Filtro por búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                    ->orWhere('descripcion', 'LIKE', "%{$search}%")
                    ->orWhere('grupo_muscular', 'LIKE', "%{$search}%");
            });
        }

        // Paginación opcional
        if ($request->has('per_page')) {
            $perPage = $request->per_page;
            return $query->paginate($perPage);
        }

        return $query->get(['id', 'nombre', 'descripcion', 'grupo_muscular', 'foto']);
    }

    /**
     * Obtiene todos los grupos musculares únicos disponibles.
     */
    public function gruposMusculares()
    {
        $grupos = Ejercicio::select('grupo_muscular')
            ->distinct()
            ->orderBy('grupo_muscular')
            ->pluck('grupo_muscular');

        return response()->json($grupos);
    }

    /**
     * Muestra el ejercicio especificado.
     */
    public function show(Ejercicio $ejercicio)
    {
        return response()->json([
            'id' => $ejercicio->id,
            'nombre' => $ejercicio->nombre,
            'descripcion' => $ejercicio->descripcion,
            'grupo_muscular' => $ejercicio->grupo_muscular,
            'foto' => $ejercicio->foto,
            'created_at' => $ejercicio->created_at,
            'updated_at' => $ejercicio->updated_at
        ]);
    }

    /**
     * Obtiene estadísticas de ejercicios.
     */
    public function estadisticas()
    {
        $total = Ejercicio::count();
        $porGrupo = Ejercicio::select('grupo_muscular')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('grupo_muscular')
            ->orderBy('grupo_muscular')
            ->get();

        return response()->json([
            'total_ejercicios' => $total,
            'ejercicios_por_grupo' => $porGrupo
        ]);
    }
}
