<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('ref_settings');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('setting_groups');

        Schema::create('setting_groups', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('order_no')->default(0);
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('setting_groups')->onDelete('cascade');
            $table->string('key')->unique();
            $table->string('label');
            $table->text('value')->nullable();
            $table->text('default_value')->nullable();
            $table->string('type');
            $table->json('options')->nullable();
            $table->string('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_system')->default(false);
            $table->string('validation')->nullable();
            $table->integer('order_no')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('setting_groups');
    }
};
