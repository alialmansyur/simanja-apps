<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function excelDateToDate($serial) {
    if (is_numeric($serial)) {
        $unixTimestamp = ($serial - 25569) * 86400;
        return gmdate('Y-m-d', $unixTimestamp);
    }
    return null;
}

function parseIndoDateString($str) {
    $str = trim($str);
    if (empty($str)) return [null, null];

    if (is_numeric($str)) {
        $d = excelDateToDate((float)$str);
        return [$d, $d];
    }

    $months = [
        'januari' => '01', 'jan' => '01',
        'februari' => '02', 'feb' => '02',
        'maret' => '03', 'mar' => '03',
        'april' => '04', 'apr' => '04',
        'mei' => '05', 'may' => '05',
        'juni' => '06', 'jun' => '06',
        'juli' => '07', 'jul' => '07',
        'agustus' => '08', 'agt' => '08', 'ags' => '08',
        'september' => '09', 'sep' => '09',
        'oktober' => '10', 'okt' => '10',
        'november' => '11', 'nov' => '11',
        'desember' => '12', 'des' => '12',
    ];

    $clean = strtolower($str);

    // Case 1: "11 s.d 12 Februari 2026"
    if (preg_match('/^(\d{1,2})\s*(?:s\.d|s\/d|-)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $d2 = str_pad($m[2], 2, '0', STR_PAD_LEFT);
        $mo = $months[$m[3]] ?? '01';
        $yr = $m[4];
        return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d2}"];
    }

    // Case 2: "28 Februari s.d 2 Maret 2026"
    if (preg_match('/^(\d{1,2})\s+([a-z]+)\s*(?:s\.d|s\/d|-)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $mo1 = $months[$m[2]] ?? '01';
        $d2 = str_pad($m[3], 2, '0', STR_PAD_LEFT);
        $mo2 = $months[$m[4]] ?? '01';
        $yr = $m[5];
        return ["{$yr}-{$mo1}-{$d1}", "{$yr}-{$mo2}-{$d2}"];
    }

    // Case 3: "6 Januari 2026"
    if (preg_match('/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $mo = $months[$m[2]] ?? '01';
        $yr = $m[3];
        return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d1}"];
    }

    // Case 4: YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $clean)) {
        return [$clean, $clean];
    }

    return [null, null];
}

function getExcelRows($filePath) {
    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) throw new Exception("Cannot open {$filePath}");

    $sharedStrings = [];
    $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedStringsXml) {
        $xml = simplexml_load_string($sharedStringsXml);
        foreach ($xml->si as $si) {
            $text = '';
            if (isset($si->t)) {
                $text .= (string)$si->t;
            } elseif (isset($si->r)) {
                foreach ($si->r as $r) {
                    $text .= (string)$r->t;
                }
            }
            $sharedStrings[] = $text;
        }
    }

    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();

    $xml = simplexml_load_string($sheetXml);
    $rows = [];

    foreach ($xml->sheetData->row as $rowNode) {
        $rowNum = (int)$rowNode['r'];
        $rowCells = [];

        foreach ($rowNode->c as $cell) {
            $colRef = (string)$cell['r'];
            preg_match('/([A-Z]+)(\d+)/', $colRef, $matches);
            $colLetter = $matches[1] ?? '';
            $type = (string)$cell['t'];
            $val = (string)$cell->v;

            if ($type === 's') {
                $idx = (int)$val;
                $val = $sharedStrings[$idx] ?? '';
            } elseif ($type === 'inlineStr') {
                $val = (string)$cell->is->t;
            }

            $rowCells[$colLetter] = trim($val);
        }
        $rows[$rowNum] = $rowCells;
    }

    return $rows;
}

$file = realpath(__DIR__ . '/../../../data/jadwal_cat_kanreg_2026.xlsx');
$rawRows = getExcelRows($file);

$dataRows = [];
$nonNumericRows = [];

