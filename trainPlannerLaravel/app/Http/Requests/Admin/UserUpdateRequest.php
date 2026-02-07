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
            'password' => 'nullable|sometimes|min:8',
            'role' => 'sometimes|in:admin,trainer,trainee',
            'dni' => [
                'nullable',
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
