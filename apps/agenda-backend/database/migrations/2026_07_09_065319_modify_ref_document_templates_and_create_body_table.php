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
        // 1. Modify existing table
        Schema::table('ref_document_templates', function (Blueprint $table) {
            $table->uuid('uuid')->after('id')->nullable()->unique();
            $table->dropColumn([
                'kop_surat',
                'menimbang',
                'mengingat',
                'memperhatikan',
                'body_content'
            ]);
        });

        // 2. Create new body table
        Schema::create('ref_document_templates_body', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('ref_document_templates')->cascadeOnDelete();
            $table->string('kop_surat')->nullable()->default('kop_surat.png');
            $table->longText('menimbang')->nullable();
            $table->longText('mengingat')->nullable();
            $table->longText('memperhatikan')->nullable();
            $table->longText('body_content')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ref_document_templates_body');

        Schema::table('ref_document_templates', function (Blueprint $table) {
            $table->dropColumn('uuid');
            $table->json('kop_surat')->nullable();
            $table->text('menimbang')->nullable();
            $table->text('mengingat')->nullable();
            $table->text('memperhatikan')->nullable();
            $table->text('body_content')->nullable();
        });
    }
};
