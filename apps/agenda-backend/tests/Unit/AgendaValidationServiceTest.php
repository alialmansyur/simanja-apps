<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AgendaValidationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;

class AgendaValidationServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected AgendaValidationService $service;
    protected int $unitId;
    protected int $categoryId;
    protected int $statusId;
    protected int $room1Id;
    protected int $room2Id;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AgendaValidationService();

        // Ensure we have test master data
        $unit = DB::table('ref_units')->first();
        $this->unitId = $unit ? $unit->id : 1;

        $category = DB::table('ref_agenda_categories')->first();
        $this->categoryId = $category ? $category->id : 1;

        $status = DB::table('ref_statuses')->first();
        $this->statusId = $status ? $status->id : 1;

        $rooms = DB::table('ref_rooms')->limit(2)->get();
        if ($rooms->count() >= 2) {
            $this->room1Id = $rooms[0]->id;
            $this->room2Id = $rooms[1]->id;
        } elseif ($rooms->count() === 1) {
            $this->room1Id = $rooms[0]->id;
            $this->room2Id = 9999;
        } else {
            $this->room1Id = 1;
            $this->room2Id = 2;
        }
    }

    /**
     * Test 1: Same unit + category + date + SAME room -> MUST be rejected as Duplicate
     */
    public function test_same_unit_category_date_same_room_is_rejected()
    {
        $agendaId = DB::table('trx_agendas')->insertGetId([
            'title' => 'Agenda Eksisting Ruang A',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_online' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('trx_agenda_rooms')->insert([
            'trx_agenda_id' => $agendaId,
            'ref_room_id' => $this->room1Id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-01',
            endDate: '2026-10-01',
            startTime: '08:00',
            endTime: '12:00',
            isOnline: false,
            roomIds: [$this->room1Id]
        );

        $this->assertNotNull($error);
        $this->assertStringContainsString('Ruangan yang sama', $error);
    }

    /**
     * Test 2: Same unit + category + date + DIFFERENT rooms -> MUST BE ALLOWED
     */
    public function test_same_unit_category_date_different_rooms_is_allowed()
    {
        $agendaId = DB::table('trx_agendas')->insertGetId([
            'title' => 'Agenda Ruang 1',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-02',
            'end_date' => '2026-10-02',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_online' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('trx_agenda_rooms')->insert([
            'trx_agenda_id' => $agendaId,
            'ref_room_id' => $this->room1Id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-02',
            endDate: '2026-10-02',
            startTime: '08:00',
            endTime: '12:00',
            isOnline: false,
            roomIds: [$this->room2Id] // Different room
        );

        $this->assertNull($error);
    }

    /**
     * Test 3: Same unit + category + date + DIFFERENT external offline locations -> MUST BE ALLOWED
     */
    public function test_same_unit_category_date_different_external_locations_is_allowed()
    {
        DB::table('trx_agendas')->insertGetId([
            'title' => 'CAT Kanreg di Serang',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-03',
            'end_date' => '2026-10-05',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'is_online' => 0,
            'offline_location' => 'UPSCPKP ASN Banten Serang',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-03',
            endDate: '2026-10-05',
            startTime: '08:00',
            endTime: '16:00',
            isOnline: false,
            offlineLocation: 'BKPSDM Kab. Ciamis' // Different external location
        );

        $this->assertNull($error);
    }

    /**
     * Test 4: Same unit + category + date + SAME external offline location -> MUST be rejected as Duplicate
     */
    public function test_same_unit_category_date_same_external_location_is_rejected()
    {
        DB::table('trx_agendas')->insertGetId([
            'title' => 'CAT Kanreg di Serang Sesi 1',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-06',
            'end_date' => '2026-10-06',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'is_online' => 0,
            'offline_location' => 'UPSCPKP ASN Banten Serang',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-06',
            endDate: '2026-10-06',
            startTime: '08:00',
            endTime: '16:00',
            isOnline: false,
            offlineLocation: '  upscpkp asn banten serang  ' // Same location with different casing & whitespaces
        );

        $this->assertNotNull($error);
        $this->assertStringContainsString('Lokasi Luar yang sama', $error);
    }

    /**
     * Test 5: Same unit + category + date + One Online vs One Offline -> MUST BE ALLOWED
     */
    public function test_same_unit_category_date_online_vs_offline_is_allowed()
    {
        DB::table('trx_agendas')->insertGetId([
            'title' => 'Rapat Online Tim A',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-07',
            'end_date' => '2026-10-07',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'is_online' => 1,
            'online_meeting_id' => '888-999-111',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-07',
            endDate: '2026-10-07',
            startTime: '09:00',
            endTime: '11:00',
            isOnline: false,
            offlineLocation: 'Ruang Aula Utama'
        );

        $this->assertNull($error);
    }

    /**
     * Test 6: Same unit + category + date + Non-overlapping hours -> MUST BE ALLOWED
     */
    public function test_same_unit_category_date_non_overlapping_hours_is_allowed()
    {
        $agendaId = DB::table('trx_agendas')->insertGetId([
            'title' => 'Sesi Pagi',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-08',
            'end_date' => '2026-10-08',
            'start_time' => '08:00',
            'end_time' => '11:30',
            'is_online' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('trx_agenda_rooms')->insert([
            'trx_agenda_id' => $agendaId,
            'ref_room_id' => $this->room1Id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-08',
            endDate: '2026-10-08',
            startTime: '13:00',
            endTime: '16:00', // Afternoon - does not overlap with 08:00 - 11:30
            isOnline: false,
            roomIds: [$this->room1Id]
        );

        $this->assertNull($error);
    }

    /**
     * Test 7: Exclude self during update -> MUST BE ALLOWED
     */
    public function test_update_exclude_self_is_allowed()
    {
        $agendaId = DB::table('trx_agendas')->insertGetId([
            'title' => 'Agenda Mau Diupdate',
            'ref_unit_id' => $this->unitId,
            'ref_agenda_category_id' => $this->categoryId,
            'ref_status_id' => $this->statusId,
            'start_date' => '2026-10-09',
            'end_date' => '2026-10-09',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_online' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('trx_agenda_rooms')->insert([
            'trx_agenda_id' => $agendaId,
            'ref_room_id' => $this->room1Id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $error = $this->service->checkDuplicate(
            unitId: $this->unitId,
            categoryId: $this->categoryId,
            startDate: '2026-10-09',
            endDate: '2026-10-09',
            startTime: '08:00',
            endTime: '12:00',
            isOnline: false,
            roomIds: [$this->room1Id],
            excludeAgendaId: $agendaId // Self exclusion
        );

        $this->assertNull($error);
    }
}
