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
        Schema::create('trx_notulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trx_agenda_id')->unique()->constrained('trx_agendas')->cascadeOnDelete();
            
            $table->longText('summary')->nullable();
            $table->longText('decisions')->nullable();
            $table->longText('notes')->nullable();
            
            // Audit
            $table->foreignId('created_by')->nullable()->constrained('auth_users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('trx_notula_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trx_notula_id')->constrained('trx_notulas')->cascadeOnDelete();
            
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->string('file_type', 100)->nullable();
            $table->integer('file_size')->default(0)->comment('In Bytes');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trx_notula_attachments');
        Schema::dropIfExists('trx_notulas');
    }
};
