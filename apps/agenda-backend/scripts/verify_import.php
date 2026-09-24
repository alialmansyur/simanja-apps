<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Agenda;
use Illuminate\Support\Facades\DB;

echo "=== DATABASE INJECTION VERIFICATION ===" . PHP_EOL;
$count = Agenda::count();
$roomsCount = DB::table('trx_agenda_rooms')->count();
$withInstansi = Agenda::whereNotNull('ref_instansi_id')->count();

echo "Total Agendas in DB      : {$count}" . PHP_EOL;
echo "Agendas with Room Pivot  : {$roomsCount}" . PHP_EOL;
echo "Agendas with Instansi FK : {$withInstansi}" . PHP_EOL;

echo PHP_EOL . "=== SAMPLES (FIRST 5 RECORDS) ===" . PHP_EOL;
$samples = Agenda::with(['instansi', 'eventType', 'rooms', 'category', 'unit'])->take(5)->get();
foreach ($samples as $idx => $s) {
    echo sprintf("[%d] %s\n", $idx + 1, $s->title);
    echo "    Instansi   : " . ($s->instansi ? $s->instansi->nama . " (ID: {$s->instansi->id})" : 'NONE') . PHP_EOL;
    echo "    Event Type : " . ($s->eventType ? $s->eventType->name : 'NONE') . PHP_EOL;
    echo "    Dates      : {$s->start_date} s/d {$s->end_date}" . PHP_EOL;
    echo "    Location   : " . ($s->offline_location ?: ($s->rooms->isNotEmpty() ? $s->rooms->pluck('name')->join(', ') : '-')) . PHP_EOL;
    echo "    Unit       : " . ($s->unit ? $s->unit->name : '-') . PHP_EOL;
    echo "    Desc       : {$s->description}" . PHP_EOL . PHP_EOL;
}
