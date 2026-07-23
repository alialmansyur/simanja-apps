<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotulaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uid' => $this->uid,
            'title' => $this->title ?? ($this->agenda ? $this->agenda->title : 'Tanpa Judul'),
            'date' => $this->agenda ? $this->agenda->start_date : $this->created_at,
            'status' => $this->status,
            'author' => $this->creator ? $this->creator->name : 'System',
            'participants' => $this->agenda && $this->agenda->relationLoaded('participants') ? $this->agenda->participants->count() : 0,
            
            // Detail fields
            'summary' => $this->summary,
            'decisions' => $this->decisions,
            'notes' => $this->notes,
            'trx_agenda_id' => $this->trx_agenda_id,
            'agenda' => $this->whenLoaded('agenda'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
