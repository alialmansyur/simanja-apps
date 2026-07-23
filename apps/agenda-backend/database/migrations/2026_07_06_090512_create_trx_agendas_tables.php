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
        Schema::create('trx_agendas', function (Blueprint $table) {
            $table->id();
            $table->string('st_number', 100)->nullable()->comment('No Surat Tugas');
            $table->string('title', 255);
            $table->text('description')->nullable();
            
            // Relasi ke Master Data
            $table->foreignId('ref_unit_id')->nullable()->constrained('ref_units')->nullOnDelete();
            $table->foreignId('ref_agenda_category_id')->nullable()->constrained('ref_agenda_categories')->nullOnDelete();
            $table->foreignId('ref_status_id')->nullable()->constrained('ref_statuses')->nullOnDelete();
            $table->foreignId('ref_room_id')->nullable()->constrained('ref_rooms')->nullOnDelete();
            
            // PIC
            $table->foreignId('pic_employee_id')->nullable()->constrained('ref_employees')->nullOnDelete();
            
            // Waktu Pelaksanaan
            $table->date('date_value');
            $table->time('start_time');
            $table->time('end_time');
            
            // Audit
            $table->foreignId('created_by')->nullable()->constrained('auth_users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indeks untuk filter cepat
            $table->index(['date_value', 'ref_unit_id']);
        });

        Schema::create('trx_agenda_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trx_agenda_id')->constrained('trx_agendas')->cascadeOnDelete();
            
            // Bisa berupa referensi pegawai internal atau teks biasa untuk guest/tamu
            $table->foreignId('ref_employee_id')->nullable()->constrained('ref_employees')->nullOnDelete();
            $table->string('guest_name', 150)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trx_agenda_participants');
        Schema::dropIfExists('trx_agendas');
    }
};
