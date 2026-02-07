<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:200',
            'excerpt' => 'nullable|string|max:300',
            'content' => 'required|string',
            'image_url' => 'nullable|url|max:500',
            'category' => 'required|in:consejos,nutricion,ejercicios,salud,tecnologia',
            'is_published' => 'boolean'
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título es obligatorio',
            'content.required' => 'El contenido es obligatorio',
            'category.in' => 'La categoría seleccionada no es válida'
        ];
    }
}
