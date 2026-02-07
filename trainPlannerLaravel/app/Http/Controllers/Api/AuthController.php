<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * REGISTRO DE USUARIO
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'dni' => 'required|string|size:9|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'notes' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'dni' => $data['dni'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'notes' => $data['notes'] ?? null,
        ]);

        $user->assignRole('trainee');

        // SOLO enviar email de verificación para trainees
        if ($user->hasRole('trainee')) {
            $user->sendEmailVerificationNotification();
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => $user->hasRole('trainee')
                ? 'Usuario registrado. Por favor, verifica tu email.'
                : 'Usuario registrado correctamente.'
        ]);
    }

    /**
     * LOGIN - CORREGIDO
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($data)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        $user = Auth::user();



        $token = $user->createToken('api')->plainTextToken;

        // Asegurarnos de cargar los roles
        $user->load('roles');
        $user->role = $user->getRoleNames()->first();

        return response()->json([
            'token' => $token,
            'user' => $user,
            'roles' => $user->getRoleNames()
        ]);
    }

    /**
     * REENVIAR EMAIL DE VERIFICACIÓN - CORREGIDO
     */
    public function resendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email ya verificado']);
        }

        // Solo permitir reenviar si el usuario es trainee
        if (!$user->hasRole('trainee')) {
            return response()->json(['message' => 'Tu rol no requiere verificación de email'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de verificación reenviado']);
    }

    /**
     * VERIFICAR ESTADO DE EMAIL - CORREGIDO
     */
    public function checkEmailVerification(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'email_verified' => $user->hasVerifiedEmail(),
            'needs_verification' => $user->hasRole('trainee') && !$user->hasVerifiedEmail()
        ]);
    }

    // Los demás métodos se mantienen igual...
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message'=>'Logout ok']);
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:2048'
        ]);

        $user = $request->user();

        $path = $request->file('photo')->store('photos', 'public');

        $user->photo_url = asset('storage/' . $path);
        $user->save();

        return response()->json([
            'message' => 'Photo updated',
            'photo_url' => $user->photo_url
        ]);
    }

    public function updateNotes(Request $request)
    {
        $request->validate([
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $user->notes = $request->notes;
        $user->save();

        // Cargar el rol para la respuesta
        $user->role = $user->getRoleNames()->first();

        return response()->json([
            'message' => 'Notes updated',
            'user' => $user
        ]);
    }
}
