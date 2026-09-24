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
            if (!Schema::hasColumn('trx_agendas', 'ref_instansi_id')) {
                $table->bigInteger('ref_instansi_id')->nullable()->after('ref_unit_id');
            } else {
                // Ensure column is signed bigint(20) matching ref_instansi.id
                DB::statement('ALTER TABLE trx_agendas MODIFY ref_instansi_id BIGINT(20) NULL');
            }
        });

        Schema::table('trx_agendas', function (Blueprint $table) {
            // Check if foreign key does not exist yet
            $foreignKeys = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'trx_agendas' 
                  AND CONSTRAINT_NAME = 'trx_agendas_ref_instansi_id_foreign'
            ");

            if (empty($foreignKeys)) {
                $table->foreign('ref_instansi_id', 'trx_agendas_ref_instansi_id_foreign')
                      ->references('id')
                      ->on('ref_instansi')
                      ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agendas', function (Blueprint $table) {
            if (Schema::hasColumn('trx_agendas', 'ref_instansi_id')) {
                $table->dropForeign('trx_agendas_ref_instansi_id_foreign');
                $table->dropColumn('ref_instansi_id');
            }
        });
    }
};
