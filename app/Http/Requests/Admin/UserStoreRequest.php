<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'unique:users'
            ],
            'password' => 'required|min:8',
            'role' => 'required|in:admin,trainer,trainee',
            'dni' => [
                'nullable',
                'string',
                'size:9',
                'unique:users'
            ],
            'notes' => 'nullable|string',
            'email_verified' => 'sometimes|boolean'
        ];
    }
}
