<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\PublicDashboardController;
use Illuminate\Http\Request;

$ctrl = app(PublicDashboardController::class);

// 1. All 2026 events
$res = json_decode($ctrl->events(new Request(['year' => 2026]))->getContent(), true);
echo "Public Events 2026 Count: " . count($res['data'] ?? []) . PHP_EOL;

// Sample first 3
foreach (array_slice($res['data'] ?? [], 0, 3) as $e) {
    echo "- " . $e['title'] . PHP_EOL;
    echo "  Date: {$e['date']} | Location: {$e['location']} | Instansi: {$e['instansi']}" . PHP_EOL;
}
