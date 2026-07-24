<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Agenda;

class AgendaController extends Controller
{
    /**
     * Get all agendas for dropdown
     */
    public function index(Request $request): JsonResponse
    {
        $agendas = Agenda::visibleTo($request->user())
            ->select('trx_agendas.id', 'trx_agendas.title', 'trx_agendas.description', 'trx_agendas.start_date', 'trx_agendas.start_time')
            ->where(function($query) {
                $query->whereNull('trx_agendas.description')
                      ->orWhere(function($q) {
                          $q->where('trx_agendas.description', 'not like', '%Hari Libur Nasional / Cuti Bersama Tahun 2026%')
                            ->where('trx_agendas.description', 'not like', '%Hari Libur Nasional%')
                            ->where('trx_agendas.description', 'not like', '%Cuti Bersama%');
                      });
            })
            ->orderBy('trx_agendas.start_date', 'desc')
            ->get();
            
        $agendasWithNotulas = DB::table('trx_notulas')->whereNotNull('trx_agenda_id')->pluck('trx_agenda_id')->toArray();
        
        $agendas->transform(function ($agenda) use ($agendasWithNotulas) {
            $agenda->has_notula = in_array($agenda->id, $agendasWithNotulas);
            return $agenda;
        });
            
        return $this->successResponse($agendas);
    }

