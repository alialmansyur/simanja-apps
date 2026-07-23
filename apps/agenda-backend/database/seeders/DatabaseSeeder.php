<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. REF UNITS
        $units = [
            ['code' => 'KR-III', 'name' => 'Kantor Regional III'],
            ['code' => 'TU-KR', 'name' => 'Tim Kerja Bagian Tata Usaha Kanreg'],
            ['code' => 'SID', 'name' => 'Tim Kerja Sistem Informasi & Digitalisasi'],
            ['code' => 'WASDAL', 'name' => 'Tim Kerja Pengawasan & Pengendalian'],
            ['code' => 'PM-ASN', 'name' => 'Tim Kerja Pembinaan Manajemen ASN'],
            ['code' => 'STAT-PHB', 'name' => 'Tim Kerja Status & Pemberhentian'],
            ['code' => 'ANG-MUT', 'name' => 'Tim Kerja Pengangkatan & Mutasi'],
        ];
        foreach ($units as $unit) {
            DB::table('ref_units')->insertOrIgnore(array_merge($unit, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 2. REF AGENDA CATEGORIES
        $categories = [
            ['name' => 'Rapat'],
            ['name' => 'Monitoring'],
            ['name' => 'Sosialisasi'],
            ['name' => 'Pembahasan'],
            ['name' => 'Persiapan'],
        ];
        foreach ($categories as $cat) {
            DB::table('ref_agenda_categories')->insertOrIgnore(array_merge($cat, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 3. REF STATUSES
        $statuses = [
            ['name' => 'Draft', 'type' => 'AGENDA'],
            ['name' => 'Terjadwal', 'type' => 'AGENDA'],
            ['name' => 'Butuh approval', 'type' => 'AGENDA'],
            ['name' => 'Selesai', 'type' => 'AGENDA'],
        ];
        foreach ($statuses as $stat) {
            DB::table('ref_statuses')->insertOrIgnore(array_merge($stat, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 4. SETTINGS
        $this->call(SettingSeeder::class);

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 5. PERMISSIONS & ROLES
        $permissions = [
            'view_dashboard',
            'view_agenda',
            'view_calendar',
            'view_rooms',
            'view_notula',
            'view_history',
            'view_users',
            'view_roles',
            'view_master_data',
            'view_settings',
            'view_audit',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions($permissions); // Super Admin has all permissions

        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions([
            'view_dashboard', 'view_agenda', 'view_calendar', 'view_rooms', 
            'view_notula', 'view_history'
        ]); // Admin only has operational permissions

        $userRole = Role::firstOrCreate(['name' => 'User']);
        $userRole->syncPermissions([
            'view_dashboard', 'view_calendar', 'view_history'
        ]); // Basic user access

        // 6. USERS
        $saUser = User::firstOrCreate(
            ['email' => 'superadmin@agenda.com'],
            ['name' => 'Super Administrator', 'password' => Hash::make('password')]
        );
        $saUser->assignRole('Super Admin');

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@agenda.com'],
            ['name' => 'Administrator', 'password' => Hash::make('password')]
        );
        $adminUser->assignRole('Admin');

        $regularUser = User::firstOrCreate(
            ['email' => 'user@agenda.com'],
            ['name' => 'Regular User', 'password' => Hash::make('password')]
        );
        $regularUser->assignRole('User');

        // 7. AUTH MENUS
        $menus = [
            ['title' => 'Dashboard', 'url' => '/admin', 'icon' => 'LayoutDashboard', 'order_num' => 1, 'permission_name' => 'view_dashboard'],
            ['title' => 'Agenda', 'url' => '/admin/agenda', 'icon' => 'CalendarDays', 'order_num' => 2, 'permission_name' => 'view_agenda'],
            ['title' => 'Calendar', 'url' => '/admin/calendar', 'icon' => 'Calendar', 'order_num' => 3, 'permission_name' => 'view_calendar'],
            ['title' => 'Ruangan', 'url' => '/admin/ruangan', 'icon' => 'Building2', 'order_num' => 4, 'permission_name' => 'view_rooms'],
            ['title' => 'Notula', 'url' => '/admin/notula', 'icon' => 'FileText', 'order_num' => 5, 'permission_name' => 'view_notula'],
            ['title' => 'Riwayat', 'url' => '/admin/riwayat', 'icon' => 'History', 'order_num' => 6, 'permission_name' => 'view_history'],
            ['title' => 'Users', 'url' => '/admin/users', 'icon' => 'Users', 'order_num' => 7, 'permission_name' => 'view_users'],
            ['title' => 'Roles & Permissions', 'url' => '/admin/roles-permissions', 'icon' => 'Shield', 'order_num' => 8, 'permission_name' => 'view_roles'],
            ['title' => 'Master Data', 'url' => '/admin/master-data', 'icon' => 'Database', 'order_num' => 9, 'permission_name' => 'view_master_data'],
            ['title' => 'Settings', 'url' => '/admin/settings', 'icon' => 'Settings', 'order_num' => 10, 'permission_name' => 'view_settings'],
            ['title' => 'Audit Log', 'url' => '/admin/audit-log', 'icon' => 'ClipboardList', 'order_num' => 11, 'permission_name' => 'view_audit'],
        ];

        foreach ($menus as $menu) {
            DB::table('auth_menus')->insertOrIgnore(array_merge($menu, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $this->call(EmployeeUserSeeder::class);
    }
}
