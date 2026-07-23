<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Notula extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'trx_notulas';

    protected $fillable = [
        'uid',
        'trx_agenda_id',
        'title',
        'status',
        'summary',
        'decisions',
        'notes',
        'created_by',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uid)) {
                $model->uid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uid';
    }

    public function agenda(): BelongsTo
    {
        return $this->belongsTo(Agenda::class, 'trx_agenda_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(NotulaAttachment::class, 'trx_notula_id');
    }
}
