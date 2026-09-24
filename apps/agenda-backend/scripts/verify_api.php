<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\PublicDashboardController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\UnitController;
use Illuminate\Http\Request;

echo "=== 1. PUBLIC DASHBOARD API TEST ===\n";
$publicCtrl = app(PublicDashboardController::class);

// Test September 2026
$reqSep = new Request(['year' => 2026, 'month' => 9]);
$resSep = json_decode($publicCtrl->index($reqSep)->getContent(), true);
echo "September 2026 Agendas Count : " . count($resSep['data']['agendas'] ?? []) . PHP_EOL;
echo "Running Text Count          : " . count($resSep['data']['running_text'] ?? []) . PHP_EOL;

// Test October 2026
$reqOct = new Request(['year' => 2026, 'month' => 10]);
$resOct = json_decode($publicCtrl->index($reqOct)->getContent(), true);
echo "October 2026 Agendas Count   : " . count($resOct['data']['agendas'] ?? []) . PHP_EOL;

// Test Year 2026
$reqYear = new Request(['year' => 2026]);
$resYear = json_decode($publicCtrl->index($reqYear)->getContent(), true);
echo "Year 2026 Total Agendas      : " . count($resYear['data']['agendas'] ?? []) . PHP_EOL;

echo "\n=== 2. REFERENCE INSTANSI API TEST ===\n";
$refCtrl = app(ReferenceController::class);
$resIns = json_decode($refCtrl->getInstansi(new Request())->getContent(), true);
echo "Total Active Instansi in API : " . count($resIns['data'] ?? []) . PHP_EOL;

echo "\n=== 3. ADMIN UNIT AGENDAS API TEST ===\n";
$unitCtrl = app(UnitController::class);
$kanregUnit = \App\Models\Unit::first();
if ($kanregUnit) {
    $resUnitAgendas = json_decode($unitCtrl->agendas(new Request(), $kanregUnit->slug ?? 'kanreg-iii-bkn')->getContent(), true);
    echo "Agendas for unit '{$kanregUnit->name}' : " . count($resUnitAgendas['data'] ?? []) . PHP_EOL;
}
