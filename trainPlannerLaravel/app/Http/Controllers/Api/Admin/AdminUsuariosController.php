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
        // Cargar roles con Laravel Permission
        $users = User::with('roles')->get()->map(function($user) {
            $user->role = $user->getRoleNames()->first();
            $user->email_verified = $user->hasVerifiedEmail();
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Crear un nuevo usuario.
     */
    public function store(UserStoreRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'dni' => $data['dni'] ?? '00000000A', // Valor por defecto temporal
            'notes' => $data['notes'] ?? null,
        ]);

        // Asignar rol con Laravel Permission
        $user->assignRole($data['role']);

        // Si el admin marca como verificado, verificar el email
        if ($request->boolean('email_verified', false)) {
            $user->markEmailAsVerified();
        }

        // Si es trainee y no está verificado, enviar email de verificación
        if ($user->hasRole('trainee') && !$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        // Cargar rol para la respuesta
        $user->role = $user->getRoleNames()->first();
        $user->email_verified = $user->hasVerifiedEmail();

        return response()->json($user, 201);
    }

    /**
     * Mostrar un usuario específico.
     */
    public function show($id)
    {
        $user = User::with('roles')->find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        $user->role = $user->getRoleNames()->first();
        $user->email_verified = $user->hasVerifiedEmail();

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

        // Preparar datos para actualizar - INCLUYENDO DNI
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'dni' => $data['dni'] ?? null, // CORREGIDO: Incluir DNI, puede ser null
        ];

        // Solo actualizar password si se proporciona
        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        // Sincronizar rol con Laravel Permission
        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        // Manejar verificación de email
        if ($request->has('email_verified')) {
            if ($request->boolean('email_verified') && !$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            } elseif (!$request->boolean('email_verified') && $user->hasVerifiedEmail()) {
                $user->email_verified_at = null;
                $user->save();
            }
        }

        // Cargar rol para la respuesta
        $user->role = $user->getRoleNames()->first();
        $user->email_verified = $user->hasVerifiedEmail();

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
     * Verificar email manualmente
     */
    public function verifyEmail($id)
    {
        $user = User::find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'El email ya está verificado']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email verificado manualmente']);
    }

    /**
     * Reenviar email de verificación
     */
    public function resendVerificationEmail($id)
    {
        $user = User::find($id);

        if (!$user) return response()->json(['message' => 'Usuario no encontrado'], 404);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'El email ya está verificado']);
        }

        // Solo reenviar para trainees
        if (!$user->hasRole('trainee')) {
            return response()->json(['message' => 'Solo los trainees necesitan verificación de email'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de verificación reenviado']);
    }

    /**
     * Listar solo trainees.
     */
    public function trainees()
    {
        $trainees = User::role('trainee')->with('roles')->get()->map(function($user) {
            $user->role = $user->getRoleNames()->first();
            $user->email_verified = $user->hasVerifiedEmail();
            return $user;
        });

        return response()->json($trainees);
    }

    /**
     * Listar solo trainers.
     */
    public function trainers()
    {
        $trainers = User::role('trainer')->with('roles')->get()->map(function($user) {
            $user->role = $user->getRoleNames()->first();
            $user->email_verified = $user->hasVerifiedEmail();
            return $user;
        });

        return response()->json($trainers);
    }
}
