<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Entrenador\EjerciciosController;
use App\Http\Controllers\Api\Entrenador\RutinasController;
use App\Http\Controllers\Api\Trainee\RutinasTraineeController;

// Ruta de prueba para verificar el funcionamiento de la API
Route::get('/test', fn() => response()->json(['message'=>'API ok']));

// Rutas públicas para registro e inicio de sesión
Route::post('/register',[AuthController::class,'register']);
Route::post('/login',[AuthController::class,'login']);

// Grupo de rutas que requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(\Illuminate\Http\Request $r) => $r->user()); // Obtiene el usuario autenticado
    Route::post('/logout',[AuthController::class,'logout']); // Cierra la sesión
});

// Rutas específicas para entrenadores
Route::middleware(['auth:sanctum','role:trainer'])->prefix('entrenador')->group(function () {
    // Conjunto de rutas para manejar ejercicios
    Route::apiResource('ejercicios', EjerciciosController::class);

    // Conjunto de rutas para manejar rutinas
    Route::apiResource('rutinas', RutinasController::class);

    // Asigna ejercicios a una rutina
    Route::post('/rutinas/{rutina}/ejercicios', [RutinasController::class,'asignarEjercicios']);
    // Muestra los ejercicios de una rutina
    Route::get('/rutinas/{rutina}/ejercicios', [RutinasController::class,'verEjercicios']);
    // Sincroniza los ejercicios de una rutina
    Route::put('/rutinas/{rutina}/ejercicios', [RutinasController::class,'sincronizarEjercicios']);
    // Elimina un ejercicio de una rutina
    Route::delete('/rutinas/{rutina}/ejercicios/{ejercicioId}', [RutinasController::class,'eliminarEjercicio']);

    // Obtiene la lista de trainees
    Route::get('/trainees', [RutinasController::class,'trainees']);
});

// Rutas específicas para trainees
Route::middleware(['auth:sanctum','role:trainee'])->prefix('trainee')->group(function () {
    Route::get('/rutinas', [RutinasTraineeController::class,'index']);
    Route::get('/rutinas/{id}', [RutinasTraineeController::class,'show']);
});

