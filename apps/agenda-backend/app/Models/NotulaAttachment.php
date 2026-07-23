<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotulaAttachment extends Model
{
    use HasFactory;

    protected $table = 'trx_notula_attachments';

    protected $fillable = [
        'trx_notula_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function notula(): BelongsTo
    {
        return $this->belongsTo(Notula::class, 'trx_notula_id');
    }
}
