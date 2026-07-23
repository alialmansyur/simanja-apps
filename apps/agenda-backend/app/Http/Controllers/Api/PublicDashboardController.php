<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Agenda;
use App\Models\Announcement;

class PublicDashboardController extends Controller
{
    /**
     * Get Dashboard KPIs
     */
    public function kpi(Request $request): JsonResponse
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Base query for public agendas
        $baseQuery = function() {
            return Agenda::where('publish_type', 'public')
                ->whereIn('trx_agendas.ref_status_id', function ($query) {
                    $query->select('id')->from('ref_statuses')->whereIn('name', ['Published', 'Publish', 'Berjalan', 'Selesai']);
                });
        };

        $totalAgendasThisMonth = $baseQuery()
            ->whereMonth('trx_agendas.start_date', $currentMonth)
            ->whereYear('trx_agendas.start_date', $currentYear)
            ->count();

        $completedAgendasThisMonth = $baseQuery()
            ->whereMonth('trx_agendas.start_date', $currentMonth)
            ->whereYear('trx_agendas.start_date', $currentYear)
            ->whereIn('trx_agendas.ref_status_id', function ($query) {
                $query->select('id')->from('ref_statuses')->where('name', 'Selesai');
            })
            ->count();

        $upcomingReminders = Agenda::where('publish_type', 'public')
            ->whereIn('trx_agendas.ref_status_id', function ($query) {
                $query->select('id')->from('ref_statuses')->whereIn('name', ['Published', 'Publish']);
            })
            ->where('trx_agendas.start_date', '>=', Carbon::now()->toDateString())
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalAgendas' => (string) $totalAgendasThisMonth,
                'completedAgendas' => (string) $completedAgendasThisMonth,
                'upcomingReminders' => (string) $upcomingReminders,
            ]
        ]);
    }

    /**
     * Get active running text announcements
     */
    public function announcements(Request $request): JsonResponse
    {
        try {
            $announcements = Announcement::where('is_running_text', true)
                ->where('status', 'Published')
                ->where(function ($query) {
                    $query->whereNull('publish_at')
                          ->orWhere('publish_at', '<=', now());
                })
                ->where(function ($query) {
                    $query->whereNull('unpublish_at')
                          ->orWhere('unpublish_at', '>=', now());
                })
                ->orderBy('display_order', 'asc')
                ->pluck('content');
        } catch (\Exception $e) {
            $announcements = collect();
        }

        if ($announcements->isEmpty()) {
            $announcements = collect([
                'Selamat datang di Sistem Agenda.',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $announcements
        ]);
    }

    /**
     * Get Calendar Events (Public only)
     */
    public function events(Request $request): JsonResponse
    {
        $agendasQuery = Agenda::select('trx_agendas.*', 'ref_statuses.name as status_name')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
            ->with(['room', 'pic', 'participants.employee', 'participants.officerPosition', 'category', 'unit'])
            ->whereNull('trx_agendas.deleted_at')
            ->where('trx_agendas.publish_type', 'public')
            ->whereIn('trx_agendas.ref_status_id', function ($query) {
                $query->select('id')->from('ref_statuses')->whereNotIn('name', ['Draft', 'Batal']);
            })
            ->where('trx_agendas.start_date', '>=', Carbon::now()->subMonths(3)->toDateString())
            ->where('trx_agendas.start_date', '<=', Carbon::now()->addMonths(3)->toDateString());

        $agendas = $agendasQuery->get();

        $formattedEvents = $agendas->map(function ($agenda) {
            $formattedStartDate = $agenda->start_date ? Carbon::parse($agenda->start_date)->translatedFormat('l, d M Y') : '-';
            $formattedEndDate = $agenda->end_date ? Carbon::parse($agenda->end_date)->translatedFormat('l, d M Y') : '-';
            $dateRange = $formattedStartDate === $formattedEndDate ? $formattedStartDate : $formattedStartDate . ' - ' . $formattedEndDate;

            $timeRange = ($agenda->start_time && $agenda->end_time) 
                ? substr($agenda->start_time, 0, 5) . ' - ' . substr($agenda->end_time, 0, 5) . ' WIB'
                : '-';

            $locationDisplay = '-';
            if ($agenda->is_online) {
                $locationDisplay = 'Online (Zoom/Meet)';
            } else {
                if ($agenda->room) {
                    $locationDisplay = $agenda->room->name;
                } elseif ($agenda->offline_location) {
                    $locationDisplay = $agenda->offline_location;
                }
            }

            $participants = [];
            $isFasilitasiCAT = $agenda->category && stripos($agenda->category->name, 'Fasilitasi CAT') !== false;

            if ($isFasilitasiCAT) {
                // For Fasilitasi CAT, participants array acts as the Officers list regardless of is_all_employees
                foreach ($agenda->participants as $participant) {
                    if ($participant->employee || $participant->guest_name) {
                        $name = $participant->employee ? $participant->employee->nama : $participant->guest_name;
                        $position = $participant->officerPosition ? $participant->officerPosition->name : '-';
                        $participants[] = ['position' => $position, 'name' => $name];
                    }
                }
            } else {
                // For normal agendas
                if ($agenda->is_all_employees) {
                    $participants = ['Semua Pegawai'];
                } else {
                    foreach ($agenda->participants as $participant) {
                        if ($participant->employee || $participant->guest_name) {
                            $participants[] = $participant->employee ? $participant->employee->nama : $participant->guest_name;
                        }
                    }
                }
            }
            
            // Generate Google Calendar Date
            $gStart = $agenda->start_date ? Carbon::parse($agenda->start_date)->format('Ymd') : '';
            $gEnd = $agenda->end_date ? Carbon::parse($agenda->end_date)->format('Ymd') : '';
            
            if ($agenda->start_time) {
                $gStart .= 'T' . str_replace(':', '', $agenda->start_time);
            }
            if ($agenda->end_time) {
                $gEnd .= 'T' . str_replace(':', '', $agenda->end_time);
            }

            return [
                'id' => $agenda->id,
                'uuid' => $agenda->id,
                'title' => $agenda->title,
                'description' => $agenda->description ?? '-',
                'category' => $agenda->category ? $agenda->category->name : 'Rapat',
                'status' => $agenda->status_name ?? 'Draft',
                'location' => $locationDisplay,
                'date' => $dateRange,
                'time' => $timeRange,
                'start_date_raw' => $agenda->start_date ? $agenda->start_date->format('Y-m-d') : null,
                'start_time_raw' => $agenda->start_time,
                'end_date_raw' => $agenda->end_date ? $agenda->end_date->format('Y-m-d') : null,
                'end_time_raw' => $agenda->end_time,
                'start' => $agenda->start_date ? $agenda->start_date->format('Y-m-d') . 'T' . ($agenda->start_time ?? '00:00:00') : null,
                'end' => $agenda->end_date ? $agenda->end_date->format('Y-m-d') . 'T' . ($agenda->end_time ?? '23:59:59') : null,
                'type' => strtolower($agenda->category ? $agenda->category->name : 'Rapat'),
                'isOnline' => (bool) $agenda->is_online,
                'onlineUrl' => $agenda->online_url,
                'onlineMeetingId' => $agenda->online_meeting_id,
                'stNumber' => $agenda->st_number,
                'isAllEmployees' => (bool) $agenda->is_all_employees,
                'team' => $agenda->unit ? $agenda->unit->name : 'Pusat',
                'participants' => $participants,
                'gCalStart' => $gStart,
                'gCalEnd' => $gEnd,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedEvents
        ]);
    }
}
