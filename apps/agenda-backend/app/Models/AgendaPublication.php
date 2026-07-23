<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaPublication extends Model
{
    use HasFactory;

    protected $fillable = [
        'agenda_id',
        'channel',
        'status',
        'display_order',
        'is_pinned',
        'publish_at',
        'unpublish_at',
        'published_by',
        'settings',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'publish_at' => 'datetime',
        'unpublish_at' => 'datetime',
        'settings' => 'array',
    ];

    public function agenda(): BelongsTo
    {
        return $this->belongsTo(Agenda::class);
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
