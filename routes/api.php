<?php

use App\Http\Controllers\Api\Admin\AdminEjerciciosController;
use App\Http\Controllers\Api\Admin\AdminRutinasController;
use App\Http\Controllers\Api\Admin\AdminUsuariosController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Entrenador\EjerciciosController;
use App\Http\Controllers\Api\Entrenador\RutinasController;
use App\Http\Controllers\Api\Trainee\RutinasTraineeController;

// ============================
// Ruta de test
// ============================
Route::get('/test', fn() => response()->json(['message' => 'API ok']));

// ============================
// Rutas públicas
// ============================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


// ============================
// Rutas para usuarios autenticados
// ============================
Route::middleware('auth:sanctum')->group(function () {

    // Obtener usuario autenticado
    Route::get('/user', function (Request $r) {
        $user = $r->user();
        $user->role = $user->getRoleNames()->first();
        return $user;
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // ============================
    // Subida de foto de perfil
    // ============================
    Route::post('/user/photo', [AuthController::class, 'updatePhoto']);
});

/*
// ============================
// Verificación de Email
// ============================

// Reenviar email de verificación
Route::post('/email/verification-notification', function (Request $request) {
    if ($request->user()->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email ya verificado']);
    }

    $request->user()->sendEmailVerificationNotification();

    return response()->json(['message' => 'Email enviado']);
});

// Validación del email desde el enlace del correo
Route::get('/verify-email/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();  // Marca el email como verificado
    return redirect('http://localhost:4200/email-verified');
})->name('verification.verify');
*/

// =====================================================
// RUTAS ENTRENADOR (role:trainer)
// =====================================================
Route::middleware(['auth:sanctum', 'role:trainer'])
    ->prefix('entrenador')
    ->group(function () {

        Route::apiResource('ejercicios', EjerciciosController::class);
        Route::apiResource('rutinas', RutinasController::class);

        Route::post('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'asignarEjercicios']);
        Route::get('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'verEjercicios']);
        Route::put('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'sincronizarEjercicios']);
        Route::delete('/rutinas/{rutina}/ejercicios/{ejercicioId}', [RutinasController::class, 'eliminarEjercicio']);

        Route::get('/trainees', [RutinasController::class,'trainees']);
    });


// =====================================================
// RUTAS TRAINEE (role:trainee)
// =====================================================
Route::middleware(['auth:sanctum', 'role:trainee'])
    ->prefix('trainee')
    ->group(function () {
        Route::get('/rutinas', [RutinasTraineeController::class, 'index']);
        Route::get('/rutinas/{id}', [RutinasTraineeController::class, 'show']);
    });


// =====================================================
// RUTAS ADMIN (role:admin)
// =====================================================
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {

        Route::apiResource('usuarios', AdminUsuariosController::class);
        Route::apiResource('ejercicios', AdminEjerciciosController::class);
        Route::apiResource('rutinas', AdminRutinasController::class);

        Route::post('/rutinas/{rutina}/ejercicios', [AdminRutinasController::class, 'asignarEjercicios']);
        Route::get('/rutinas/{rutina}/ejercicios', [AdminRutinasController::class, 'verEjercicios']);
        Route::put('/rutinas/{rutina}/ejercicios', [AdminRutinasController::class, 'sincronizarEjercicios']);
        Route::delete('/rutinas/{rutina}/ejercicios/{ejercicioId}', [AdminRutinasController::class, 'eliminarEjercicio']);

        Route::get('/trainees', [AdminUsuariosController::class, 'trainees']);
        Route::get('/trainers', [AdminUsuariosController::class, 'trainers']);
    });
