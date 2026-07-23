<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfficerPosition extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ref_officer_positions';

    protected $fillable = [
        'name',
    ];
}
