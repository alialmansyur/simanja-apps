<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$units = DB::table('ref_units')->get();
echo "=== ALL REF UNITS ===\n";
foreach ($units as $u) {
    echo json_encode($u, JSON_UNESCAPED_UNICODE) . "\n";
}

$targetUnit = DB::table('ref_units')
    ->where('id', '21365737-2057-413e-ae1a-f5f00eb67eaf')
    ->orWhere('id', 22)
    ->orWhere('code', 'TKSIDD-022')
    ->orWhere('name', 'LIKE', '%Sistem Informasi%')
    ->get();

echo "\n=== TARGET UNIT MATCH ===\n";
foreach ($targetUnit as $tu) {
    echo json_encode($tu, JSON_UNESCAPED_UNICODE) . "\n";
}
