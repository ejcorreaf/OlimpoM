<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Http\Requests\PostStoreRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    /**
     * Obtener todas las noticias publicadas
     */
    public function index(Request $request)
    {
        $query = Post::published()->with('user:id,name');

        // Filtrar por categoría si se proporciona
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Ordenar por fecha de publicación
        $query->orderBy('published_at', 'desc');

        // Paginación (10 por página por defecto)
        $perPage = $request->get('per_page', 10);
        return $query->paginate($perPage);
    }

    /**
     * Obtener noticias recientes para la landing page
     */
    public function recent()
    {
        return Post::recent(6)
            ->with('user:id,name')
            ->get();
    }

    /**
     * Mostrar una noticia específica
     */
    public function show($id)
    {
        $post = Post::published()->with('user:id,name')->findOrFail($id);

        // Incrementar contador de visitas
        $post->increment('view_count');

        return response()->json($post);
    }

    /**
     * Crear una nueva noticia (solo admin)
     */
    public function store(PostStoreRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();

        $post = Post::create($validated);

        return response()->json([
            'message' => 'Noticia creada correctamente',
            'post' => $post->load('user:id,name')
        ], 201);
    }

    /**
     * Actualizar una noticia (solo admin)
     */
    public function update(PostStoreRequest $request, $id)
    {
        $post = Post::findOrFail($id);

        // Verificar que el usuario es el creador o es admin
        if ($post->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $post->update($request->validated());

        return response()->json([
            'message' => 'Noticia actualizada correctamente',
            'post' => $post->load('user:id,name')
        ]);
    }

    /**
     * Eliminar una noticia (solo admin)
     */
    public function destroy($id)
    {
        $post = Post::findOrFail($id);

        // Verificar que el usuario es el creador o es admin
        if ($post->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $post->delete();

        return response()->json([
            'message' => 'Noticia eliminada correctamente'
        ]);
    }

    /**
     * Obtener estadísticas de noticias (solo admin)
     */
    public function stats()
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $stats = [
            'total' => Post::count(),
            'published' => Post::published()->count(),
            'drafts' => Post::where('is_published', false)->count(),
            'by_category' => Post::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->get(),
            'most_viewed' => Post::published()
                ->orderBy('view_count', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'view_count']),
            'recent_published' => Post::published()
                ->orderBy('published_at', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'published_at'])
        ];

        return response()->json($stats);
    }
}
