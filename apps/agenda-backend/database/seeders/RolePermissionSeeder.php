<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard'],
            ['name' => 'View Agenda', 'slug' => 'agenda.view', 'module' => 'agenda'],
            ['name' => 'Create Agenda', 'slug' => 'agenda.create', 'module' => 'agenda'],
            ['name' => 'Update Agenda', 'slug' => 'agenda.update', 'module' => 'agenda'],
            ['name' => 'Delete Agenda', 'slug' => 'agenda.delete', 'module' => 'agenda'],
            ['name' => 'Approve Agenda', 'slug' => 'agenda.approve', 'module' => 'agenda'],
            ['name' => 'Publish Agenda', 'slug' => 'agenda.publish', 'module' => 'agenda'],
            ['name' => 'Export Agenda', 'slug' => 'agenda.export', 'module' => 'agenda'],
            ['name' => 'View Calendar', 'slug' => 'calendar.view', 'module' => 'calendar'],
            ['name' => 'Manage Approval', 'slug' => 'approval.manage', 'module' => 'approval'],
            ['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'reports'],
            ['name' => 'Export Reports', 'slug' => 'reports.export', 'module' => 'reports'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'users'],
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'module' => 'roles'],
            ['name' => 'Manage Master Data', 'slug' => 'master-data.manage', 'module' => 'master-data'],
            ['name' => 'View Master Data', 'slug' => 'master-data.view', 'module' => 'master-data'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'module' => 'settings'],
            ['name' => 'View Audit Log', 'slug' => 'audit-log.view', 'module' => 'audit-log'],
            ['name' => 'Manage Publication', 'slug' => 'publication.manage', 'module' => 'publication'],
            ['name' => 'View Publication', 'slug' => 'publication.view', 'module' => 'publication'],
        ];

        $permissionModels = collect($permissions)->mapWithKeys(function (array $permission): array {
            $model = Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );

            return [$permission['slug'] => $model];
        });

        $roles = [
            'super-admin' => [
                'name' => 'Super Admin',
                'description' => 'Akses penuh ke seluruh sistem.',
                'permissions' => $permissionModels->keys()->all(),
            ],
            'admin-operasional' => [
                'name' => 'Admin Operasional',
                'description' => 'Mengelola agenda, publikasi, report, dan data operasional.',
                'permissions' => [
                    'dashboard.view',
                    'agenda.view',
                    'agenda.create',
                    'agenda.update',
                    'agenda.approve',
                    'agenda.publish',
                    'agenda.export',
                    'calendar.view',
                    'approval.manage',
                    'reports.view',
                    'reports.export',
                    'users.view',
                    'master-data.manage',
                    'settings.manage',
                    'audit-log.view',
                    'publication.manage',
                    'publication.view',
                ],
            ],
            'manager' => [
                'name' => 'Manager',
                'description' => 'Mereview dan menyetujui agenda divisinya.',
                'permissions' => [
                    'dashboard.view',
                    'agenda.view',
                    'agenda.approve',
                    'calendar.view',
                    'approval.manage',
                    'reports.view',
                    'users.view',
                    'master-data.view',
                    'publication.view',
                ],
            ],
            'pic-staff' => [
                'name' => 'PIC / Staff',
                'description' => 'Membuat dan memperbarui agenda miliknya.',
                'permissions' => [
                    'dashboard.view',
                    'agenda.view',
                    'agenda.create',
                    'agenda.update',
                    'agenda.export',
                    'calendar.view',
                    'reports.view',
                    'master-data.view',
                    'publication.view',
                ],
            ],
            'viewer' => [
                'name' => 'Viewer',
                'description' => 'Akses baca untuk ringkasan dan pelaporan.',
                'permissions' => [
                    'dashboard.view',
                    'agenda.view',
                    'calendar.view',
                    'reports.view',
                    'publication.view',
                ],
            ],
        ];

        foreach ($roles as $slug => $roleData) {
            $role = Role::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                    'is_system' => true,
                    'is_active' => true,
                ]
            );

            $role->permissions()->sync(
                $this->permissionIdsFromSlugs($permissionModels, $roleData['permissions'])
            );
        }
    }

    /**
     * @param Collection<string, Permission> $permissionModels
     * @param array<int, string> $slugs
     * @return array<int, int>
     */
    protected function permissionIdsFromSlugs(Collection $permissionModels, array $slugs): array
    {
        return collect($slugs)
            ->map(fn (string $slug) => $permissionModels->get($slug)?->id)
            ->filter()
            ->values()
            ->all();
    }
}
