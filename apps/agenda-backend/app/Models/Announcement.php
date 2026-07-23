<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'content',
        'channel',
        'status',
        'is_running_text',
        'is_pinned',
        'display_order',
        'publish_at',
        'unpublish_at',
        'created_by',
    ];

    protected $casts = [
        'is_running_text' => 'boolean',
        'is_pinned' => 'boolean',
        'publish_at' => 'datetime',
        'unpublish_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
