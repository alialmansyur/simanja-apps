<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== SEARCH INSTANSI FOR DIKTI / HAJI / BUMN ===\n";
$query1 = DB::table('ref_instansi')->where('nama', 'LIKE', '%Pendidikan%')->orWhere('nama', 'LIKE', '%Dikti%')->orWhere('nama', 'LIKE', '%Sains%')->get(['id', 'nama', 'kodeins']);
foreach ($query1 as $q) {
    echo "ID: {$q->id} | {$q->nama} (kodeins: {$q->kodeins})\n";
}

echo "\n=== SEARCH FOR HAJI / UMRAH ===\n";
$query2 = DB::table('ref_instansi')->where('nama', 'LIKE', '%Haji%')->orWhere('nama', 'LIKE', '%Umrah%')->get(['id', 'nama', 'kodeins']);
foreach ($query2 as $q) {
    echo "ID: {$q->id} | {$q->nama} (kodeins: {$q->kodeins})\n";
}

echo "\n=== SEARCH FOR BUMN ===\n";
$query3 = DB::table('ref_instansi')->where('nama', 'LIKE', '%BUMN%')->get(['id', 'nama', 'kodeins']);
foreach ($query3 as $q) {
    echo "ID: {$q->id} | {$q->nama} (kodeins: {$q->kodeins})\n";
}

$mapped = json_decode(file_get_contents(__DIR__ . '/mapped_cat_2026.json'), true);
echo "\n=== 9 DUPLICATE RECORDS DETAILS ===\n";
foreach ($mapped as $item) {
    if ($item['is_duplicate']) {
        $original = $mapped[$item['duplicate_of_index'] - 1];
        echo "Duplicate Item #{$item['index']} (Excel Row {$item['excel_row']}) of Item #{$original['index']} (Excel Row {$original['excel_row']}):\n";
        echo "  - Col No in Excel: {$item['col_no']} (Original Col No: {$original['col_no']})\n";
        echo "  - Surat: '{$item['surat_bkn']}' vs '{$original['surat_bkn']}'\n";
        echo "  - Tanggal: {$item['start_date']} s/d {$item['end_date']} (Raw: '{$item['raw_date']}')\n";
        echo "  - Instansi: {$item['instansi_name']}\n";
        echo "  - Lokasi: {$item['lokasi_display']}\n";
        echo "  - Title: {$item['title']}\n";
        echo "  --------------------------------------------------------\n";
    }
}
