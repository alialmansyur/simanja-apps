<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class NotulaRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'trx_agenda_id' => [
                'nullable',
                'exists:trx_agendas,id',
                \Illuminate\Validation\Rule::unique('trx_notulas', 'trx_agenda_id')->ignore($this->notula?->id)
            ],
            'title' => 'required_without:trx_agenda_id|nullable|string|max:255',
            'status' => 'nullable|string|in:Draft,Menunggu Review,Selesai',
            'summary' => 'nullable|string',
            'decisions' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
    }
}
