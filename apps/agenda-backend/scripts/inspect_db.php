<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DATABASE TABLES ===" . PHP_EOL;
$tables = DB::select('SHOW TABLES');
$tableNames = [];
foreach ($tables as $t) {
    $name = array_values((array)$t)[0];
    $count = DB::table($name)->count();
    $tableNames[] = $name;
    echo sprintf("%-35s : %d rows\n", $name, $count);
}
