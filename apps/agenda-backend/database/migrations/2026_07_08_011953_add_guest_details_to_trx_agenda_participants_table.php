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
            $table->string('guest_nip', 50)->nullable()->after('guest_name');
            $table->string('guest_institution', 150)->nullable()->after('guest_nip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trx_agenda_participants', function (Blueprint $table) {
            $table->dropColumn(['guest_nip', 'guest_institution']);
        });
    }
};
