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
        Schema::table('trx_notulas', function (Blueprint $table) {
            // Drop foreign key and unique constraint for trx_agenda_id
            $table->dropForeign(['trx_agenda_id']);
            $table->dropUnique(['trx_agenda_id']);
            
            // Modify trx_agenda_id to be nullable
            $table->foreignId('trx_agenda_id')->nullable()->change();
            
            // Re-add foreign key constraint
            $table->foreign('trx_agenda_id')->references('id')->on('trx_agendas')->cascadeOnDelete();
            
            $table->uuid('uuid')->unique()->after('id');
            $table->string('title')->nullable()->after('trx_agenda_id');
            $table->string('status', 50)->default('Draft')->after('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_notulas', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'title', 'status']);
            
            $table->dropForeign(['trx_agenda_id']);
            $table->foreignId('trx_agenda_id')->unique()->change();
            $table->foreign('trx_agenda_id')->references('id')->on('trx_agendas')->cascadeOnDelete();
        });
    }
};
