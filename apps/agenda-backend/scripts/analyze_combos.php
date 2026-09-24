<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$mapped = json_decode(file_get_contents(__DIR__ . '/mapped_cat_2026.json'), true);

$combos = [];
foreach ($mapped as $m) {
    if ($m['is_duplicate']) continue;
    $key = $m['raw_jenis'] . " ||| " . ($m['raw_nama'] ?: '[KOSONG]');
    $combos[$key][] = $m;
}

echo "=== RAW SELECTION COMBINATIONS IN EXCEL ===\n";
foreach ($combos as $k => $items) {
    [$jenis, $nama] = explode(" ||| ", $k);
    echo sprintf("Jenis: %-32s | Nama: %-45s | Count: %d | Sample Title: %s\n", 
        $jenis, substr($nama, 0, 45), count($items), substr($items[0]['title'], 0, 50));
}
