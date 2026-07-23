<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SettingGroup;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [
                'code' => 'general',
                'name' => 'General',
                'description' => 'Pengaturan umum aplikasi (Nama, Logo, Copyright)',
                'order_no' => 1,
            ],
            [
                'code' => 'profil_instansi',
                'name' => 'Profil Instansi',
                'description' => 'Informasi profil institusi',
                'order_no' => 2,
            ],
            [
                'code' => 'workflow',
                'name' => 'Workflow Agenda',
                'description' => 'Konfigurasi alur kerja dan operasional agenda',
                'order_no' => 3,
            ],
            [
                'code' => 'dashboard',
                'name' => 'Dashboard',
                'description' => 'Pengaturan tampilan dan widget di dashboard',
                'order_no' => 4,
            ],
            [
                'code' => 'email',
                'name' => 'Email (SMTP)',
                'description' => 'Konfigurasi server SMTP untuk pengiriman email',
                'order_no' => 5,
            ],
            [
                'code' => 'notification',
                'name' => 'Notifikasi',
                'description' => 'Pengaturan pengiriman notifikasi sistem',
                'order_no' => 6,
            ],
            [
                'code' => 'auth',
                'name' => 'Otentikasi & Keamanan',
                'description' => 'Kebijakan login, password, dan sesi pengguna',
                'order_no' => 7,
            ],
            [
                'code' => 'mfa',
                'name' => 'Multi-Factor Auth (MFA)',
                'description' => 'Konfigurasi keamanan otentikasi ganda',
                'order_no' => 8,
            ]
        ];

        // Hapus grup yang tidak ada di daftar ini agar bersih
        $codes = array_column($groups, 'code');
        SettingGroup::whereNotIn('code', $codes)->delete();

        foreach ($groups as $groupData) {
            $group = SettingGroup::updateOrCreate(
                ['code' => $groupData['code']],
                $groupData
            );

            $this->seedSettingsForGroup($group);
        }
    }

    private function seedSettingsForGroup(SettingGroup $group)
    {
        $settings = [];

        switch ($group->code) {
            case 'general':
                $settings = [
                    ['key' => 'app.name', 'label' => 'Nama Aplikasi', 'value' => 'Sistem Manajemen Agenda', 'type' => 'text', 'is_public' => true],
                    ['key' => 'app.short_name', 'label' => 'Short Name', 'value' => 'SIMANJA', 'type' => 'text', 'is_public' => true],
                    ['key' => 'app.title', 'label' => 'Judul Browser (Title)', 'value' => 'SIMANJA - Sistem Manajemen Agenda', 'type' => 'text', 'is_public' => true, 'description' => 'Teks yang muncul di tab browser'],
                    ['key' => 'app.company', 'label' => 'Company/Instansi', 'value' => 'Instansi Anda', 'type' => 'text'],
                    ['key' => 'app.logo', 'label' => 'Logo Utama', 'value' => null, 'type' => 'image', 'is_public' => true],
                    ['key' => 'app.logo_dark', 'label' => 'Logo Dark Mode', 'value' => null, 'type' => 'image', 'is_public' => true],
                    ['key' => 'app.favicon', 'label' => 'Favicon', 'value' => null, 'type' => 'image', 'is_public' => true],
                    ['key' => 'app.footer', 'label' => 'Teks Footer', 'value' => 'Hak Cipta Dilindungi', 'type' => 'text', 'is_public' => true],
                    ['key' => 'app.copyright', 'label' => 'Teks Copyright', 'value' => '© 2026 Instansi Anda', 'type' => 'text', 'is_public' => true],
                    ['key' => 'app.timezone', 'label' => 'Zona Waktu Default', 'value' => 'Asia/Jakarta', 'type' => 'select', 'options' => json_encode([['label'=>'WIB (Asia/Jakarta)','value'=>'Asia/Jakarta'],['label'=>'WITA (Asia/Makassar)','value'=>'Asia/Makassar'],['label'=>'WIT (Asia/Jayapura)','value'=>'Asia/Jayapura']])],
                ];
                break;

            case 'profil_instansi':
                $settings = [
                    ['key' => 'instansi.nama', 'label' => 'Nama Instansi', 'value' => 'Instansi Anda', 'type' => 'text'],
                    ['key' => 'instansi.alamat', 'label' => 'Alamat Lengkap', 'value' => 'Jl. Jend. Sudirman', 'type' => 'textarea'],
                    ['key' => 'instansi.email', 'label' => 'Email Resmi', 'value' => 'info@instansi.go.id', 'type' => 'text'],
                    ['key' => 'instansi.telepon', 'label' => 'Telepon', 'value' => '021-123456', 'type' => 'text'],
                    ['key' => 'instansi.website', 'label' => 'Website URL', 'value' => 'https://instansi.go.id', 'type' => 'text'],
                    ['key' => 'instansi.pic', 'label' => 'Nama Penanggung Jawab', 'value' => 'Admin Utama', 'type' => 'text'],
                ];
                break;
                
            case 'workflow':
                $settings = [
                    ['key' => 'workflow.approval', 'label' => 'Aktifkan Approval Workflow', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'workflow.default_status', 'label' => 'Status Default Agenda Baru', 'value' => 'draft', 'type' => 'select', 'options' => json_encode([['label' => 'Draft', 'value' => 'draft'], ['label' => 'Published', 'value' => 'published']])],
                    ['key' => 'workflow.reminder', 'label' => 'Pengingat Otomatis (Jam)', 'value' => '24', 'type' => 'number', 'description' => 'Ingatkan partisipan X jam sebelum agenda dimulai'],
                    ['key' => 'workflow.work_days', 'label' => 'Hari Kerja Aktif', 'value' => json_encode(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']), 'type' => 'multiselect', 'options' => json_encode([['label'=>'Senin','value'=>'Mon'],['label'=>'Selasa','value'=>'Tue'],['label'=>'Rabu','value'=>'Wed'],['label'=>'Kamis','value'=>'Thu'],['label'=>'Jumat','value'=>'Fri'],['label'=>'Sabtu','value'=>'Sat'],['label'=>'Minggu','value'=>'Sun']])],
                    ['key' => 'workflow.operational_hours', 'label' => 'Jam Operasional Standar', 'value' => '08:00 - 17:00', 'type' => 'text'],
                ];
                break;
                
            case 'dashboard':
                $settings = [
                    ['key' => 'dashboard.layout', 'label' => 'Tipe Layout', 'value' => 'grid', 'type' => 'select', 'options' => json_encode([['label'=>'Grid Terpisah','value'=>'grid'], ['label'=>'List Horizontal','value'=>'list']])],
                    ['key' => 'dashboard.show_kpi', 'label' => 'Tampilkan KPI Cards', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'dashboard.refresh_rate', 'label' => 'Auto Refresh (Detik)', 'value' => '60', 'type' => 'number', 'description' => 'Isi 0 untuk menonaktifkan auto refresh'],
                    ['key' => 'dashboard.running_text', 'label' => 'Pesan Running Text', 'value' => 'Selamat datang di Aplikasi Agenda', 'type' => 'textarea', 'description' => 'Pesan ini akan ditampilkan berjalan di halaman Dashboard', 'is_public' => true],
                    ['key' => 'app.login_bg', 'label' => 'Login Background', 'value' => null, 'type' => 'image', 'is_public' => true],
                    ['key' => 'app.dashboard_bg', 'label' => 'Dashboard Background', 'value' => null, 'type' => 'image'],
                ];
                break;

            case 'email':
                $settings = [
                    ['key' => 'smtp.host', 'label' => 'SMTP Host', 'value' => 'smtp.mailtrap.io', 'type' => 'text'],
                    ['key' => 'smtp.port', 'label' => 'SMTP Port', 'value' => '2525', 'type' => 'number'],
                    ['key' => 'smtp.username', 'label' => 'Username', 'value' => '', 'type' => 'text'],
                    ['key' => 'smtp.password', 'label' => 'Password', 'value' => '', 'type' => 'password', 'description' => 'Biarkan kosong jika tidak ingin mengubah password'],
                    ['key' => 'smtp.encryption', 'label' => 'Encryption Type', 'value' => 'tls', 'type' => 'select', 'options' => json_encode([['label'=>'TLS','value'=>'tls'], ['label'=>'SSL','value'=>'ssl'], ['label'=>'None','value'=>'']])],
                    ['key' => 'smtp.sender_name', 'label' => 'Sender Name (Dari)', 'value' => 'Agenda System', 'type' => 'text'],
                    ['key' => 'smtp.sender_email', 'label' => 'Sender Email (Alamat)', 'value' => 'no-reply@instansi.go.id', 'type' => 'text'],
                ];
                break;

            case 'notification':
                $settings = [
                    ['key' => 'notif.email_enabled', 'label' => 'Aktifkan Notif Email', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'notif.push_enabled', 'label' => 'Aktifkan Push Notif (Web)', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'notif.agenda_created', 'label' => 'Kirim Saat Agenda Dibuat', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'notif.agenda_updated', 'label' => 'Kirim Saat Agenda Diubah', 'value' => '1', 'type' => 'switch'],
                    ['key' => 'notif.agenda_canceled', 'label' => 'Kirim Saat Agenda Dibatalkan', 'value' => '1', 'type' => 'switch'],
                ];
                break;
                
            case 'mfa':
                $settings = [
                    ['key' => 'mfa.enabled', 'label' => 'Aktifkan Modul MFA Global', 'value' => '1', 'type' => 'switch', 'is_public' => true],
                    ['key' => 'mfa.required_for_roles', 'label' => 'Role yang Wajib MFA', 'value' => json_encode(['Super Admin', 'Admin']), 'type' => 'multiselect', 'options' => json_encode([['label'=>'Super Admin','value'=>'Super Admin'], ['label'=>'Admin','value'=>'Admin'], ['label'=>'Pegawai','value'=>'Pegawai']])],
                    ['key' => 'mfa.remember_device', 'label' => 'Ingat Perangkat (Hari)', 'value' => '30', 'type' => 'number', 'description' => 'Berapa hari sistem mengingat perangkat setelah verifikasi MFA'],
                ];
                break;
                
            case 'auth':
                $settings = [
                    ['key' => 'auth.password_policy', 'label' => 'Aktifkan Kebijakan Password Ketat', 'value' => '1', 'type' => 'switch', 'description' => 'Mewajibkan kombinasi huruf, angka, dan simbol'],
                    ['key' => 'auth.min_password', 'label' => 'Panjang Minimal Password', 'value' => '8', 'type' => 'number'],
                    ['key' => 'auth.password_expired', 'label' => 'Umur Password (Hari)', 'value' => '90', 'type' => 'number', 'description' => 'Isi 0 untuk tidak kedaluwarsa'],
                    ['key' => 'auth.session_timeout', 'label' => 'Timeout Sesi (Menit)', 'value' => '120', 'type' => 'number', 'description' => 'Waktu logout otomatis jika tidak ada aktivitas'],
                    ['key' => 'auth.max_login_attempt', 'label' => 'Maksimal Gagal Login', 'value' => '5', 'type' => 'number'],
                    ['key' => 'auth.lock_account', 'label' => 'Durasi Akun Terkunci (Menit)', 'value' => '15', 'type' => 'number', 'description' => 'Setelah melampaui batas gagal login'],
                    ['key' => 'auth.single_session', 'label' => 'Batasi Satu Sesi Aktif', 'value' => '1', 'type' => 'switch', 'description' => 'Cegah login di banyak perangkat secara bersamaan'],
                ];
                break;
        }

        // Hapus pengaturan di database yang sudah tidak ada di definisi ini untuk grup terkait
        $keys = array_column($settings, 'key');
        Setting::where('group_id', $group->id)->whereNotIn('key', $keys)->delete();

        foreach ($settings as $i => $s) {
            Setting::updateOrCreate(
                ['key' => $s['key']],
                array_merge($s, [
                    'group_id' => $group->id,
                    'order_no' => $i + 1,
                    // Kita hanya set default value, value tidak kita timpahkan jika sudah ada di updateOrCreate
                    'default_value' => $s['value']
                ])
            );
        }
    }
}
