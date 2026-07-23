<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agenda;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Unit::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 10);
        $units = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json([
            'message' => 'Success',
            'data' => $units
        ]);
    }

    public function show(Unit $unit): JsonResponse
    {
        return response()->json([
            'message' => 'Success',
            'data' => $unit
        ]);
    }

    public function agendas(Request $request, Unit $unit): JsonResponse
    {
        $query = Agenda::visibleTo($request->user())
            ->leftJoin('ref_agenda_categories', 'trx_agendas.ref_agenda_category_id', '=', 'ref_agenda_categories.id')
            ->leftJoin('ref_event_types', 'trx_agendas.ref_event_type_id', '=', 'ref_event_types.id')
            ->leftJoin('ref_pegawai', 'trx_agendas.pic_employee_id', '=', 'ref_pegawai.id')
            ->leftJoin('ref_rooms', 'trx_agendas.ref_room_id', '=', 'ref_rooms.id')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
              ->leftJoin('auth_users', 'trx_agendas.created_by', '=', 'auth_users.id')
              ->leftJoin('ref_pegawai as creator_employee', 'auth_users.ref_employee_id', '=', 'creator_employee.id')
            ->where('trx_agendas.ref_unit_id', $unit->id)
            ->whereNull('trx_agendas.deleted_at')
            ->select(
                'trx_agendas.id',
                'trx_agendas.st_number',
                'trx_agendas.title',
                'trx_agendas.description',
                'trx_agendas.start_date',
                'trx_agendas.end_date',
                'trx_agendas.start_time',
                'trx_agendas.end_time',
                'trx_agendas.is_online',
                'trx_agendas.offline_location',
                'trx_agendas.online_url',
                'trx_agendas.online_meeting_id',
                'trx_agendas.online_password',
                'trx_agendas.is_all_employees',
                'trx_agendas.ref_event_type_id',
                'trx_agendas.publish_type',
                'trx_agendas.created_by',
                'trx_agendas.ref_unit_id',
                'ref_agenda_categories.name as category_name',
                'ref_event_types.name as event_type_name',
                'ref_pegawai.nama as pic_name',
                'ref_rooms.name as room_name',
                'ref_rooms.id as room_id',
                'ref_statuses.name as status_name',
                  'creator_employee.nama as creator_name',
                  'creator_employee.nip as creator_nip'
            );

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('trx_agendas.title', 'like', "%{$search}%")
                  ->orWhere('trx_agendas.st_number', 'like', "%{$search}%")
                  ->orWhere('ref_pegawai.nama', 'like', "%{$search}%");
            });
        }

        if ($request->has('category') && $request->category != 'Semua') {
            $query->where('ref_agenda_categories.name', $request->category);
        }

        if ($request->has('start_date') && $request->start_date != '') {
            $query->where('trx_agendas.start_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date != '') {
            $query->where('trx_agendas.start_date', '<=', $request->end_date);
        }

        $sortBy = $request->input('sort_by', 'start_date');
        $sortDir = $request->input('sort_dir', 'desc');

        $allowedSorts = ['title', 'start_date', 'category_name', 'pic_name', 'room_name'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('start_date', 'desc');
        }

        $perPage = $request->input('per_page', 10);
        $agendas = $query->paginate($perPage);

        // Fetch participants for these agendas
        $agendaIds = $agendas->pluck('id')->toArray();
        $participants = [];
        if (!empty($agendaIds)) {
            $participantRows = DB::table('trx_agenda_participants')
                ->join('ref_pegawai', 'trx_agenda_participants.ref_employee_id', '=', 'ref_pegawai.id')
                ->leftJoin('ref_officer_positions', 'trx_agenda_participants.ref_officer_position_id', '=', 'ref_officer_positions.id')
                ->whereIn('trx_agenda_participants.trx_agenda_id', $agendaIds)
                ->select(
                    'trx_agenda_participants.trx_agenda_id', 
                    'ref_pegawai.id', 
                    'ref_pegawai.nama',
                    'ref_pegawai.nip',
                    'trx_agenda_participants.ref_officer_position_id',
                    'ref_officer_positions.name as officer_position_name'
                )
                ->get();
            
            foreach ($participantRows as $row) {
                if ($row->ref_officer_position_id) {
                    $participants[$row->trx_agenda_id][] = [
                        'value' => (string) $row->id,
                        'label' => $row->nama,
                        'nip' => $row->nip,
                        'positionId' => $row->ref_officer_position_id,
                        'positionName' => $row->officer_position_name
                    ];
                } else {
                    $participants[$row->trx_agenda_id][] = [
                        'value' => (string) $row->id,
                        'label' => $row->nama
                    ];
                }
            }
        }

        $mappedAgendas = $agendas->getCollection()->map(function ($agenda) use ($unit, $participants) {
            
            $formattedStartDate = $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->translatedFormat('l, d M Y') : '-';
            $formattedEndDate = $agenda->end_date ? \Carbon\Carbon::parse($agenda->end_date)->translatedFormat('l, d M Y') : '-';
            $dateRange = $formattedStartDate === $formattedEndDate ? $formattedStartDate : $formattedStartDate . ' - ' . $formattedEndDate;

            $timeRange = ($agenda->start_time && $agenda->end_time) 
                ? substr($agenda->start_time, 0, 5) . ' - ' . substr($agenda->end_time, 0, 5) . ' WIB'
                : '-';

            // Determine location string for display
            $locationDisplay = '-';
            if ($agenda->is_online) {
                $locationDisplay = 'Online (Zoom/Meet)';
            } else {
                if ($agenda->room_name) {
                    $locationDisplay = $agenda->room_name;
                } elseif ($agenda->offline_location) {
                    $locationDisplay = $agenda->offline_location;
                }
            }

            return [
                'id' => $agenda->id,
                'uuid' => $agenda->id,
                'title' => $agenda->title,
                'stNumber' => $agenda->st_number,
                'dateValue' => $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->format('Y-m-d') : null, // used for frontend sorting key
                'startDate' => $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->format('Y-m-d') : null,
                'endDate' => $agenda->end_date ? \Carbon\Carbon::parse($agenda->end_date)->format('Y-m-d') : null,
                'startTime' => $agenda->start_time ? \Carbon\Carbon::parse($agenda->start_time)->format('H:i:s') : null,
                'endTime' => $agenda->end_time ? \Carbon\Carbon::parse($agenda->end_time)->format('H:i:s') : null,
                'isOnline' => (bool) $agenda->is_online,
                'offlineLocation' => $agenda->offline_location,
                'onlineUrl' => $agenda->online_url,
                'onlineMeetingId' => $agenda->online_meeting_id,
                'onlinePassword' => $agenda->online_password,
                'roomId' => $agenda->room_id,
                'isAllEmployees' => (bool) $agenda->is_all_employees,
                'publishType' => $agenda->publish_type,
                'date' => $dateRange,
                'time' => $timeRange,
                'category' => $agenda->category_name ?? 'Rapat',
                'owner' => $agenda->pic_name ?? '-',
                'location' => $locationDisplay,
                'status' => $agenda->status_name ?? 'Draft',
                'team' => $unit->name,
                'description' => $agenda->description,
                'eventTypeId' => $agenda->ref_event_type_id,
                'eventTypeName' => $agenda->event_type_name,
                'publishType' => $agenda->publish_type ?? 'public',
                'createdBy' => $agenda->created_by,
                'creatorName' => $agenda->creator_name,
                'creatorNip' => $agenda->creator_nip,
                'refUnitId' => $agenda->ref_unit_id,
                'participants' => $participants[$agenda->id] ?? []
            ];
        });

        $agendas->setCollection($mappedAgendas);

        return response()->json([
            'message' => 'Success',
            'data' => [
                'items' => $agendas->items(),
                'total' => $agendas->total(),
                'current_page' => $agendas->currentPage(),
                'last_page' => $agendas->lastPage(),
                'per_page' => $agendas->perPage(),
            ]
        ]);
    }

    public function storeAgenda(Request $request, Unit $unit): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'status' => 'required|string',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
            'startTime' => 'required',
            'endTime' => 'required',
            'publishType' => 'nullable|string',
            
            // Location
            'isOnline' => 'required|boolean',
            'roomId' => 'nullable|integer',
            'offlineLocation' => 'nullable|string|max:255',
            'onlineUrl' => 'nullable|string|max:255',
            'onlineMeetingId' => 'nullable|string|max:100',
            'onlinePassword' => 'nullable|string|max:100',
            
            // Participants & PIC
            'isAllEmployees' => 'required|boolean',
            'participants' => 'nullable|array',
            'participants.*' => 'integer',
            
            // Cat
            'eventTypeId' => 'nullable|integer',
            'officers' => 'nullable|array',
            'officers.*.employeeId' => 'required_with:officers|integer',
            'officers.*.positionId' => 'required_with:officers|integer',
            
            // Meta
            'stNumber' => 'nullable|string',
            'ndNumber' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        // Resolve relations
        $category = DB::table('ref_agenda_categories')->where('name', $validated['category'])->first();
        $categoryId = $category ? $category->id : null;

        $status = DB::table('ref_statuses')->where('name', $validated['status'])->first();
        $statusId = $status ? $status->id : null;

        DB::beginTransaction();
        try {
            $id = DB::table('trx_agendas')->insertGetId([
                'title' => $validated['title'],
                'ref_unit_id' => $unit->id,
                'ref_agenda_category_id' => $categoryId,
                'ref_status_id' => $statusId,
                'ref_event_type_id' => $validated['eventTypeId'] ?? null,
                'pic_employee_id' => null,
                'created_by' => auth()->id(),
                
                'start_date' => $validated['startDate'],
                'end_date' => $validated['endDate'],
                'start_time' => $validated['startTime'],
                'end_time' => $validated['endTime'],
                
                'is_online' => $validated['isOnline'],
                'ref_room_id' => !$validated['isOnline'] ? ($validated['roomId'] ?? null) : null,
                'offline_location' => !$validated['isOnline'] ? ($validated['offlineLocation'] ?? null) : null,
                
                'online_url' => $validated['isOnline'] ? ($validated['onlineUrl'] ?? null) : null,
                'online_meeting_id' => $validated['isOnline'] ? ($validated['onlineMeetingId'] ?? null) : null,
                'online_password' => $validated['isOnline'] ? ($validated['onlinePassword'] ?? null) : null,
                
                'is_all_employees' => $validated['isAllEmployees'],
                'publish_type' => $validated['publishType'] ?? 'public',
                'st_number' => $validated['stNumber'] ?? null,
                'nd_number' => $validated['ndNumber'] ?? null,
                'description' => $validated['description'] ?? null,
                
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Save specific participants if not all employees
            if ($category && $category->name === 'Fasilitasi CAT' && !empty($validated['officers'])) {
                $participantInserts = [];
                foreach ($validated['officers'] as $officer) {
                    $participantInserts[] = [
                        'trx_agenda_id' => $id,
                        'ref_employee_id' => $officer['employeeId'],
                        'ref_officer_position_id' => $officer['positionId'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                DB::table('trx_agenda_participants')->insert($participantInserts);
            } elseif (!$validated['isAllEmployees'] && !empty($validated['participants'])) {
                $participantInserts = [];
                foreach ($validated['participants'] as $empId) {
                    $participantInserts[] = [
                        'trx_agenda_id' => $id,
                        'ref_employee_id' => $empId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                DB::table('trx_agenda_participants')->insert($participantInserts);
            }

            DB::commit();

            return response()->json([
                'message' => 'Agenda created successfully',
                'data' => ['id' => $id]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create agenda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
