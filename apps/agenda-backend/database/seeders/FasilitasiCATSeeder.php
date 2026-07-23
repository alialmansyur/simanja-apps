<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FasilitasiCATSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Agenda Category
        $cat = DB::table('ref_agenda_categories')->where('name', 'Fasilitasi CAT')->first();
        if (!$cat) {
            DB::table('ref_agenda_categories')->insert([
                'name' => 'Fasilitasi CAT',
                'description' => 'Agenda untuk fasilitasi tes CAT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Event Types
        $eventTypes = [
            ['code' => 'SKD CPNS', 'name' => 'SKD CPNS - Seleksi Kompetensi Dasar (SKD) CPNS'],
            ['code' => 'SKB CPNS', 'name' => 'SKB CPNS - Seleksi Kompetensi Bidang (SKB) CPNS'],
            ['code' => 'SELKOM P3K', 'name' => 'SELKOM P3K - Seleksi Kompetensi (SELKOM) PPPK'],
            ['code' => 'SKD SEKDIN', 'name' => 'SKD SEKDIN - Seleksi Kompetensi Dasar (SKD) Sekolah Kedinasan'],
            ['code' => 'SKB SEKDIN', 'name' => 'SKB SEKDIN - Seleksi Kompetensi Bidang (SKB) Sekolah Kedinasan'],
            ['code' => 'NON ASN', 'name' => 'NON ASN - Seleksi Non ASN'],
            ['code' => 'UDIN', 'name' => 'UDIN - UDIN UPKP'],
            ['code' => 'SIMULASI', 'name' => 'SIMULASI - Simulasi CAT'],
            ['code' => 'CACT', 'name' => 'CACT - CACT'],
            ['code' => 'PROASN', 'name' => 'PROASN - Profilling ASN'],
            ['code' => 'UJIKOM', 'name' => 'UJIKOM - Uji Kompetensi UPSCPKP ASN Serang'],
            ['code' => 'SELKOM NON ASN', 'name' => 'SELKOM NON ASN - Seleksi Kompetensi Non ASN'],
        ];

        foreach ($eventTypes as $et) {
            DB::table('ref_event_types')->updateOrInsert(
                ['code' => $et['code']],
                ['name' => $et['name'], 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // 3. Officer Positions
        $positions = [
            'Koordinator',
            'IT',
            'Pengawas',
            'Admin',
            'Registrasi',
            'Keamanan'
        ];

        foreach ($positions as $pos) {
            DB::table('ref_officer_positions')->updateOrInsert(
                ['name' => $pos],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
