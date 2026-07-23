<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentTemplateBody extends Model
{
    use SoftDeletes;

    protected $table = 'ref_document_templates_body';

    protected $fillable = [
        'template_id',
        'kop_surat',
        'menimbang',
        'mengingat',
        'memperhatikan',
        'body_content',
    ];

    public function template()
    {
        return $this->belongsTo(DocumentTemplate::class, 'template_id');
    }
}
