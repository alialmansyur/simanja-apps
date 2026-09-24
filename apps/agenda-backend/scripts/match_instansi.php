<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$instansiTable = DB::table('ref_instansi')->get();

// Dictionary for aliases / abbreviations / new ministries
$aliasMap = [
    // Standardizing acronyms / new ministries
    'atr/bpn' => 'Kementerian Agraria dan Tata Ruang/Badan Pertanahan Nasional',
    'bkkbn' => 'Badan Kependudukan dan Keluarga Berencana Nasional',
    'bp2mi' => 'Badan Pelindungan Pekerja Migran Indonesia',
    'badan pengatur bumn' => 'Kementerian Badan Usaha Milik Negara', // or BP BUMN
    'barantin' => 'Badan Karantina Indonesia',
    'basarnas' => 'Badan Nasional Pencarian dan Pertolongan',
    'kejaksaan ri' => 'Kejaksaan Agung RI',
    'kepolisian ri' => 'Kepolisian Negara Republik Indonesia',
    'lan' => 'Lembaga Administrasi Negara',
    'lpp rri' => 'Radio Republik Indonesia',
    'tvri' => 'Televisi Republik Indonesia',
    'kementerian imipas' => 'Kementerian Imigrasi dan Pemasyarakatan',
    'kementerian ham' => 'Kementerian Hak Asasi Manusia',
    'kementerian kebudayaan' => 'Kementerian Kebudayaan',
    'kementerian kehutanan' => 'Kementerian Kehutanan',
    'kementerian pariwisata' => 'Kementerian Pariwisata',
    'kementerian pekerjaan umum' => 'Kementerian Pekerjaan Umum',
    'kementerian pendidikan tinggi, sains dan teknologi' => 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi',
    'badan gizi nasional' => 'Badan Gizi Nasional',
    'kementerian haji dan umrah ri' => 'Kementerian Haji dan Umrah',

    // Pemda variations without "Pemerintah"
    'kab bandung' => 'Pemerintah Kab. Bandung',
    'kab bandung barat' => 'Pemerintah Kab. Bandung Barat',
    'kab bogor' => 'Pemerintah Kab. Bogor',
    'kab ciamis' => 'Pemerintah Kab. Ciamis',
    'kab cianjur' => 'Pemerintah Kab. Cianjur',
    'kab garut' => 'Pemerintah Kab. Garut',
    'kab indramayu' => 'Pemerintah Kab. Indramayu',
    'kab kuningan' => 'Pemerintah Kab. Kuningan',
    'kab pandeglang' => 'Pemerintah Kab. Pandeglang',
    'kab pangandaran' => 'Pemerintah Kab. Pangandaran',
    'kab purwakarta' => 'Pemerintah Kab. Purwakarta',
    'kab serang' => 'Pemerintah Kab. Serang',
    'kab subang' => 'Pemerintah Kab. Subang',
    'kab sumedang' => 'Pemerintah Kab. Sumedang',
    'kab tasikmalaya' => 'Pemerintah Kab. Tasikmalaya',
    'kabupaten bogor' => 'Pemerintah Kab. Bogor',
    'kota bandung' => 'Pemerintah Kota Bandung',
    'kota banjar' => 'Pemerintah Kota Banjar',
    'kota bogor' => 'Pemerintah Kota Bogor',
    'kota cilegon' => 'Pemerintah Kota Cilegon',
    'kota cimahi' => 'Pemerintah Kota Cimahi',
    'kota cirebon' => 'Pemerintah Kota Cirebon',
    'kota depok' => 'Pemerintah Kota Depok',
    'kota serang' => 'Pemerintah Kota Serang',
    'kota sukabumi' => 'Pemerintah Kota Sukabumi',
    'kota tangerang' => 'Pemerintah Kota Tangerang',
    'kota tasikmalaya' => 'Pemerintah Kota Tasikmalaya',
    'provinsi jawa barat' => 'Pemerintah Provinsi Jawa Barat',
    'pemerintah prov. jawa barat' => 'Pemerintah Provinsi Jawa Barat',
    'pemerintah prov. banten' => 'Pemerintah Provinsi Banten',
];

function normalizeName($str) {
    $str = strtolower(trim($str));
    $str = preg_replace('/[^\w\s]/', '', $str);
    $str = preg_replace('/\s+/', ' ', $str);
    return $str;
}

function findInstansi($rawName, $instansiTable, $aliasMap) {
    $cleanRaw = strtolower(trim($rawName));
    
    // 1. Alias dictionary
    $targetName = $aliasMap[$cleanRaw] ?? $rawName;
    $normTarget = normalizeName($targetName);

    // 2. Exact match
    foreach ($instansiTable as $ins) {
        if (strtolower(trim($ins->nama)) === strtolower(trim($targetName)) || strtolower(trim($ins->nama)) === $cleanRaw) {
            return [$ins->id, $ins->nama, 'exact'];
        }
    }

    // 3. Normalized match
    foreach ($instansiTable as $ins) {
        if (normalizeName($ins->nama) === $normTarget) {
            return [$ins->id, $ins->nama, 'normalized'];
        }
    }

    // 4. Substring / contains match
    foreach ($instansiTable as $ins) {
        $normIns = normalizeName($ins->nama);
        if (str_contains($normIns, $normTarget) || str_contains($normTarget, $normIns)) {
            return [$ins->id, $ins->nama, 'partial'];
        }
    }

    return [null, null, 'not_found'];
}

// Test mapping on all unique raw instansi
require_once __DIR__ . '/parse_all_179.php';

echo "\n\n=== INSTANSI MATCHING RESULTS ===\n";
$matchedCount = 0;
$missingCount = 0;

$uniqueInstansiNames = array_keys($uniqueInstansiAll);
sort($uniqueInstansiNames);

$missingList = [];

foreach ($uniqueInstansiNames as $raw) {
    [$id, $dbName, $matchType] = findInstansi($raw, $instansiTable, $aliasMap);
    if ($id) {
        $matchedCount++;
        echo sprintf("✓ [%-35s] -> (ID: %3d) %s [%s]\n", substr($raw, 0, 35), $id, $dbName, $matchType);
    } else {
        $missingCount++;
        $missingList[] = $raw;
        echo sprintf("✗ [%-35s] -> NOT FOUND IN ref_instansi\n", substr($raw, 0, 35));
    }
}

echo "\nMatched: {$matchedCount} / " . count($uniqueInstansiNames) . "\n";
echo "Missing: {$missingCount} / " . count($uniqueInstansiNames) . "\n";

if (!empty($missingList)) {
    echo "\nList of Instansi to be added to ref_instansi:\n";
    foreach ($missingList as $m) echo "- {$m}\n";
}
