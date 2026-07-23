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
        Schema::table('trx_agenda_participants', function (Blueprint $table) {
            $table->foreignId('ref_officer_position_id')->nullable()->after('ref_employee_id')->constrained('ref_officer_positions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agenda_participants', function (Blueprint $table) {
            $table->dropForeign(['ref_officer_position_id']);
            $table->dropColumn('ref_officer_position_id');
        });
    }
};
