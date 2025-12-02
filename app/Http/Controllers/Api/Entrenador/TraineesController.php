<?php
// app/Http/Controllers/Api/Entrenador/AsignacionController.php
namespace App\Http\Controllers\Api\Entrenador;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TraineesController extends Controller
{
    /**
     * Obtener todos los trainees asignados al entrenador autenticado
     */
    public function misTrainees()
    {
        $entrenador = auth()->user();
        $trainees = $entrenador->traineesAsignados()
            ->select('id', 'name', 'email', 'photo_url')
            ->get();

        return response()->json($trainees);
    }
}
