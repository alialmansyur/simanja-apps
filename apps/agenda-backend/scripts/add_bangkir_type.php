<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== CHECK & ADD REF EVENT TYPES IF NEEDED ===\n";

// Check if BANGKIR exists
$bangkir = DB::table('ref_event_types')->where('code', 'BANGKIR')->orWhere('name', 'LIKE', '%Pengembangan Karier%')->first();
if (!$bangkir) {
    $newId = DB::table('ref_event_types')->insertGetId([
        'code' => 'BANGKIR',
        'name' => 'BANGKIR - Seleksi Pengembangan Karier',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "Added new ref_event_type: ID {$newId} (BANGKIR - Seleksi Pengembangan Karier)\n";
} else {
    echo "Existing BANGKIR ref_event_type: ID {$bangkir->id} ({$bangkir->name})\n";
}

// Let's check if UJIKOM name can be generalized:
$ujikom = DB::table('ref_event_types')->where('code', 'UJIKOM')->first();
if ($ujikom && $ujikom->name === 'UJIKOM - Uji Kompetensi UPSCPKP ASN Serang') {
    DB::table('ref_event_types')->where('id', $ujikom->id)->update([
        'name' => 'UJIKOM - Uji Kompetensi',
        'updated_at' => Carbon::now(),
    ]);
    echo "Updated UJIKOM name to 'UJIKOM - Uji Kompetensi'\n";
}

// Re-fetch all event types
$allTypes = DB::table('ref_event_types')->get();
echo "\n=== ALL REF EVENT TYPES NOW ===\n";
foreach ($allTypes as $t) {
    echo sprintf("ID: %2d | Code: %-15s | Name: %s\n", $t->id, $t->code, $t->name);
}
