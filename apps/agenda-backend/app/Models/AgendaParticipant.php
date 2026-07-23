<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaParticipant extends Model
{
    use HasFactory;

    protected $table = 'trx_agenda_participants';

    protected $fillable = [
        'trx_agenda_id',
        'ref_employee_id',
        'guest_name',
        'guest_nip',
        'guest_institution',
        'ref_officer_position_id',
    ];

    public function agenda(): BelongsTo
    {
        return $this->belongsTo(Agenda::class, 'trx_agenda_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'ref_employee_id');
    }

    public function officerPosition(): BelongsTo
    {
        return $this->belongsTo(OfficerPosition::class, 'ref_officer_position_id');
    }
}
