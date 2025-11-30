<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('usuario');

        return [
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                Rule::unique('users')->ignore($userId)
            ],
            'password' => 'nullable|sometimes|min:8', // CORREGIDO: nullable
            'role' => 'sometimes|in:admin,trainer,trainee',
            'dni' => [
                'nullable', // CORREGIDO: nullable para permitir valores vacíos
                'sometimes',
                'string',
                'size:9',
                Rule::unique('users')->ignore($userId)
            ],
            'notes' => 'nullable|string',
            'email_verified' => 'sometimes|boolean'
        ];
    }
}
