<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== REF AGENDA CATEGORIES ===\n";
$categories = DB::table('ref_agenda_categories')->get();
foreach ($categories as $cat) {
    echo json_encode($cat, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== REF EVENT TYPES ===\n";
$eventTypes = DB::table('ref_event_types')->get();
foreach ($eventTypes as $et) {
    echo json_encode($et, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== CURRENT AGENDAS DISTRIBUTION BY CATEGORY & EVENT TYPE ===\n";
$dist = DB::table('trx_agendas')
    ->leftJoin('ref_agenda_categories', 'trx_agendas.ref_agenda_category_id', '=', 'ref_agenda_categories.id')
    ->leftJoin('ref_event_types', 'trx_agendas.ref_event_type_id', '=', 'ref_event_types.id')
    ->select(
        'ref_agenda_categories.name as category_name',
        'ref_agenda_categories.id as category_id',
        'ref_event_types.name as event_type_name',
        'ref_event_types.id as event_type_id',
        DB::raw('count(*) as total')
    )
    ->groupBy('category_name', 'category_id', 'event_type_name', 'event_type_id')
    ->get();

foreach ($dist as $d) {
    echo sprintf("Category: [%2d] %-20s | Event Type: [%2d] %-50s | Count: %d\n", 
        $d->category_id, $d->category_name, $d->event_type_id, $d->event_type_name, $d->total);
}
