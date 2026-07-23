<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'group' => 'general',
                'key' => 'app.branding',
                'value' => ['app_name' => 'AgendaKu', 'admin_title' => 'AgendaKu Admin'],
                'type' => 'json',
                'description' => 'Branding utama aplikasi.',
            ],
            [
                'group' => 'general',
                'key' => 'app.timezone',
                'value' => ['timezone' => 'Asia/Jakarta'],
                'type' => 'json',
                'description' => 'Zona waktu default agenda.',
            ],
            [
                'group' => 'agenda',
                'key' => 'agenda.default_statuses',
                'value' => [
                    'draft',
                    'submitted',
                    'revision_requested',
                    'approved',
                    'published',
                    'completed',
                    'cancelled',
                    'archived',
                ],
                'type' => 'json',
                'description' => 'Daftar status default agenda.',
            ],
            [
                'group' => 'publication',
                'key' => 'publication.channels',
                'value' => ['dashboard'],
                'type' => 'json',
                'description' => 'Daftar channel publikasi yang aktif.',
            ],
            [
                'group' => 'notification',
                'key' => 'notification.reminders',
                'value' => ['approval' => true, 'publication' => true],
                'type' => 'json',
                'description' => 'Konfigurasi pengingat sistem.',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