    /**
     * Update the status of an agenda
     */
    public function updateStatus(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'status' => 'required|string'
        ]);

        $statusName = $request->input('status');

        $status = DB::table('ref_statuses')
            ->where('type', 'AGENDA')
            ->where('name', $statusName)
            ->first();

        if (!$status) {
            return $this->errorResponse('Status not found: ' . $statusName, null, 400);
        }

        $agenda = Agenda::visibleTo($request->user())->where('trx_agendas.id', $uuid)->first();
        
        if (!$agenda) {
            return $this->errorResponse('Agenda not found: ' . $uuid, null, 400);
        }
        $user = $request->user();
        $isSuperAdminOrAdmin = false;
        if (method_exists($user, "hasRole") && $user->hasRole(["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        } else if ($user->role && in_array($user->role->name, ["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        }

        if (!$isSuperAdminOrAdmin && $agenda->created_by != $user->id) {
            if ($agenda->publish_type === "personal") {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda personal ini", null, 403);
            }
            if ($agenda->publish_type === "unit" && $agenda->ref_unit_id != $user->ref_unit_id) {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda unit lain", null, 403);
            }
        }



        DB::table('trx_agendas')->where('id', $agenda->id)->update([
            'ref_status_id' => $status->id,
            'updated_at' => now()
        ]);

        return $this->successResponse([
            'id' => $agenda->id,
            'status' => $status->name
        ], 'Status updated successfully');
    }

    /**
     * Update an agenda
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'status' => 'required|string',
            'publishType' => 'nullable|string',
            
            // Schedule
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
            'startTime' => 'required',
            'endTime' => 'required',
            
            // Location
            'isOnline' => 'required|boolean',
            'roomId' => 'nullable|integer',
            'offlineLocation' => 'nullable|string|max:255',
            'onlineUrl' => 'nullable|string|max:255',
            'onlineMeetingId' => 'nullable|string|max:100',
            'onlinePassword' => 'nullable|string|max:100',
            
            // Participants
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

        $agenda = Agenda::visibleTo($request->user())->where('trx_agendas.id', $uuid)->first();
        
        if (!$agenda) {
            return $this->errorResponse('Agenda not found', null, 404);
        }
        $user = $request->user();
        $isSuperAdminOrAdmin = false;
        if (method_exists($user, "hasRole") && $user->hasRole(["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        } else if ($user->role && in_array($user->role->name, ["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        }

        if (!$isSuperAdminOrAdmin && $agenda->created_by != $user->id) {
            if ($agenda->publish_type === "personal") {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda personal ini", null, 403);
            }
            if ($agenda->publish_type === "unit" && $agenda->ref_unit_id != $user->ref_unit_id) {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda unit lain", null, 403);
            }
        }



        // Resolve relations
        $category = DB::table('ref_agenda_categories')->where('name', $validated['category'])->first();
        $categoryId = $category ? $category->id : null;

        $status = DB::table('ref_statuses')->where('name', $validated['status'])->first();
        $statusId = $status ? $status->id : null;

        DB::beginTransaction();
        try {
            DB::table('trx_agendas')->where('id', $agenda->id)->update([
                'title' => $validated['title'],
                'ref_agenda_category_id' => $categoryId,
                'ref_status_id' => $statusId,
                'ref_event_type_id' => $validated['eventTypeId'] ?? null,
                
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
                
                'st_number' => $validated['stNumber'],
                'nd_number' => $validated['ndNumber'] ?? null,
                'description' => $validated['description'],
                'is_all_employees' => $validated['isAllEmployees'],
                'publish_type' => $validated['publishType'] ?? 'public',
                'updated_at' => now(),
            ]);

            // Sync participants
            DB::table('trx_agenda_participants')->where('trx_agenda_id', $agenda->id)->delete();
            
            if ($category && $category->name === 'Fasilitasi CAT' && !empty($validated['officers'])) {
                $participantsData = array_map(function($officer) use ($agenda) {
                    return [
                        'trx_agenda_id' => $agenda->id,
                        'ref_employee_id' => $officer['employeeId'],
                        'ref_officer_position_id' => $officer['positionId'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }, $validated['officers']);
                
                DB::table('trx_agenda_participants')->insert($participantsData);
            } elseif (!$validated['isAllEmployees'] && !empty($validated['participants'])) {
                $participantsData = array_map(function($employeeId) use ($agenda) {
                    return [
                        'trx_agenda_id' => $agenda->id,
                        'ref_employee_id' => $employeeId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }, $validated['participants']);
                
                DB::table('trx_agenda_participants')->insert($participantsData);
            }

            DB::commit();

            return $this->successResponse(null, 'Agenda updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to update agenda', $e->getMessage(), 500);
        }
    }

    /**
     * Delete an agenda
     */
    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $agenda = Agenda::visibleTo($request->user())->where('trx_agendas.id', $uuid)->first();
        
        if (!$agenda) {
            return $this->errorResponse('Agenda not found', null, 404);
        }
        $user = $request->user();
        $isSuperAdminOrAdmin = false;
        if (method_exists($user, "hasRole") && $user->hasRole(["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        } else if ($user->role && in_array($user->role->name, ["Super Admin", "Admin"])) {
            $isSuperAdminOrAdmin = true;
        }

        if (!$isSuperAdminOrAdmin && $agenda->created_by != $user->id) {
            if ($agenda->publish_type === "personal") {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda personal ini", null, 403);
            }
            if ($agenda->publish_type === "unit" && $agenda->ref_unit_id != $user->ref_unit_id) {
                return $this->errorResponse("Anda tidak memiliki akses untuk mengubah agenda unit lain", null, 403);
            }
        }



        DB::beginTransaction();
        try {
            DB::table('trx_agenda_participants')->where('trx_agenda_id', $agenda->id)->delete();
            DB::table('trx_agendas')->where('id', $agenda->id)->delete();
            
            DB::commit();

            return $this->successResponse(null, 'Agenda deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to delete agenda', $e->getMessage(), 500);
        }
    }

    /**
     * Build the query for history and export
     */
    private function buildHistoryQuery(Request $request)
    {
        $query = Agenda::visibleTo($request->user())
            ->leftJoin('ref_agenda_categories', 'trx_agendas.ref_agenda_category_id', '=', 'ref_agenda_categories.id')
            ->leftJoin('ref_event_types', 'trx_agendas.ref_event_type_id', '=', 'ref_event_types.id')
            ->leftJoin('ref_pegawai', 'trx_agendas.pic_employee_id', '=', 'ref_pegawai.id')
            ->leftJoin('ref_rooms', 'trx_agendas.ref_room_id', '=', 'ref_rooms.id')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
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
                'trx_agendas.nd_number',
                'trx_agendas.publish_type',
                'trx_agendas.ref_agenda_category_id',
                'ref_agenda_categories.name as category_name',
                'ref_event_types.name as event_type_name',
                'ref_pegawai.nama as pic_name',
                'ref_rooms.name as room_name',
                'ref_rooms.id as room_id',
                'ref_statuses.name as status_name'
            );

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('trx_agendas.title', 'like', "%{$search}%")
                  ->orWhere('trx_agendas.id', 'like', "%{$search}%")
                  ->orWhere('trx_agendas.st_number', 'like', "%{$search}%")
                  ->orWhere('ref_pegawai.nama', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status != 'Semua') {
            $query->where('ref_statuses.name', $request->status);
        }

        if ($request->has('room') && $request->room != 'Semua') {
            $room = $request->room;
            $query->where(function ($q) use ($room) {
                $q->where('ref_rooms.name', 'like', "%{$room}%")
                  ->orWhere('trx_agendas.offline_location', 'like', "%{$room}%");
            });
        }

        if ($request->has('pic') && $request->pic != 'Semua') {
            $query->where('ref_pegawai.nama', 'like', "%{$request->pic}%");
        }

        $sortBy = $request->input('sort_by', 'start_date');
        $sortDir = $request->input('sort_dir', 'desc');

        $allowedSorts = ['agendaTitle' => 'trx_agendas.title', 'date' => 'trx_agendas.start_date', 'pic' => 'ref_pegawai.nama', 'status' => 'ref_statuses.name'];
        if (array_key_exists($sortBy, $allowedSorts)) {
            $query->orderBy($allowedSorts[$sortBy], $sortDir);
        } else {
            $query->orderBy('trx_agendas.start_date', 'desc');
        }

        return $query;
    }

    /**
     * Format agenda item for history response
     */
    private function formatHistoryItem($agenda)
    {
        $formattedStartDate = $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->translatedFormat('l, d M Y') : '-';
        $formattedEndDate = $agenda->end_date ? \Carbon\Carbon::parse($agenda->end_date)->translatedFormat('l, d M Y') : '-';
        $dateRange = $formattedStartDate === $formattedEndDate ? $formattedStartDate : $formattedStartDate . ' - ' . $formattedEndDate;

        $timeRange = ($agenda->start_time && $agenda->end_time) 
            ? substr($agenda->start_time, 0, 5) . ' - ' . substr($agenda->end_time, 0, 5) . ' WIB'
            : '-';

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
            'agendaTitle' => $agenda->title,
            'description' => $agenda->description ?? '-',
            'category' => $agenda->category_name ?? 'Rapat',
            'eventType' => $agenda->event_type_name ?? '-',
            'room' => $locationDisplay,
            'location' => $locationDisplay,
            'date' => $dateRange,
            'time' => $timeRange,
            'pic' => $agenda->pic_name ?? '-',
            'status' => $agenda->status_name ?? 'Draft',
            'dateValue' => $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->format('Y-m-d') : null,
            'startDate' => $agenda->start_date ? \Carbon\Carbon::parse($agenda->start_date)->format('Y-m-d') : null,
            'endDate' => $agenda->end_date ? \Carbon\Carbon::parse($agenda->end_date)->format('Y-m-d') : null,
            'startTime' => $agenda->start_time ? \Carbon\Carbon::parse($agenda->start_time)->format('H:i:s') : null,
            'endTime' => $agenda->end_time ? \Carbon\Carbon::parse($agenda->end_time)->format('H:i:s') : null,
            'publishType' => $agenda->publish_type ?? 'public',
            'isOnline' => (bool) $agenda->is_online,
            'onlineUrl' => $agenda->online_url,
            'onlineMeetingId' => $agenda->online_meeting_id,
            'stNumber' => $agenda->st_number,
            'ndNumber' => $agenda->nd_number,
            'isAllEmployees' => (bool) $agenda->is_all_employees,
            'team' => 'Pusat', // Adjust as needed
            'roomId' => $agenda->room_id,
            'categoryId' => $agenda->ref_agenda_category_id,
        ];
    }

    /**
     * Get paginated history agendas
     */
    public function history(Request $request): JsonResponse
    {
        $query = $this->buildHistoryQuery($request);
        $perPage = $request->input('per_page', 10);
        
        $agendas = $query->paginate($perPage);

        $mappedAgendas = $agendas->getCollection()->map(function ($agenda) {
            return $this->formatHistoryItem($agenda);
        });

        $agendas->setCollection($mappedAgendas);

        return $this->successResponse([
            'items' => $agendas->items(),
            'total' => $agendas->total(),
            'current_page' => $agendas->currentPage(),
            'last_page' => $agendas->lastPage(),
            'per_page' => $agendas->perPage(),
        ]);
    }

    /**
     * Get all history agendas for export
     */
    public function exportHistory(Request $request): JsonResponse
    {
        $query = $this->buildHistoryQuery($request);
        $agendas = $query->get();

        $mappedAgendas = $agendas->map(function ($agenda) {
            return $this->formatHistoryItem($agenda);
        });

        return $this->successResponse($mappedAgendas);
    }
}
