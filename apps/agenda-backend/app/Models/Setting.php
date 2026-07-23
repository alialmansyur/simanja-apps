<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'key',
        'label',
        'value',
        'default_value',
        'type',
        'options',
        'description',
        'is_public',
        'is_system',
        'validation',
        'order_no',
    ];

    protected $casts = [
        'options' => 'array',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function group()
    {
        return $this->belongsTo(SettingGroup::class, 'group_id');
    }
}
