<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MigrateUnitKerjaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \Illuminate\Support\Facades\DB::table('ref_units')->truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $oldUnits = \Illuminate\Support\Facades\DB::table('ref_pegawai_unit_kerja')->get();

        $newUnits = [];
        foreach ($oldUnits as $unit) {
            // Generate a code (e.g. acronym of the name or just UNIT-{id})
            $words = explode(' ', $unit->nama);
            $acronym = '';
            foreach ($words as $w) {
                if (!empty($w)) {
                    $acronym .= strtoupper($w[0]);
                }
            }
            $code = $acronym . '-' . str_pad($unit->id, 3, '0', STR_PAD_LEFT);

            $newUnits[] = [
                'id' => $unit->id,
                'uid' => (string) \Illuminate\Support\Str::uuid(),
                'code' => $code,
                'name' => $unit->nama,
                'description' => 'Migrated from ref_pegawai_unit_kerja',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($newUnits)) {
            \Illuminate\Support\Facades\DB::table('ref_units')->insert($newUnits);
        }
    }
}
