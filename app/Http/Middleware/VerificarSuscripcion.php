<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class VerificarSuscripcion
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Solo aplica a trainees
        if ($user && $user->hasRole('trainee')) {
            // Verificar si tiene suscripción activa
            if (!$user->tieneSuscripcionActiva()) {
                // Si está intentando acceder a rutas protegidas, denegar
                // Pero permitir acceso a rutas de suscripción
                if ($request->is('api/trainee/*') &&
                    !$request->is('api/trainee/suscripcion*') &&
                    !$request->is('api/trainee/planes*')) {
                    return response()->json([
                        'message' => 'Necesitas una suscripción activa para acceder a esta funcionalidad',
                        'error' => 'suscripcion_requerida'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
