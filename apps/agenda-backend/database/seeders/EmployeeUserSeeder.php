<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class EmployeeUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure 'User' role exists
        $role = DB::table('auth_roles')->where('name', 'User')->first();
        if (!$role) {
            $roleId = DB::table('auth_roles')->insertGetId([
                'name' => 'User',
                'guard_name' => 'web',
                'description' => 'Standard user role',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $role = DB::table('auth_roles')->where('id', $roleId)->first();
        }

        $employees = Employee::all();
        $validUnitIds = DB::table('ref_units')->pluck('id')->toArray();
        $usersToInsert = [];

        foreach ($employees as $employee) {
            $email = strtolower(str_replace([' ', '.'], ['_', ''], $employee->nama)) . '_' . $employee->nip . '@agenda.local';
            
            $existingUser = User::where('ref_employee_id', $employee->id)
                                ->orWhere('email', $email)
                                ->first();
            
            $validUnitId = in_array($employee->unit_id, $validUnitIds) ? $employee->unit_id : null;
            
            if (!$existingUser) {
                $user = User::create([
                    'ref_employee_id' => $employee->id,
                    'ref_unit_id' => $validUnitId,
                    'role_id' => $role->id,
                    'name' => $employee->nama,
                    'email' => $email,
                    'password' => Hash::make($employee->nip ?: 'Agenda@2026'),
                    'is_active' => true,
                ]);

                // Also assign via Spatie if method exists
                if (method_exists($user, 'assignRole')) {
                    $user->assignRole('User');
                }
            } else {
                $existingUser->update([
                    'ref_employee_id' => $employee->id,
                    'ref_unit_id' => $validUnitId,
                    'role_id' => $role->id,
                    'password' => Hash::make($employee->nip ?: 'Agenda@2026'),
                ]);

                if (method_exists($existingUser, 'assignRole') && !$existingUser->hasRole('User')) {
                    $existingUser->assignRole('User');
                }
            }
        }
    }
}
