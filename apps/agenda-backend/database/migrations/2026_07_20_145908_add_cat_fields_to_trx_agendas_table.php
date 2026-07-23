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
        Schema::table('trx_agendas', function (Blueprint $table) {
            $table->foreignId('ref_event_type_id')->nullable()->after('ref_agenda_category_id')->constrained('ref_event_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            $table->dropForeign(['ref_event_type_id']);
            $table->dropColumn('ref_event_type_id');
        });
    }
};
