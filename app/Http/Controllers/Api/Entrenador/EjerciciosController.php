<?php

namespace App\Http\Controllers\Api\Entrenador;

use App\Http\Controllers\Controller;
use App\Http\Requests\EjercicioStoreRequest;
use App\Http\Requests\EjercicioUpdateRequest;
use App\Models\Ejercicio;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EjerciciosController extends Controller
{
    /**
     * Muestra un listado de todos los ejercicios.
     */
    public function index()
    {
        return Ejercicio::all(['id', 'nombre', 'descripcion', 'grupo_muscular', 'foto']);
    }

    /**
     * Almacena un ejercicio recien creado en la BBDD.
     * Además permite subir una imagen opcional que se guardará en /public/ejercicios.
     */
    public function store(EjercicioStoreRequest $request)
    {
        $data = $request->validated();

        //Si se sube una foto, se almacena
        if ($request->hasFile('foto')) {
            $filename = Str::uuid() . '.' . $request->foto->getClientOriginalExtension();
            $request->foto->move(public_path('ejercicios'), $filename);
            $data['foto'] = $filename;
        }

        return Ejercicio::create($data);
    }

    /**
     * Muestra el ejercicio especificado.
     */
    public function show(Ejercicio $ejercicio)
    {
        return $ejercicio;
    }

    /**
     * Actualiza/Modifica el ejercicio especificado de la BBDD.
     */
    public function update(EjercicioUpdateRequest $request, Ejercicio $ejercicio)
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $filename = Str::uuid() . '.' . $request->foto->getClientOriginalExtension();
            $request->foto->move(public_path('ejercicios'), $filename);
            $data['foto'] = $filename;
        }

        $ejercicio->update($data);
        return $ejercicio;
    }

    /**
     * Elimina el ejercicio especificado de la BBDD.
     */
    public function destroy(Ejercicio $ejercicio)
    {
        $ejercicio->delete();
        return response()->json(['message'=>'Ejercicio eliminado']);
    }
}