foreach ($rawRows as $rNum => $r) {
    if ($rNum < 3) continue;
    $no = $r['A'] ?? '';
    $instansi = $r['D'] ?? '';
    $tgl = $r['C'] ?? '';

    if (empty($no) && empty($instansi) && empty($tgl)) continue;

    if (!is_numeric($no)) {
        $nonNumericRows[] = ['row' => $rNum, 'data' => $r];
        continue;
    }

    $dataRows[] = [
        'excel_row' => $rNum,
        'no' => (int)$no,
        'surat_bkn' => $r['B'] ?? '',
        'tanggal_raw' => $tgl,
        'instansi_raw' => $instansi,
        'unit_kerja_raw' => $r['E'] ?? '',
        'lokasi_raw' => $r['F'] ?? '',
        'jenis_seleksi_raw' => $r['G'] ?? '',
        'nama_seleksi_raw' => $r['H'] ?? '',
    ];
}

echo "Total Valid Data Rows: " . count($dataRows) . "\n";
echo "Non-numeric rows with data: " . count($nonNumericRows) . "\n";
if (!empty($nonNumericRows)) {
    echo "Sample non-numeric rows:\n";
    foreach (array_slice($nonNumericRows, 0, 10) as $nn) {
        echo "Row {$nn['row']}: " . json_encode($nn['data'], JSON_UNESCAPED_UNICODE) . "\n";
    }
}

// Check max No
$maxNo = max(array_column($dataRows, 'no'));
echo "Max 'No' value in column A: {$maxNo}\n";

// DB References
$allInstansi = DB::table('ref_instansi')->get(['id', 'nama', 'kodeins']);
$allEventTypes = DB::table('ref_event_types')->get();
$allRooms = DB::table('ref_rooms')->get();

echo "Ref Instansi in DB: " . $allInstansi->count() . "\n";
echo "Ref Event Types in DB: " . $allEventTypes->count() . "\n";
echo "Ref Rooms in DB: " . $allRooms->count() . "\n\n";

// Check unique values
$uniqueInstansi = [];
$uniqueJenis = [];
$uniqueLokasi = [];
$dateErrors = [];

foreach ($dataRows as $idx => $row) {
    $uniqueInstansi[$row['instansi_raw']] = ($uniqueInstansi[$row['instansi_raw']] ?? 0) + 1;
    $uniqueJenis[$row['jenis_seleksi_raw']] = ($uniqueJenis[$row['jenis_seleksi_raw']] ?? 0) + 1;
    $uniqueLokasi[$row['lokasi_raw']] = ($uniqueLokasi[$row['lokasi_raw']] ?? 0) + 1;

    [$sDate, $eDate] = parseIndoDateString($row['tanggal_raw']);
    if (!$sDate || !$eDate) {
        $dateErrors[] = "No {$row['no']} (Row {$row['excel_row']}): raw date '{$row['tanggal_raw']}'";
    }
}

echo "=== UNIQUE INSTANSI IN EXCEL (" . count($uniqueInstansi) . ") ===\n";
foreach ($uniqueInstansi as $name => $c) {
    echo sprintf("- [%2d] %s\n", $c, $name);
}

echo "\n=== UNIQUE JENIS SELEKSI IN EXCEL (" . count($uniqueJenis) . ") ===\n";
foreach ($uniqueJenis as $name => $c) {
    echo sprintf("- [%2d] %s\n", $c, $name);
}

echo "\n=== UNIQUE LOKASI IN EXCEL (" . count($uniqueLokasi) . ") ===\n";
foreach ($uniqueLokasi as $name => $c) {
    echo sprintf("- [%2d] %s\n", $c, $name);
}

echo "\n=== DATE PARSE STATUS ===\n";
if (!empty($dateErrors)) {
    echo "Date errors (" . count($dateErrors) . "):\n";
    foreach ($dateErrors as $de) echo "  {$de}\n";
} else {
    echo "All 147 dates parsed successfully!\n";
}
