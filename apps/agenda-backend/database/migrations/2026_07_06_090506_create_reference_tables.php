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
        // 1. Kategori Agenda
        Schema::create('ref_agenda_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Status Agenda / Notula
        Schema::create('ref_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->comment('AGENDA, NOTULA');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Unit Kerja / Departemen
        Schema::create('ref_units', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Ruangan
        Schema::create('ref_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->integer('capacity')->default(0);
            $table->string('location', 255)->nullable();
            $table->json('facilities')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Pegawai (Master Data)
        Schema::create('ref_employees', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 50)->unique()->nullable();
            $table->string('name', 150);
            $table->string('email', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->foreignId('ref_unit_id')->nullable()->constrained('ref_units')->nullOnDelete();
            $table->string('position', 150)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ref_employees');
        Schema::dropIfExists('ref_rooms');
        Schema::dropIfExists('ref_units');
        Schema::dropIfExists('ref_statuses');
        Schema::dropIfExists('ref_agenda_categories');
    }
};
