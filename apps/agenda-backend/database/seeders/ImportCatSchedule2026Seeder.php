<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Agenda;
use App\Models\Instansi;
use Carbon\Carbon;

class ImportCatSchedule2026Seeder extends Seeder
{
    public function run()
    {
        $jsonPath = base_path('scripts/mapped_cat_2026.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("File mapped_cat_2026.json not found. Run map_cat_agenda_full.php first.");
            return;
        }

        $records = json_decode(file_get_contents($jsonPath), true);
        $this->command->info("Loaded " . count($records) . " mapped records.");

        // Category ID for 'Fasilitasi CAT'
        $category = DB::table('ref_agenda_categories')->where('name', 'LIKE', '%CAT%')->first();
        $categoryId = $category ? $category->id : 3;

        // Status ID for 'Publish'
        $status = DB::table('ref_statuses')->where('name', 'LIKE', '%Publish%')->first();
        $statusId = $status ? $status->id : 14;

        // Target Unit ID: Tim Kerja Sistem Informasi dan Digitalisasi (UID: 21365737-2057-413e-ae1a-f5f00eb67eaf, ID: 22)
        $unitTksid = DB::table('ref_units')
            ->where('uid', '21365737-2057-413e-ae1a-f5f00eb67eaf')
            ->orWhere('code', 'TKSIDD-022')
            ->orWhere('name', 'LIKE', '%Sistem Informasi%')
            ->first();
        $targetUnitId = $unitTksid ? $unitTksid->id : 22;

        // Room IDs
        $roomLt3 = DB::table('ref_rooms')->where('name', 'LIKE', '%Lantai 3%')->first();
        $roomLt2 = DB::table('ref_rooms')->where('name', 'LIKE', '%Lantai 2%')->first();
        $roomLtDasar = DB::table('ref_rooms')->where('name', 'LIKE', '%Lantai Dasar%')->first();

        // 1. Wipe existing transaction tables safely before transaction
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('trx_agenda_rooms')->truncate();
        DB::table('trx_agenda_participants')->truncate();
        DB::table('trx_notula_attachments')->truncate();
        DB::table('trx_notulas')->truncate();
        DB::table('trx_agendas')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::beginTransaction();
        try {
            $insertedCount = 0;
            $skippedDups = 0;

            foreach ($records as $item) {
                if ($item['is_duplicate']) {
                    $skippedDups++;
                    continue;
                }

                // All agendas assigned strictly to Tim Kerja Sistem Informasi dan Digitalisasi
                $unitId = $targetUnitId;

                // Determine room & offline location
                $roomId = null;
                $offlineLocation = $item['lokasi_display'];

                if (str_contains(strtolower($item['lokasi_display']), 'lt. 3') || str_contains(strtolower($item['lokasi_display']), 'lantai 3')) {
                    $roomId = $roomLt3 ? $roomLt3->id : 5;
                    $offlineLocation = null;
                } elseif (str_contains(strtolower($item['lokasi_display']), 'lt. 2') || str_contains(strtolower($item['lokasi_display']), 'lantai 2')) {
                    $roomId = $roomLt2 ? $roomLt2->id : 4;
                    $offlineLocation = null;
                } elseif (str_contains(strtolower($item['lokasi_display']), 'dasar')) {
                    $roomId = $roomLtDasar ? $roomLtDasar->id : 6;
                    $offlineLocation = null;
                } elseif (trim($item['lokasi_display']) === 'Kanreg III BKN') {
                    // Default CAT lab Lantai 3
                    $roomId = $roomLt3 ? $roomLt3->id : 5;
                    $offlineLocation = null;
                }

                $agendaId = DB::table('trx_agendas')->insertGetId([
                    'ref_agenda_category_id' => $categoryId,
                    'ref_unit_id' => $unitId,
                    'ref_event_type_id' => $item['ref_event_type_id'],
                    'ref_instansi_id' => $item['ref_instansi_id'],
                    'ref_status_id' => $statusId,
                    'title' => $item['title'],
                    'description' => $item['description'],
                    'start_date' => $item['start_date'],
                    'end_date' => $item['end_date'],
                    'start_time' => '08:00:00',
                    'end_time' => '16:00:00',
                    'is_online' => 0,
                    'offline_location' => $offlineLocation,
                    'publish_type' => 'public',
                    'is_all_employees' => 0,
                    'st_number' => !empty($item['surat_bkn']) ? $item['surat_bkn'] : null,
                    'created_by' => 1,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                // Insert room pivot if applicable
                if ($roomId) {
                    DB::table('trx_agenda_rooms')->insert([
                        'trx_agenda_id' => $agendaId,
                        'ref_room_id' => $roomId,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                }

                $insertedCount++;
            }

            DB::commit();
            $this->command->info("Successfully inserted {$insertedCount} clean agenda records (Skipped {$skippedDups} duplicate entries).");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Failed to import agendas: " . $e->getMessage());
            throw $e;
        }
    }
}
