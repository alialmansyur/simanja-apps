<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Agenda;
use Illuminate\Support\Facades\DB;

$total = Agenda::count();
$tksidCount = Agenda::where('ref_unit_id', 22)->count();
$otherCount = Agenda::where('ref_unit_id', '!=', 22)->count();

echo "Total Agendas                          : {$total}\n";
echo "Agendas with Unit TKSIDD (ID 22)       : {$tksidCount}\n";
echo "Agendas with Other Units               : {$otherCount}\n\n";

$unit = DB::table('ref_units')->where('id', 22)->first();
echo "Unit Details:\n";
echo "- ID  : {$unit->id}\n";
echo "- UID : {$unit->uid}\n";
echo "- Code: {$unit->code}\n";
echo "- Name: {$unit->name}\n";
