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
        Schema::disableForeignKeyConstraints();
        Schema::table('auth_users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->constrained('auth_roles')->nullOnDelete()->after('id');
            $table->foreignId('ref_unit_id')->nullable()->constrained('ref_units')->nullOnDelete()->after('ref_employee_id');
        });
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::table('auth_users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['ref_unit_id']);
            $table->dropColumn(['role_id', 'ref_unit_id']);
        });
        Schema::enableForeignKeyConstraints();
    }
};
