<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $minPassword = \App\Models\Setting::where('key', 'auth.min_password')->value('value') ?? \App\Models\Setting::where('key', 'auth.min_password')->value('default_value') ?? 8;
        $policyEnabled = \App\Models\Setting::where('key', 'auth.password_policy')->value('value') ?? \App\Models\Setting::where('key', 'auth.password_policy')->value('default_value');

        $passwordRule = Password::min((int)$minPassword);
        
        if ($policyEnabled == '1' || $policyEnabled === true) {
            $passwordRule->letters()
                         ->mixedCase()
                         ->numbers()
                         ->symbols();
        }

        return [
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', $passwordRule],
        ];
    }
}
