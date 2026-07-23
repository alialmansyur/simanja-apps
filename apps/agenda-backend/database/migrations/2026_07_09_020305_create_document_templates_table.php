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
        Schema::create('ref_document_templates', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50)->default('Surat Tugas');
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->json('kop_surat')->nullable();
            $table->string('format_nomor', 150)->nullable();
            $table->text('menimbang')->nullable();
            $table->text('mengingat')->nullable();
            $table->text('memperhatikan')->nullable();
            $table->longText('body_content')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ref_document_templates');
    }
};
