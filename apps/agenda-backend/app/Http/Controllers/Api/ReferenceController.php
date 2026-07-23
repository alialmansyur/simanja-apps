<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReferenceController extends Controller
{
    /**
     * Get all roles for dropdown
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::select('id', 'name')->orderBy('name')->get();

        return response()->json([
            'message' => 'Success',
            'data' => $roles
        ]);
    }

    /**
     * Get all units for dropdown
     */
    public function getUnits(): JsonResponse
    {
        $units = Unit::select('id', 'name')->orderBy('name')->get();

        return response()->json([
            'message' => 'Success',
            'data' => $units
        ]);
    }

    /**
     * Get all rooms for dropdown
     */
    public function getRooms(): JsonResponse
    {
        $rooms = DB::table('ref_rooms')->where('is_active', true)->whereNull('deleted_at')->select('id', 'name')->orderBy('name')->get();

        return response()->json([
            'message' => 'Success',
            'data' => $rooms
        ]);
    }

    /**
     * Get all employees for dropdown
     */
    public function getEmployees(): JsonResponse
    {
        $employees = DB::table('ref_pegawai')->where('is_status', 1)->select('id', 'nama as name', 'nip')->orderBy('nama')->get();

        return response()->json([
            'message' => 'Success',
            'data' => $employees
        ]);
    }

    public function getEventTypes(): JsonResponse
    {
        $types = \App\Models\EventType::select('id', 'name', 'code')->orderBy('name')->get();
        return response()->json(['message' => 'Success', 'data' => $types]);
    }

    public function getOfficerPositions(): JsonResponse
    {
        $positions = \App\Models\OfficerPosition::select('id', 'name')->orderBy('name')->get();
        return response()->json(['message' => 'Success', 'data' => $positions]);
    }

    public function getEmployeeAvailability(\Illuminate\Http\Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $startTime = $request->query('start_time');
        $endTime = $request->query('end_time');
        $excludeAgendaId = $request->query('exclude_agenda_id');

        $employees = DB::table('ref_pegawai')
            ->where('is_status', 1)
            ->select('id', 'nama as name', 'nip')
            ->orderBy('nama')
            ->get();

        if (!$startDate || !$endDate || !$startTime || !$endTime) {
            foreach ($employees as $emp) {
                $emp->is_available = true;
                $emp->conflict_description = null;
            }
            return response()->json(['message' => 'Success', 'data' => $employees]);
        }

        $conflictQuery = DB::table('trx_agendas')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
            ->whereNull('trx_agendas.deleted_at')
            ->whereNotIn('ref_statuses.name', ['Batal', 'Selesai'])
            ->whereRaw("CONCAT(trx_agendas.end_date, ' ', trx_agendas.end_time) >= ?", [now()->format('Y-m-d H:i:s')])
            ->where('trx_agendas.start_date', '<=', $endDate)
            ->where('trx_agendas.end_date', '>=', $startDate)
            ->where('trx_agendas.start_time', '<=', $endTime)
            ->where('trx_agendas.end_time', '>=', $startTime)
            ->select('trx_agendas.*');

        if ($excludeAgendaId) {
            $conflictQuery->where('trx_agendas.id', '!=', $excludeAgendaId);
        }

        $conflictingAgendas = $conflictQuery->get();
        $conflictingAgendaIds = $conflictingAgendas->pluck('id')->toArray();

        $busyParticipants = [];
        if (!empty($conflictingAgendaIds)) {
            $busyParticipants = DB::table('trx_agenda_participants')
                ->whereIn('trx_agenda_id', $conflictingAgendaIds)
                ->get()
                ->groupBy('ref_employee_id');
        }

        $agendaMap = $conflictingAgendas->keyBy('id');

        foreach ($employees as $emp) {
            if ($emp->nip === '197005131991031001') {
                $emp->is_available = true;
                $emp->conflict_description = null;
                continue;
            }

            $picConflict = $conflictingAgendas->where('pic_employee_id', $emp->id)->first();
            $participantConflict = isset($busyParticipants[$emp->id]) ? $busyParticipants[$emp->id]->first() : null;

            if ($picConflict) {
                $emp->is_available = false;
                $emp->conflict_description = 'Bentrok: ' . $picConflict->title;
            } elseif ($participantConflict) {
                $agenda = $agendaMap[$participantConflict->trx_agenda_id] ?? null;
                $emp->is_available = false;
                $emp->conflict_description = 'Bentrok: ' . ($agenda ? $agenda->title : 'Agenda Lain');
            } else {
                $emp->is_available = true;
                $emp->conflict_description = null;
            }
        }

        return response()->json(['message' => 'Success', 'data' => $employees]);
    }

    public function getRoomAvailability(\Illuminate\Http\Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $startTime = $request->query('start_time');
        $endTime = $request->query('end_time');
        $excludeAgendaId = $request->query('exclude_agenda_id');

        $rooms = DB::table('ref_rooms')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        if (!$startDate || !$endDate || !$startTime || !$endTime) {
            foreach ($rooms as $room) {
                $room->is_available = true;
                $room->conflict_description = null;
            }
            return response()->json(['message' => 'Success', 'data' => $rooms]);
        }

        $conflictQuery = DB::table('trx_agendas')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
            ->whereNull('trx_agendas.deleted_at')
            ->whereNotIn('ref_statuses.name', ['Batal', 'Selesai'])
            ->whereRaw("CONCAT(trx_agendas.end_date, ' ', trx_agendas.end_time) >= ?", [now()->format('Y-m-d H:i:s')])
            ->where('trx_agendas.start_date', '<=', $endDate)
            ->where('trx_agendas.end_date', '>=', $startDate)
            ->where('trx_agendas.start_time', '<=', $endTime)
            ->where('trx_agendas.end_time', '>=', $startTime)
            ->select('trx_agendas.*');

        if ($excludeAgendaId) {
            $conflictQuery->where('trx_agendas.id', '!=', $excludeAgendaId);
        }

        $conflictingAgendas = $conflictQuery->whereNotNull('trx_agendas.ref_room_id')->get();
        $agendaMap = $conflictingAgendas->keyBy('ref_room_id');

        foreach ($rooms as $room) {
            $conflict = $agendaMap[$room->id] ?? null;

            if ($conflict) {
                $room->is_available = false;
                $room->conflict_description = 'Bentrok: ' . $conflict->title;
            } else {
                $room->is_available = true;
                $room->conflict_description = null;
            }
        }

        return response()->json(['message' => 'Success', 'data' => $rooms]);
    }

    public function getAgendaCategories(): JsonResponse
    {
        $categories = \App\Models\AgendaCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();
        return response()->json(['message' => 'Success', 'data' => $categories]);
    }
}
