<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'Sekretariat', 'code' => 'SEKRETARIAT', 'description' => 'Koordinator utama operasional agenda.'],
            ['name' => 'Tata Usaha', 'code' => 'TU', 'description' => 'Administrasi umum dan surat tugas.'],
            ['name' => 'SIDIGI', 'code' => 'SIDIGI', 'description' => 'Divisi sistem dan digitalisasi.'],
            ['name' => 'MUTASI', 'code' => 'MUTASI', 'description' => 'Unit mutasi kepegawaian.'],
            ['name' => 'PENSIUN', 'code' => 'PENSIUN', 'description' => 'Unit layanan pensiun.'],
            ['name' => 'PMASN', 'code' => 'PMASN', 'description' => 'Unit pengelolaan ASN dan monitoring.'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}
