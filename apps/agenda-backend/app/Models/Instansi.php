<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instansi extends Model
{
    use HasFactory;

    protected $table = 'ref_instansi';

    protected $fillable = [
        'kodeins',
        'nama',
        'kanreg',
        'wilker',
        'wilayah',
        'is_status',
        'logo',
    ];

    protected $casts = [
        'kodeins' => 'integer',
        'kanreg' => 'integer',
        'wilker' => 'integer',
        'is_status' => 'integer',
    ];

    public function agendas(): HasMany
    {
        return $this->hasMany(Agenda::class, 'ref_instansi_id');
    }
}
