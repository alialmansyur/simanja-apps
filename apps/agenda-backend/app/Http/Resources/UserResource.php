<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar ? \Illuminate\Support\Facades\Storage::url($this->avatar) : null,
            'two_factor_confirmed_at' => $this->two_factor_confirmed_at,
            'ref_employee_id' => $this->ref_employee_id,
            'unit' => $this->employee ? ($this->employee->unit ? $this->employee->unit->name : '-') : '-',
            'unit_id' => $this->employee ? $this->employee->unit_id : null,
            'nip' => $this->employee ? $this->employee->nip : '-',
            'is_active' => $this->is_active,
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
