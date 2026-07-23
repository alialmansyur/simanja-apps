<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Room::query()->with(['agendas' => function($q) use ($user) {
            $q->visibleTo($user)
              ->whereDate('end_date', '>=', now()->toDateString())
              ->orderBy('start_date')
              ->orderBy('start_time');
        }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Get all matching rooms to calculate dynamic status
        $rooms = $query->orderBy('name', 'asc')->get();

        $now = now();

        $mappedRooms = $rooms->map(function ($room) use ($now) {
            $status = 'Tersedia';
            $currentAgenda = null;
            $nextAgenda = null;

            foreach ($room->agendas as $agenda) {
                // Ensure time is formatted correctly for parsing
                $startTimeStr = $agenda->start_time instanceof Carbon ? $agenda->start_time->format('H:i:s') : $agenda->start_time;
                $endTimeStr = $agenda->end_time instanceof Carbon ? $agenda->end_time->format('H:i:s') : $agenda->end_time;
                
                $startDateTime = Carbon::parse($agenda->start_date->format('Y-m-d') . ' ' . $startTimeStr);
                $endDateTime = Carbon::parse($agenda->end_date->format('Y-m-d') . ' ' . $endTimeStr);

                // Sedang Digunakan: waktu sekarang berada pada rentang mulai -1 jam hingga selesai +1 jam
                $startWindow = $startDateTime->copy()->subHour();
                $endWindow = $endDateTime->copy()->addHour();

                if ($now->between($startWindow, $endWindow)) {
                    $status = 'Sedang Digunakan';
                    $currentAgenda = $agenda->title;
                } elseif ($startDateTime->isAfter($now) && !$nextAgenda) {
                    $nextAgenda = $agenda->title . ' (' . $startDateTime->format('d/m/Y H:i') . ')';
                }
            }

            $roomArray = $room->toArray();
            unset($roomArray['agendas']);
            $roomArray['status'] = $room->is_active ? $status : 'Tidak Aktif';
            $roomArray['currentAgenda'] = $currentAgenda;
            $roomArray['nextAgenda'] = $nextAgenda;

            return $roomArray;
        });

        // Filter by dynamic status if requested
        if ($request->filled('status') && $request->status !== 'Semua') {
            $mappedRooms = $mappedRooms->where('status', $request->status)->values();
        }

        // Pagination
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 8);
        $total = $mappedRooms->count();
        
        $paginatedItems = $mappedRooms->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $paginatedItems, $total, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }

    /**
     * Display the specified resource using UID.
     */
    public function show(Request $request, string $uid)
    {
        $user = $request->user();
        $room = Room::with(['agendas' => function($q) use ($user) {
            $q->visibleTo($user)
              ->with(['participants.employee', 'participants.officerPosition', 'category', 'unit', 'pic'])
              ->orderBy('start_date', 'asc')->orderBy('start_time', 'asc');
        }])->where('uid', $uid)->firstOrFail();
        
        $now = now();
        $status = 'Tersedia';

        foreach ($room->agendas as $agenda) {
            $startTimeStr = $agenda->start_time instanceof Carbon ? $agenda->start_time->format('H:i:s') : $agenda->start_time;
            $endTimeStr = $agenda->end_time instanceof Carbon ? $agenda->end_time->format('H:i:s') : $agenda->end_time;
            
            $startDateTime = Carbon::parse($agenda->start_date->format('Y-m-d') . ' ' . $startTimeStr);
            $endDateTime = Carbon::parse($agenda->end_date->format('Y-m-d') . ' ' . $endTimeStr);

            $startWindow = $startDateTime->copy()->subHour();
            $endWindow = $endDateTime->copy()->addHour();

            if ($now->between($startWindow, $endWindow)) {
                $status = 'Sedang Digunakan';
                break;
            }
        }

        $roomArray = $room->toArray();
        $roomArray['status'] = $room->is_active ? $status : 'Tidak Aktif';

        $roomArray['agendas'] = collect($roomArray['agendas'])->map(function($agenda) {
            $participants = [];
            if (($agenda['is_all_employees'] ?? false) && (!isset($agenda['category']) || $agenda['category']['name'] !== 'Fasilitasi CAT')) {
                $participants = [['value' => 'all', 'label' => 'Semua Pegawai']];
            } else {
                foreach ($agenda['participants'] ?? [] as $p) {
                    if (isset($p['employee'])) {
                        $participants[] = [
                            'value' => $p['employee']['id'],
                            'label' => $p['employee']['nama'],
                            'nip' => $p['employee']['nip'] ?? null,
                            'positionId' => $p['ref_officer_position_id'],
                            'positionName' => isset($p['officer_position']) ? $p['officer_position']['name'] : '-'
                        ];
                    }
                }
            }
            $agenda['participants_formatted'] = $participants;
            $agenda['category'] = isset($agenda['category']) ? $agenda['category']['name'] : 'Rapat';
            $agenda['team'] = isset($agenda['unit']) ? $agenda['unit']['name'] : 'Pusat';
            return $agenda;
        })->toArray();

        return response()->json([
            'status' => 'success',
            'data' => $roomArray
        ]);
    }
}
