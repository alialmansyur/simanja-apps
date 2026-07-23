<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentTemplate;
use Illuminate\Support\Str;

class TempTemplateSeeder extends Seeder
{
    public function run()
    {
        $t = DocumentTemplate::create([
            'uuid' => (string) Str::uuid(),
            'category' => 'Surat Tugas',
            'code' => 'TPL-001',
            'name' => 'Template Surat Tugas Default',
            'format_nomor' => 'ST/{unit}/{year}',
            'is_active' => true
        ]);

        $t->body()->create([
            'kop_surat' => 'kop_surat.png',
            'menimbang' => 'a. bahwa pelaksanaan seleksi dengan menggunakan CAT BKN harus memenuhi persyaratan...',
            'mengingat' => '1. Peraturan Presiden Nomor 92 Tahun 2024 tentang Badan Kepegawaian Negara;',
            'memperhatikan' => 'Arahan Pimpinan mengenai penugasan pegawai.',
            'body_content' => '<p>Kepada: Pegawai yang Namanya tercantum dalam lampiran Surat Tugas ini.</p><br><p>Untuk: Melaksanakan tugas sebagai Tim Pelaksana.</p>'
        ]);
    }
}
