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
        Schema::create('auth_menus', function (Blueprint $table) {
            $table->id();
            
            // Relasi mandiri untuk sub-menu
            $table->foreignId('parent_id')->nullable()->constrained('auth_menus')->nullOnDelete();
            
            $table->string('title', 100);
            $table->string('url', 255)->nullable();
            $table->string('icon', 50)->nullable();
            $table->integer('order_num')->default(0);
            
            // Mengaitkan dengan permission Spatie, bukan role langsung
            // Jika null, berarti menu ini bisa diakses semua orang yang login
            $table->string('permission_name', 100)->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Index opsional
            $table->index('permission_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auth_menus');
    }
};
