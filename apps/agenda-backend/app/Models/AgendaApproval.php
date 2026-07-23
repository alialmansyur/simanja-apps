<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'agenda_id',
        'step_order',
        'reviewer_id',
        'reviewer_role_id',
        'status',
        'notes',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    public function agenda(): BelongsTo
    {
        return $this->belongsTo(Agenda::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function reviewerRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'reviewer_role_id');
    }
}
