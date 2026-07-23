<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agenda extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'trx_agendas';

    protected $fillable = [
        'st_number',
        'title',
        'description',
        'ref_unit_id',
        'ref_agenda_category_id',
        'ref_status_id',
        'ref_room_id',
        'pic_employee_id',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'is_online',
        'offline_location',
        'online_url',
        'online_meeting_id',
        'online_password',
        'is_all_employees',
        'publish_type',
        'created_by',
        'ref_event_type_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_online' => 'boolean',
        'is_all_employees' => 'boolean',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'ref_unit_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AgendaCategory::class, 'ref_agenda_category_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'ref_room_id');
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class, 'ref_event_type_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pic(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'pic_employee_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(AgendaParticipant::class, 'trx_agenda_id');
    }

    public function scopeVisibleTo($query, $user)
    {
        if (!$user) {
            return $query->where('trx_agendas.publish_type', 'public');
        }

        $isSuperAdminOrAdmin = false;
        if (method_exists($user, 'hasRole') && $user->hasRole(['Super Admin', 'Admin'])) {
            $isSuperAdminOrAdmin = true;
        } else if ($user->role && in_array($user->role->name, ['Super Admin', 'Admin'])) {
            $isSuperAdminOrAdmin = true;
        }

        if ($isSuperAdminOrAdmin) {
            return $query;
        }

        $userId = $user->id;
        $unitId = $user->ref_unit_id;

        return $query->where(function ($q) use ($userId, $unitId) {
            $q->where('trx_agendas.publish_type', 'public')
              ->orWhere(function ($qUnit) use ($unitId) {
                  $qUnit->where('trx_agendas.publish_type', 'unit')
                        ->where('trx_agendas.ref_unit_id', $unitId);
              })
              ->orWhere(function ($qPersonal) use ($userId) {
                  $qPersonal->where('trx_agendas.publish_type', 'personal')
                            ->where('trx_agendas.created_by', $userId);
              })
              ->orWhere('trx_agendas.created_by', $userId);
        });
    }
}
