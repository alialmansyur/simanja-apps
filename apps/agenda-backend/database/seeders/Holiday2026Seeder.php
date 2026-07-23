<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Holiday2026Seeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $holidays = [
            ['date' => '2026-01-01', 'title' => 'Tahun Baru 2026 Masehi'],
            ['date' => '2026-01-16', 'title' => 'Isra Mikraj Nabi Muhammad SAW'],
            ['date' => '2026-02-17', 'title' => 'Tahun Baru Imlek 2577 Kongzili'],
            ['date' => '2026-03-19', 'title' => 'Hari Suci Nyepi (Tahun Baru Saka 1948)'],
            ['date' => '2026-03-21', 'title' => 'Hari Raya Idulfitri 1447 Hijriah'],
            ['date' => '2026-03-22', 'title' => 'Hari Raya Idulfitri 1447 Hijriah'],
            ['date' => '2026-04-03', 'title' => 'Wafat Yesus Kristus'],
            ['date' => '2026-04-05', 'title' => 'Kebangkitan Yesus Kristus (Paskah)'],
            ['date' => '2026-05-01', 'title' => 'Hari Buruh Internasional'],
            ['date' => '2026-05-14', 'title' => 'Kenaikan Yesus Kristus'],
            ['date' => '2026-05-27', 'title' => 'Hari Raya Idul Adha 1447 Hijriah'],
            ['date' => '2026-05-31', 'title' => 'Hari Raya Waisak 2570 BE'],
            ['date' => '2026-06-01', 'title' => 'Hari Lahir Pancasila'],
            ['date' => '2026-06-16', 'title' => 'Tahun Baru Islam 1448 Hijriah'],
            ['date' => '2026-08-17', 'title' => 'Hari Proklamasi Kemerdekaan RI'],
            ['date' => '2026-08-25', 'title' => 'Maulid Nabi Muhammad SAW'],
            ['date' => '2026-12-25', 'title' => 'Hari Raya Natal'],
            
            // Cuti Bersama
            ['date' => '2026-02-16', 'title' => 'Cuti Bersama Tahun Baru Imlek'],
            ['date' => '2026-03-18', 'title' => 'Cuti Bersama Hari Suci Nyepi'],
            ['date' => '2026-03-20', 'title' => 'Cuti Bersama Hari Raya Idulfitri'],
            ['date' => '2026-03-23', 'title' => 'Cuti Bersama Hari Raya Idulfitri'],
            ['date' => '2026-03-24', 'title' => 'Cuti Bersama Hari Raya Idulfitri'],
            ['date' => '2026-05-15', 'title' => 'Cuti Bersama Kenaikan Yesus Kristus'],
            ['date' => '2026-05-28', 'title' => 'Cuti Bersama Hari Raya Idul Adha'],
            ['date' => '2026-12-24', 'title' => 'Cuti Bersama Hari Raya Natal'],
        ];

        // Ensure category 15 exists or we just hardcode it
        $statusId = DB::table('ref_statuses')->where('type', 'AGENDA')->where('name', 'Publish')->value('id') ?? 14;

        foreach ($holidays as $holiday) {
            DB::table('trx_agendas')->insert([
                'title' => $holiday['title'],
                'description' => 'Hari Libur Nasional / Cuti Bersama Tahun 2026',
                'ref_agenda_category_id' => 15,
                'ref_status_id' => $statusId, // Assuming 1 is a valid status id (e.g. Approved/Published)
                'start_date' => $holiday['date'],
                'end_date' => $holiday['date'],
                'start_time' => '00:00:00',
                'end_time' => '23:59:59',
                'is_all_employees' => 1,
                'publish_type' => 'public',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        echo "Holidays for 2026 seeded successfully!\n";
    }
}
