<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SettingGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'order_no',
    ];

    public function settings()
    {
        return $this->hasMany(Setting::class, 'group_id')->orderBy('order_no');
    }
}
