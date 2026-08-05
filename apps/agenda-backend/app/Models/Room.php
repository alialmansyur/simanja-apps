<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ref_rooms';

    protected $fillable = [
        'uid',
        'code',
        'name',
        'capacity',
        'location',
        'facilities',
        'is_active',
    ];

    protected $casts = [
        'facilities' => 'array',
        'is_active' => 'boolean',
        'capacity' => 'integer',
    ];

    public function agendas()
    {
        return $this->belongsToMany(Agenda::class, 'trx_agenda_rooms', 'ref_room_id', 'trx_agenda_id');
    }
}
