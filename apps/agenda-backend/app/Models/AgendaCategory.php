<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgendaCategory extends Model
{
    use HasFactory;

    protected $table = 'ref_agenda_categories';

    protected $fillable = [
        'name',
        'slug',
        'color',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function agendas(): HasMany
    {
        return $this->hasMany(Agenda::class, 'category_id');
    }
}
