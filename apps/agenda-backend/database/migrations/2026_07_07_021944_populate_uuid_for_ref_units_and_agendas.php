<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update units that have uid = '0' or empty to use a proper UUID
        $units = \Illuminate\Support\Facades\DB::table('ref_units')->where('uid', '0')->orWhere('uid', '')->orWhereNull('uid')->get();
        foreach ($units as $unit) {
            \Illuminate\Support\Facades\DB::table('ref_units')
                ->where('id', $unit->id)
                ->update(['uid' => (string) \Illuminate\Support\Str::uuid()]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally revert them back to '0'
        \Illuminate\Support\Facades\DB::table('ref_units')->update(['uid' => '0']);
    }
};
