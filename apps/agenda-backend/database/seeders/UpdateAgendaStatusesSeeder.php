<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateAgendaStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all old agenda statuses
        $oldStatuses = DB::table('ref_statuses')->where('type', 'AGENDA')->get();
        $oldStatusIds = $oldStatuses->pluck('id')->toArray();

        // Delete old agenda statuses (this will set ref_status_id to null in trx_agendas because of nullOnDelete)
        DB::table('ref_statuses')->where('type', 'AGENDA')->delete();

        $statuses = [
            [
                'type' => 'AGENDA',
                'name' => 'Draft',
                'description' => 'Draft agenda, belum dipublikasi',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'AGENDA',
                'name' => 'Publish Personal',
                'description' => 'Agenda hanya bisa dilihat oleh yang bersangkutan',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'AGENDA',
                'name' => 'Publish Unit',
                'description' => 'Agenda bisa dilihat oleh sesama unit',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'AGENDA',
                'name' => 'Publish General',
                'description' => 'Agenda bisa dilihat semua orang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        DB::table('ref_statuses')->insert($statuses);
        
        // Update any existing agendas that had a status with the new 'Draft' status
        $draftStatus = DB::table('ref_statuses')->where('type', 'AGENDA')->where('name', 'Draft')->first();
        if ($draftStatus) {
            DB::table('trx_agendas')
                ->whereNull('ref_status_id')
                ->orWhereIn('ref_status_id', $oldStatusIds)
                ->update(['ref_status_id' => $draftStatus->id]);
        }
    }
}
