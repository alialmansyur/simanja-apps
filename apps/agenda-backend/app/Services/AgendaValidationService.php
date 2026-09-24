<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AgendaValidationService
{
    /**
     * Check if an agenda is a duplicate of an existing active agenda within the same unit and category.
     *
     * Business Rule:
     * An agenda is considered a duplicate ONLY IF:
     * - Same Unit (ref_unit_id)
     * - Same Category (ref_agenda_category_id)
     * - Date Range Overlaps (start_date_A <= end_date_B AND end_date_A >= start_date_B)
     * - Time Overlaps (if specific times are provided on the same single day)
     * - Location Conflict:
     *   * If both are Online: same meeting ID / URL or generic online
     *   * If both are Offline:
     *     - Shared room in trx_agenda_rooms
     *     - OR same offline_location string (case-insensitive normalized)
     *     - OR both have empty/unspecified rooms and offline locations
     *
     * Agendas with different locations (different rooms, different external venues, or online vs offline)
     * are explicitly PERMITTED.
     *
     * @param int|string $unitId
     * @param int|string $categoryId
     * @param string $startDate (Y-m-d)
     * @param string|null $endDate (Y-m-d)
     * @param string|null $startTime (H:i or H:i:s)
     * @param string|null $endTime (H:i or H:i:s)
     * @param bool $isOnline
     * @param array $roomIds
     * @param string|null $offlineLocation
     * @param string|null $onlineMeetingId
     * @param string|null $onlineUrl
     * @param int|string|null $excludeAgendaId
     * @return string|null Error message if duplicate, null if valid
     */
    public function checkDuplicate(
        $unitId,
        $categoryId,
        $startDate,
        $endDate = null,
        $startTime = null,
        $endTime = null,
        $isOnline = false,
        array $roomIds = [],
        $offlineLocation = null,
        $onlineMeetingId = null,
        $onlineUrl = null,
        $excludeAgendaId = null
    ): ?string {
        if (!$unitId || !$categoryId || !$startDate) {
            return null;
        }

        $endDate = $endDate ?: $startDate;

        // Query active agendas from the same unit & category with overlapping date ranges
        $query = DB::table('trx_agendas')
            ->where('ref_unit_id', $unitId)
            ->where('ref_agenda_category_id', $categoryId)
            ->whereNull('deleted_at')
            ->where('start_date', '<=', $endDate)
            ->where(function ($q) use ($startDate) {
                $q->where('end_date', '>=', $startDate)
                  ->orWhere(function ($sub) use ($startDate) {
                      $sub->whereNull('end_date')->where('start_date', '>=', $startDate);
                  });
            });

        if ($excludeAgendaId) {
            $query->where('id', '!=', $excludeAgendaId);
        }

        $candidates = $query->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        $candidateIds = $candidates->pluck('id')->toArray();
        $candidateRooms = DB::table('trx_agenda_rooms')
            ->whereIn('trx_agenda_id', $candidateIds)
            ->get()
            ->groupBy('trx_agenda_id');

        // Filter out non-numeric / 'lainnya' options from request roomIds
        $validRequestRoomIds = array_values(array_filter($roomIds, function ($id) {
            return is_numeric($id) && (int)$id > 0;
        }));

        foreach ($candidates as $candidate) {
            // Check time overlap on single-day agendas if times are provided
            $candEndDate = $candidate->end_date ?: $candidate->start_date;
            if ($startDate === $endDate && $candidate->start_date === $candEndDate) {
                if ($startTime && $endTime && $candidate->start_time && $candidate->end_time) {
                    $candStart = substr($candidate->start_time, 0, 5);
                    $candEnd = substr($candidate->end_time, 0, 5);
                    $reqStart = substr($startTime, 0, 5);
                    $reqEnd = substr($endTime, 0, 5);

                    if ($reqEnd <= $candStart || $reqStart >= $candEnd) {
                        // No time overlap on the same day -> no duplicate conflict
                        continue;
                    }
                }
            }

            $isLocationConflict = false;
            $conflictDetail = '';

            if ($isOnline && (bool)$candidate->is_online) {
                // Both are online
                $hasReqMeetingId = !empty($onlineMeetingId);
                $hasCandMeetingId = !empty($candidate->online_meeting_id);
                $hasReqUrl = !empty($onlineUrl);
                $hasCandUrl = !empty($candidate->online_url);

                if ($hasReqMeetingId && $hasCandMeetingId && trim($onlineMeetingId) === trim($candidate->online_meeting_id)) {
                    $isLocationConflict = true;
                    $conflictDetail = 'Meeting ID yang sama';
                } elseif ($hasReqUrl && $hasCandUrl && trim($onlineUrl) === trim($candidate->online_url)) {
                    $isLocationConflict = true;
                    $conflictDetail = 'Link Meeting yang sama';
                } elseif (!$hasReqMeetingId && !$hasCandMeetingId && !$hasReqUrl && !$hasCandUrl) {
                    // Both are generic online sessions without explicit meeting links
                    $isLocationConflict = true;
                    $conflictDetail = 'Moda Online yang sama';
                }
            } elseif (!$isOnline && !(bool)$candidate->is_online) {
                // Both are offline
                $candRoomIds = isset($candidateRooms[$candidate->id])
                    ? $candidateRooms[$candidate->id]->pluck('ref_room_id')->map(fn($id) => (int)$id)->toArray()
                    : [];

                $reqRoomInts = array_map('intval', $validRequestRoomIds);

                // 1. Check physical room overlap
                if (!empty($reqRoomInts) && !empty($candRoomIds)) {
                    $intersect = array_intersect($reqRoomInts, $candRoomIds);
                    if (!empty($intersect)) {
                        $isLocationConflict = true;
                        $conflictDetail = 'Ruangan yang sama';
                    }
                }

                // 2. Check offline location string overlap
                $reqOffline = !empty($offlineLocation) ? trim($offlineLocation) : null;
                $candOffline = !empty($candidate->offline_location) ? trim($candidate->offline_location) : null;

                if ($reqOffline && $candOffline) {
                    if (strcasecmp($reqOffline, $candOffline) === 0) {
                        $isLocationConflict = true;
                        $conflictDetail = "Lokasi Luar yang sama ({$candidate->offline_location})";
                    }
                }

                // 3. Both offline with completely empty room & location specifications
                if (empty($reqRoomInts) && empty($candRoomIds) && empty($reqOffline) && empty($candOffline)) {
                    $isLocationConflict = true;
                    $conflictDetail = 'Lokasi yang sama';
                }
            }
            // If one is online and one is offline -> different locations -> NOT conflict

            if ($isLocationConflict) {
                return "Agenda dengan Unit, Kategori Kegiatan, Periode Tanggal, dan {$conflictDetail} sudah terdaftar: \"{$candidate->title}\".";
            }
        }

        return null;
    }
}
