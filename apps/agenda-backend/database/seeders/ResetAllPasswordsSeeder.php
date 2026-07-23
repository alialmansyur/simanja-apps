<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResetAllPasswordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update all users' password to Agenda@2026
        User::query()->update([
            'password' => Hash::make('Agenda@2026'),
        ]);
    }
}
