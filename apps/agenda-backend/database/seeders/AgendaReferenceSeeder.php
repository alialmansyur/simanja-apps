<?php

namespace Database\Seeders;

use App\Models\AgendaCategory;
use App\Models\Location;
use Illuminate\Database\Seeder;

class AgendaReferenceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Rapat', 'slug' => 'rapat', 'color' => '#059669', 'description' => 'Agenda rapat koordinasi atau evaluasi.'],
            ['name' => 'Sosialisasi', 'slug' => 'sosialisasi', 'color' => '#d97706', 'description' => 'Agenda sosialisasi atau penyampaian informasi.'],
            ['name' => 'Pelatihan', 'slug' => 'pelatihan', 'color' => '#2563eb', 'description' => 'Agenda pelatihan internal maupun eksternal.'],
            ['name' => 'Monitoring', 'slug' => 'monitoring', 'color' => '#7c3aed', 'description' => 'Agenda monitoring, supervisi, dan tindak lanjut.'],
        ];

        foreach ($categories as $category) {
            AgendaCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }

        $locations = [
            ['name' => 'Ruang Rapat Lt. 2', 'code' => 'RPT-L2', 'building' => 'Gedung Utama', 'floor' => '2', 'room' => 'Ruang Rapat 2', 'capacity' => 24],
            ['name' => 'Aula Utama', 'code' => 'AULA-UTAMA', 'building' => 'Gedung Utama', 'floor' => '1', 'room' => 'Aula', 'capacity' => 120],
            ['name' => 'Ruang SIDIGI', 'code' => 'SIDIGI-01', 'building' => 'Gedung B', 'floor' => '3', 'room' => 'Ruang SIDIGI', 'capacity' => 16],
            ['name' => 'Ruang Hybrid Meeting', 'code' => 'HYBRID-01', 'building' => 'Gedung C', 'floor' => '2', 'room' => 'Hybrid Meeting', 'capacity' => 18],
        ];

        foreach ($locations as $location) {
            Location::updateOrCreate(
                ['code' => $location['code']],
                array_merge($location, ['is_active' => true])
            );
        }
    }
}
