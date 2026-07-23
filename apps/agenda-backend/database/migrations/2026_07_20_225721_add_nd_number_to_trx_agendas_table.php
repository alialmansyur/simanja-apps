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
            $table->string('nd_number', 100)->nullable()->comment('No Nota Dinas')->after('st_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            $table->dropColumn('nd_number');
        });
    }
};
