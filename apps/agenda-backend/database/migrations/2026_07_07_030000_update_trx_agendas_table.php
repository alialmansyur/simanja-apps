<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            // Drop index that uses date_value
            $table->dropIndex(['date_value', 'ref_unit_id']);
            
            // Drop old date_value column
            $table->dropColumn('date_value');
            
            // Add new columns
            $table->date('start_date')->after('pic_employee_id');
            $table->date('end_date')->after('start_date');
            
            // Location specifics
            $table->boolean('is_online')->default(false)->after('ref_room_id');
            $table->string('offline_location', 255)->nullable()->after('is_online');
            
            // Online specifics
            $table->string('online_url', 255)->nullable()->after('offline_location');
            $table->string('online_meeting_id', 100)->nullable()->after('online_url');
            $table->string('online_password', 100)->nullable()->after('online_meeting_id');
            
            // Participants flag
            $table->boolean('is_all_employees')->default(true)->after('description');
            
            // Re-add index for start_date
            $table->index(['start_date', 'ref_unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            $table->dropIndex(['start_date', 'ref_unit_id']);
            
            $table->dropColumn([
                'start_date',
                'end_date',
                'is_online',
                'offline_location',
                'online_url',
                'online_meeting_id',
                'online_password',
                'is_all_employees'
            ]);
            
            $table->date('date_value')->default('2026-01-01');
            $table->index(['date_value', 'ref_unit_id']);
        });
    }
};
