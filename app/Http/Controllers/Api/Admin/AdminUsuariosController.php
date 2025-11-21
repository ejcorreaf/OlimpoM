<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUsuariosController extends Controller
{
    /**
     * Mostrar todos los usuarios.
     */
    public function index()
    {
        return response()->json(User::all());
    }

    /**
     * Crear un nuevo usuario.
     */
    public function store(UserStoreRequest $request)
    {
        $data = $request->validated();

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user, 201);
    }

    /**
     * Mostrar un usuario específico.
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        return response()->json($user);
    }

    /**
     * Actualizar datos de un usuario.
     */
    public function update(UserUpdateRequest $request, $id)
    {
        $user = User::find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user);
    }

    /**
     * Eliminar usuario.
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }

    /**
     * Listar solo trainees.
     */
    public function trainees()
    {
        $trainees = User::where('role', 'trainee')->get();
        return response()->json($trainees);
    }

    /**
     * Listar solo trainers.
     */
    public function trainers()
    {
        $trainers = User::where('role', 'trainer')->get();
        return response()->json($trainers);
    }
}
