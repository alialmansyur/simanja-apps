<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Agenda;
use App\Models\Announcement;

class DashboardController extends Controller
{
    /**
     * Get Dashboard KPIs
     */
    public function kpi(Request $request): JsonResponse
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $user = $request->user();
        $applyRoleFilter = function ($query) use ($user) {
            $query->visibleTo($user);
        };

        $totalAgendasQuery = Agenda::whereMonth('trx_agendas.start_date', $currentMonth)
            ->whereYear('trx_agendas.start_date', $currentYear);
        $applyRoleFilter($totalAgendasQuery);
        $totalAgendasThisMonth = $totalAgendasQuery->count();

        $completedAgendasQuery = Agenda::whereMonth('trx_agendas.start_date', $currentMonth)
            ->whereYear('trx_agendas.start_date', $currentYear)
            ->whereIn('trx_agendas.ref_status_id', function ($query) {
                $query->select('id')->from('ref_statuses')->where('name', 'Selesai');
            });
        $applyRoleFilter($completedAgendasQuery);
        $completedAgendasThisMonth = $completedAgendasQuery->count();

        $upcomingRemindersQuery = Agenda::where('trx_agendas.start_date', '>=', Carbon::now()->toDateString())
            ->whereNotIn('trx_agendas.ref_status_id', function ($query) {
                $query->select('id')->from('ref_statuses')->where('name', 'Selesai');
            });
        $applyRoleFilter($upcomingRemindersQuery);
        $upcomingReminders = $upcomingRemindersQuery->count();

        return $this->successResponse([
            'totalAgendas' => (string) $totalAgendasThisMonth,
            'completedAgendas' => (string) $completedAgendasThisMonth,
            'upcomingReminders' => (string) $upcomingReminders,
        ]);
    }

    /**
     * Get active running text announcements
     */
    public function announcements(Request $request): JsonResponse
    {
        try {
            $announcements = Announcement::where('is_running_text', true)
                ->where('status', 'Published') // Assuming there is a status field like 'Published'
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

        // Fallback if no announcements are found in the db or table doesn't have data
        if ($announcements->isEmpty()) {
            $announcements = collect([
                'Selamat datang di Sistem Agenda Admin.',
                'Silakan periksa agenda harian Anda untuk memastikan semua jadwal berjalan lancar.',
            ]);
        }

        return $this->successResponse($announcements);
    }

    /**
     * Get Calendar Events
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $agendasQuery = Agenda::select('trx_agendas.*', 'ref_statuses.name as status_name')
            ->leftJoin('ref_statuses', 'trx_agendas.ref_status_id', '=', 'ref_statuses.id')
            ->with(['room', 'pic', 'participants.employee', 'participants.officerPosition', 'category', 'unit'])
            ->whereNull('trx_agendas.deleted_at')
            ->where('trx_agendas.start_date', '>=', Carbon::now()->subMonths(3)->toDateString())
            ->where('trx_agendas.start_date', '<=', Carbon::now()->addMonths(3)->toDateString());

        $agendasQuery->visibleTo($user);

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
            if ($agenda->is_all_employees && (!$agenda->category || $agenda->category->name !== 'Fasilitasi CAT')) {
                $participants = [['value' => 'all', 'label' => 'Semua Pegawai']];
            } else {
                foreach ($agenda->participants as $participant) {
                    if ($participant->employee) {
                        $participants[] = [
                            'value' => $participant->employee->id,
                            'label' => $participant->employee->nama,
                            'nip' => $participant->employee->nip,
                            'positionId' => $participant->ref_officer_position_id,
                            'positionName' => $participant->officerPosition ? $participant->officerPosition->name : '-'
                        ];
                    }
                }
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
                'isOnline' => (bool) $agenda->is_online,
                'onlineUrl' => $agenda->online_url,
                'onlineMeetingId' => $agenda->online_meeting_id,
                'onlinePassword' => $agenda->online_password,
                'stNumber' => $agenda->st_number,
                'ndNumber' => $agenda->nd_number,
                'isAllEmployees' => (bool) $agenda->is_all_employees,
                'team' => $agenda->unit ? $agenda->unit->name : 'Pusat',
                'creatorName' => $agenda->creator && $agenda->creator->employee ? $agenda->creator->employee->nama : ($agenda->creator ? $agenda->creator->name : null),
                'creatorNip' => $agenda->creator && $agenda->creator->employee ? $agenda->creator->employee->nip : null,
                'participants' => $participants,
            ];
        });

        return $this->successResponse($formattedEvents);
    }
}
