<?php

use App\Http\Controllers\Api\Admin\AdminAsignacionController;
use App\Http\Controllers\Api\Admin\AdminEjerciciosController;
use App\Http\Controllers\Api\Admin\AdminRutinasController;
use App\Http\Controllers\Api\Admin\AdminUsuariosController;
use App\Http\Controllers\Api\Entrenador\TraineesController;
use App\Http\Controllers\Api\MensajeController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\SuscripcionController;
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

        // Cargar relaciones necesarias
        $user->load('roles', 'plan');

        // Usar Laravel Permission correctamente
        $user->role = $user->getRoleNames()->first();
        $user->email_verified = $user->hasVerifiedEmail();
        $user->needs_email_verification = $user->hasRole('trainee') && !$user->hasVerifiedEmail();

        // Información de suscripción
        $user->estado_suscripcion = $user->estado_suscripcion ?? 'ninguna';
        $user->tiene_suscripcion_activa = $user->tieneSuscripcionActiva();

        if ($user->plan) {
            $user->plan_nombre = $user->plan->nombre;
            $user->plan_precio = $user->plan->precio;
        }

        return $user;
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);


    // Verificación de email
    Route::get('/email/verification-status', [AuthController::class, 'checkEmailVerification']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail']);



    // ============================
    // Subida de foto de perfil
    // ============================
    Route::post('/user/photo', [AuthController::class, 'updatePhoto']);

    // ============================
    // Actualizar notas del usuario
    // ============================
    Route::patch('/user/notes', [AuthController::class, 'updateNotes']);
});

// =====================================================
// RUTAS MENSAJES (usuarios verificados)
// =====================================================
Route::middleware(['auth:sanctum', 'verified'])
    ->prefix('mensajes')
    ->group(function () {
        Route::get('/conversaciones', [MensajeController::class, 'getConversaciones']);
        Route::get('/conversacion/{userId}', [MensajeController::class, 'getConversacion']);
        Route::post('/enviar', [MensajeController::class, 'enviarMensaje']);
    });

// ============================
// Verificación de Email - VERSIÓN CORREGIDA
// ============================

Route::get('/verify-email/{id}/{hash}', function ($id, $hash) {
    // Buscar el usuario directamente
    $user = \App\Models\User::find($id);

    if (!$user) {
        return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/email-verified?verified=0&error=user_not_found');
    }

    // Verificar el hash
    if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
        return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/email-verified?verified=0&error=invalid_hash');
    }

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/email-verified?verified=1&message=already_verified');
    }

    // Marcar como verificado
    $user->markEmailAsVerified();

    return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/email-verified?verified=1&success=true');
})->name('verification.verify');

// =====================================================
// RUTAS ENTRENADOR
// =====================================================
Route::middleware(['auth:sanctum', 'role:trainer', 'verified'])
    ->prefix('entrenador')
    ->group(function () {

        Route::get('ejercicios', [EjerciciosController::class, 'index']);
        Route::get('ejercicios/grupos', [EjerciciosController::class, 'gruposMusculares']);
        Route::get('ejercicios/{ejercicio}', [EjerciciosController::class, 'show']);
        Route::get('ejercicios/estadisticas/contador', [EjerciciosController::class, 'estadisticas']);
        Route::apiResource('rutinas', RutinasController::class);

        Route::post('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'asignarEjercicios']);
        Route::get('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'verEjercicios']);
        Route::put('/rutinas/{rutina}/ejercicios', [RutinasController::class, 'sincronizarEjercicios']);
        Route::delete('/rutinas/{rutina}/ejercicios/{ejercicioId}', [RutinasController::class, 'eliminarEjercicio']);

        Route::get('/trainees', [RutinasController::class, 'trainees']);
    });


// =====================================================
// RUTAS TRAINEE
// =====================================================

// Rutas que requieren suscripción activa
Route::middleware(['auth:sanctum', 'role:trainee', 'verified', 'suscripcion'])
    ->prefix('trainee')
    ->group(function () {
        Route::get('/rutinas', [RutinasTraineeController::class, 'index']);
        Route::get('/rutinas/{id}', [RutinasTraineeController::class, 'show']);
    });

// Rutas que NO requieren suscripción activa
Route::middleware(['auth:sanctum', 'role:trainee', 'verified'])
    ->prefix('trainee')
    ->group(function () {
        Route::get('/planes', [PlanController::class, 'index']);
        Route::get('/suscripcion', [SuscripcionController::class, 'index']);
    });


// =====================================================
// RUTAS ADMIN
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

        Route::prefix('asignaciones')->group(function () {
            Route::get('/', [AdminAsignacionController::class, 'index']);
            Route::get('/trainees-no-asignados', [AdminAsignacionController::class, 'traineesNoAsignados']);
            Route::get('/entrenadores', [AdminAsignacionController::class, 'entrenadores']);
            Route::post('/', [AdminAsignacionController::class, 'store']);
            Route::delete('/{entrenadorId}/{traineeId}', [AdminAsignacionController::class, 'destroy']);
        });
    });


// =====================================================
// RUTAS PUBLICAS PARA NOTICIAS/BLOG
// =====================================================
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/recent', [PostController::class, 'recent']);
Route::get('/posts/{id}', [PostController::class, 'show']);

// RUTAS PROTEGIDAS PARA ADMINISTRADORES
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
    Route::get('/posts/stats', [PostController::class, 'stats']);
});

// =====================================================
// RUTAS SUSCRIPCIONES
// =====================================================
Route::middleware(['auth:sanctum'])->group(function () {
    // Crear/confirmar/cancelar suscripción
    Route::post('/suscripciones', [SuscripcionController::class, 'store']);
    Route::post('/suscripciones/{intencionPagoId}/confirmar', [SuscripcionController::class, 'confirmar']);
    Route::post('/suscripciones/simular', [SuscripcionController::class, 'simular']);
    Route::delete('/suscripciones', [SuscripcionController::class, 'destroy']);

    // Verificar estado de pago
    Route::get('/suscripciones/{intencionPagoId}/estado', [SuscripcionController::class, 'estado']);
});
// =====================================================
// RUTAS PAYPAL
// =====================================================
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/paypal/create-order', [PaymentController::class, 'createOrder']);
    Route::post('/paypal/capture-order/{orderId}', [PaymentController::class, 'captureOrder']);
    Route::post('/paypal/cancel-order', [PaymentController::class, 'cancelOrder']);
    Route::get('/paypal/check-order-status/{orderId}', [PaymentController::class, 'checkOrderStatus']);
    Route::post('/paypal/webhook', [PaymentController::class, 'handleWebhook']);
});
