<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgendaPriority extends Model
{
    use SoftDeletes;

    protected $table = 'ref_agenda_priorities';

    protected $fillable = [
        'code',
        'name',
        'sla_days',
        'color_hex',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sla_days' => 'integer',
    ];
}
