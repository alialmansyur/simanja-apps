<?php
require __DIR__."/../vendor/autoload.php";
$app = require_once __DIR__."/../bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
header("Content-Type: application/json");
$item = App\Models\Employee::leftJoin("ref_units", "ref_pegawai.unit_id", "=", "ref_units.id")->select("ref_pegawai.*", "ref_units.name as joined_unit_name")->where("ref_pegawai.nama", "LIKE", "%FANI%")->first();
echo json_encode($item);
