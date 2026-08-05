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
        Schema::create('trx_agenda_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trx_agenda_id')->constrained('trx_agendas')->cascadeOnDelete();
            $table->foreignId('ref_room_id')->constrained('ref_rooms')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trx_agenda_rooms');
    }
};
