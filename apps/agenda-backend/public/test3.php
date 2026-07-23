<?php
require __DIR__."/../vendor/autoload.php";
$app = require_once __DIR__."/../bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
header("Content-Type: application/json");
echo json_encode(app(App\Services\MasterDataService::class)->getAll("divisi-unit")->first());
