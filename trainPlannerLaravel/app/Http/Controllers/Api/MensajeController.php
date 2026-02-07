<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mensaje;
use App\Models\User;
use Illuminate\Http\Request;

class MensajeController extends Controller
{
    /**
     * Obtener conversación con un usuario
     */
    public function getConversacion($userId)
    {
        $usuarioActual = auth()->id();

        $mensajes = Mensaje::where(function($query) use ($usuarioActual, $userId) {
            $query->where('emisor_id', $usuarioActual)
                ->where('receptor_id', $userId);
        })
            ->orWhere(function($query) use ($usuarioActual, $userId) {
                $query->where('emisor_id', $userId)
                    ->where('receptor_id', $usuarioActual);
            })
            ->with(['emisor:id,name,photo_url', 'receptor:id,name,photo_url'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Marcar mensajes como leídos
        Mensaje::where('emisor_id', $userId)
            ->where('receptor_id', $usuarioActual)
            ->where('leido', false)
            ->update(['leido' => true]);

        return response()->json($mensajes);
    }

    /**
     * Enviar mensaje
     */
    public function enviarMensaje(Request $request)
    {
        $request->validate([
            'receptor_id' => 'required|exists:users,id',
            'mensaje' => 'required|string|max:1000'
        ]);

        $mensaje = Mensaje::create([
            'emisor_id' => auth()->id(),
            'receptor_id' => $request->receptor_id,
            'mensaje' => $request->mensaje,
            'leido' => false
        ]);

        $mensaje->load(['emisor:id,name,photo_url', 'receptor:id,name,photo_url']);

        return response()->json($mensaje);
    }

    /**
     * Obtener lista de conversaciones
     */
    public function getConversaciones()
    {
        $usuarioActual = auth()->id();

        // Obtener usuarios con los que hay conversación
        $conversaciones = Mensaje::where('emisor_id', $usuarioActual)
            ->orWhere('receptor_id', $usuarioActual)
            ->select('emisor_id', 'receptor_id')
            ->get();

        $usuariosIds = $conversaciones->pluck('emisor_id')
            ->merge($conversaciones->pluck('receptor_id'))
            ->unique()
            ->filter(fn($id) => $id != $usuarioActual);

        $usuarios = User::whereIn('id', $usuariosIds)
            ->select('id', 'name', 'email', 'photo_url')
            ->with(['roles:name'])
            ->get()
            ->map(function($user) use ($usuarioActual) {
                $user->ultimo_mensaje = Mensaje::where(function($q) use ($usuarioActual, $user) {
                    $q->where('emisor_id', $usuarioActual)->where('receptor_id', $user->id);
                })->orWhere(function($q) use ($usuarioActual, $user) {
                    $q->where('emisor_id', $user->id)->where('receptor_id', $usuarioActual);
                })->orderBy('created_at', 'desc')->first();

                $user->sin_leer = Mensaje::where('emisor_id', $user->id)
                    ->where('receptor_id', $usuarioActual)
                    ->where('leido', false)
                    ->count();

                return $user;
            });

        return response()->json($usuarios);
    }
}
