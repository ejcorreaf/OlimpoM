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
     *
     * Crea un nuevo usuario con el rol por defecto "trainee".
     * Devuelve un token de acceso y los datos del usuario.
     */
    public function register(Request $request)
    {
        // Validación de los datos recibidos
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'dni' => 'required|string|size:9|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'notes' => 'nullable|string',
        ]);

        // Creación del nuevo usuario
        $user = User::create([
            'name' => $data['name'],
            'dni' => $data['dni'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'notes' => $data['notes'] ?? null,
        ]);

        // Asignar el rol por defecto "trainee". Los admins serán quienes cambien los roles manualmente.
        $user->assignRole('trainee');

        /*
        * Enviar email de verificación
        * $user->sendEmailVerificationNotification();
        */

        // Crear token personal de acceso (Sanctum)
        $token = $user->createToken('api')->plainTextToken;

        // Respuesta JSON con token y usuario
        return response()->json([
            'token' => $token,
            'user' => $user
        ]);
    }


    /**
     * LOGIN
     *
     * Este método valida las credenciales de un usuario,
     * genera un token Sanctum si son correctas
     * y devuelve la información del usuario y sus roles.
     */
    public function login(Request $request)
    {
        // Validar credenciales recibidas
        $data = $request->validate([
            'email'=>'required|email',
            'password'=>'required'
        ]);

        // Mensaje de error si las credenciales son incorrectas
        if (!Auth::attempt($data)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        /**
         * Recuperar usuario autenticado
         * @var \App\Models\User $user
         */
        $user = Auth::user();

        /**
        *if (!$user->hasVerifiedEmail()) {
        *    return response()->json([
        *        'message' => 'Debes verificar tu correo electrónico antes de iniciar sesión.'
        *], 403);
        *}
        */

        // Generar token de acceso
        $token = $user->createToken('api')->plainTextToken;

        // Devolver token, datos y roles
        return response()->json([
            'token'=>$token,
            'user'=>$user,
            'roles'=>$user->getRoleNames()]);
    }

    /**
     * LOGOUT
     *
     * Elimina el token actual de acceso del usuario autenticado.
     * (Solo cierra la sesión actual, no todas.)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message'=>'Logout ok']);
    }

    /**
     * UpdatePhoto
     *
     * Permite cambiar la foto de perfil del usuario autenticado.
     */
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

    /**
     * UPDATE NOTES
     *
     * Permite actualizar las notas del usuario autenticado.
     */
    public function updateNotes(Request $request)
    {
        $request->validate([
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $user->notes = $request->notes;
        $user->save();

        $user->role = $user->getRoleNames()->first();

        return response()->json([
            'message' => 'Notes updated',
            'user' => $user
        ]);
    }

}
