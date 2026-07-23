<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $department = Department::where('code', 'SEKRETARIAT')->first();
        $role = Role::where('slug', 'super-admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $sidigiDepartment = Department::where('code', 'SIDIGI')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@agendaku.local'],
            [
                'name' => 'Super Admin AgendaKu',
                'username' => 'admin',
                'phone' => '081200000001',
                'job_title' => 'System Administrator',
                'employee_code' => 'ADM-001',
                'status' => 'active',
                'is_super_admin' => true,
                'department_id' => $department?->id,
                'email_verified_at' => now(),
                'password' => Hash::make('admin12345'),
            ]
        );

        if ($role) {
            $admin->roles()->syncWithoutDetaching([$role->id]);
        }

        User::updateOrCreate(
            ['email' => 'manager@agendaku.local'],
            [
                'name' => 'Manager Agenda',
                'username' => 'manager',
                'phone' => '081200000002',
                'job_title' => 'Division Manager',
                'employee_code' => 'MGR-001',
                'status' => 'active',
                'department_id' => $sidigiDepartment?->id,
                'email_verified_at' => now(),
                'password' => Hash::make('manager12345'),
            ]
        );

        $manager = User::where('email', 'manager@agendaku.local')->first();

        if ($manager && $managerRole) {
            $manager->roles()->syncWithoutDetaching([$managerRole->id]);
        }

        if ($sidigiDepartment && $manager) {
            $sidigiDepartment->update(['manager_id' => $manager->id]);
        }
    }
}
