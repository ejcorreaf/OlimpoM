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
        $userId = $this->route('id');

        return [
            'name'     => ['sometimes','string','max:255'],
            'email'    => [
                'sometimes',
                'email',
                Rule::unique('users')->ignore($userId)
            ],
            'password' => ['sometimes','string','min:6'],
            'role'     => ['sometimes', Rule::in(['admin','trainer','trainee'])],
        ];
    }
}
