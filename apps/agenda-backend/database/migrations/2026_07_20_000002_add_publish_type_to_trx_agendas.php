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
            $table->string('publish_type', 20)->default('public')->after('is_all_employees');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            $table->dropColumn('publish_type');
        });
    }
};
