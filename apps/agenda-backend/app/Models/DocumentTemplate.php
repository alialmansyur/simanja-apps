<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class DocumentTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'ref_document_templates';

    protected $fillable = [
        'uid',
        'category',
        'code',
        'name',
        'format_nomor',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uid)) {
                $model->uid = (string) Str::uuid();
            }
        });
    }

    public function body()
    {
        return $this->hasOne(DocumentTemplateBody::class, 'template_id');
    }
}
