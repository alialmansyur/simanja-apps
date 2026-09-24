<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$backupDir = __DIR__ . '/../database/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$tablesToBackup = [
    'trx_agendas',
    'trx_agenda_rooms',
    'trx_agenda_participants',
    'trx_notulas',
    'trx_notula_attachments',
    'trx_audit_logs',
];

$backupData = [];
$sqlLines = [];
$sqlLines[] = "-- SIMANJA AGENDA BACKUP - " . date('Y-m-d H:i:s');
$sqlLines[] = "SET FOREIGN_KEY_CHECKS=0;";

foreach ($tablesToBackup as $table) {
    $rows = DB::table($table)->get()->map(fn($row) => (array)$row)->toArray();
    $backupData[$table] = $rows;
    echo "Backed up {$table}: " . count($rows) . " rows\n";

    if (!empty($rows)) {
        $sqlLines[] = "\n-- Table: {$table}";
        foreach ($rows as $row) {
            $cols = array_keys($row);
            $escapedCols = array_map(fn($c) => "`{$c}`", $cols);
            $values = array_map(function ($val) {
                if (is_null($val)) return "NULL";
                return "'" . addslashes((string)$val) . "'";
            }, array_values($row));

            $sqlLines[] = "INSERT INTO `{$table}` (" . implode(", ", $escapedCols) . ") VALUES (" . implode(", ", $values) . ");";
        }
    }
}

$sqlLines[] = "\nSET FOREIGN_KEY_CHECKS=1;";

$jsonPath = $backupDir . '/backup_agendas_20260924_full.json';
file_put_contents($jsonPath, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$sqlPath = $backupDir . '/backup_agendas_20260924_full.sql';
file_put_contents($sqlPath, implode("\n", $sqlLines));

echo "\nBackup completed successfully!\n";
echo "JSON: " . realpath($jsonPath) . " (" . filesize($jsonPath) . " bytes)\n";
echo "SQL : " . realpath($sqlPath) . " (" . filesize($sqlPath) . " bytes)\n";
