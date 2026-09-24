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
    if (empty($str)) return [null, null, 'empty'];

    if (is_numeric($str)) {
        $d = excelDateToDate((float)$str);
        return [$d, $d, 'excel_serial'];
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
        'september' => '09', 'sep' => '09', 'sept' => '09',
        'oktober' => '10', 'okt' => '10',
        'november' => '11', 'nov' => '11',
        'desember' => '12', 'des' => '12',
    ];

    $clean = strtolower($str);
    $clean = preg_replace('/\s+/', ' ', $clean);

    // Case 1: "11 s.d 12 Februari 2026" or "6-7 Agustus 2026" or "1 - 4 Sept 2026" or "1- 3 September 2026"
    if (preg_match('/^(\d{1,2})\s*(?:s\.d|s\/d|-)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $d2 = str_pad($m[2], 2, '0', STR_PAD_LEFT);
        $moName = $m[3];
        $mo = $months[$moName] ?? null;
        $yr = $m[4];
        if ($mo) {
            return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d2}", 'range_same_month'];
        }
    }

    // Case 2: "28 Februari s.d 2 Maret 2026" (cross-month)
    if (preg_match('/^(\d{1,2})\s+([a-z]+)\s*(?:s\.d|s\/d|-)\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $mo1 = $months[$m[2]] ?? null;
        $d2 = str_pad($m[3], 2, '0', STR_PAD_LEFT);
        $mo2 = $months[$m[4]] ?? null;
        $yr = $m[5];
        if ($mo1 && $mo2) {
            return ["{$yr}-{$mo1}-{$d1}", "{$yr}-{$mo2}-{$d2}", 'range_cross_month'];
        }
    }

    // Case 3: "6 Januari 2026" or "20 Agustus 2026"
    if (preg_match('/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i', $clean, $m)) {
        $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $mo = $months[$m[2]] ?? null;
        $yr = $m[3];
        if ($mo) {
            return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d1}", 'single_day'];
        }
    }

    // Case 4: YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $clean)) {
        return [$clean, $clean, 'iso'];
    }

    return [null, null, "unparsed: {$str}"];
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

$allDataRows = [];
$seqNo = 1;

foreach ($rawRows as $rNum => $r) {
    if ($rNum < 3) continue;
    $no = $r['A'] ?? '';
    $surat = $r['B'] ?? '';
    $tgl = $r['C'] ?? '';
    $instansi = $r['D'] ?? '';
    $unitKerja = $r['E'] ?? '';
    $lokasi = $r['F'] ?? '';
    $jenis = $r['G'] ?? '';
    $nama = $r['H'] ?? '';

    // If completely blank row
    if (empty($no) && empty($tgl) && empty($instansi) && empty($jenis) && empty($nama)) {
        continue;
    }

    [$sDate, $eDate, $dType] = parseIndoDateString($tgl);

    $allDataRows[] = [
        'index' => count($allDataRows) + 1,
        'excel_row' => $rNum,
        'col_no' => $no,
        'surat_bkn' => $surat,
        'tanggal_raw' => $tgl,
        'start_date' => $sDate,
        'end_date' => $eDate,
        'date_type' => $dType,
        'instansi_raw' => $instansi,
        'unit_kerja_raw' => $unitKerja,
        'lokasi_raw' => $lokasi,
        'jenis_seleksi_raw' => $jenis,
        'nama_seleksi_raw' => $nama,
    ];
}

echo "TOTAL EXTRACTED DATA ROWS: " . count($allDataRows) . "\n\n";

// Check date errors
$unparsedDates = array_filter($allDataRows, fn($r) => !$r['start_date']);
if (!empty($unparsedDates)) {
    echo "Date parse failures:\n";
    foreach ($unparsedDates as $ud) {
        echo "- Row {$ud['excel_row']} (Index {$ud['index']}): '{$ud['tanggal_raw']}'\n";
    }
} else {
    echo "SUCCESS: All " . count($allDataRows) . " dates parsed cleanly to YYYY-MM-DD!\n\n";
}

// Inspect unique raw instansi across all 179 rows
$uniqueInstansiAll = [];
foreach ($allDataRows as $r) {
    $uniqueInstansiAll[$r['instansi_raw']] = ($uniqueInstansiAll[$r['instansi_raw']] ?? 0) + 1;
}

ksort($uniqueInstansiAll);
echo "=== ALL UNIQUE INSTANSI (" . count($uniqueInstansiAll) . ") ===\n";
foreach ($uniqueInstansiAll as $name => $c) {
    echo sprintf("%-50s : %2d rows\n", $name, $c);
}

// Inspect duplicate rows (same instansi, dates, location, nama_seleksi)
$seen = [];
$duplicates = [];
foreach ($allDataRows as $r) {
    $key = md5("{$r['start_date']}|{$r['end_date']}|{$r['instansi_raw']}|{$r['lokasi_raw']}|{$r['jenis_seleksi_raw']}|{$r['nama_seleksi_raw']}");
    if (isset($seen[$key])) {
        $duplicates[] = [
            'original_index' => $seen[$key]['index'],
            'original_excel' => $seen[$key]['excel_row'],
            'duplicate_index' => $r['index'],
            'duplicate_excel' => $r['excel_row'],
            'data' => $r
        ];
    } else {
        $seen[$key] = $r;
    }
}

echo "\n=== DUPLICATE ROWS FOUND: " . count($duplicates) . " ===\n";
foreach ($duplicates as $dup) {
    echo "Duplicate Index {$dup['duplicate_index']} (Row {$dup['duplicate_excel']}) is identical to Index {$dup['original_index']} (Row {$dup['original_excel']}):\n";
    echo "  Dates: {$dup['data']['start_date']} to {$dup['data']['end_date']} | Instansi: {$dup['data']['instansi_raw']} | Lokasi: {$dup['data']['lokasi_raw']} | Jenis: {$dup['data']['jenis_seleksi_raw']} | Nama: {$dup['data']['nama_seleksi_raw']}\n\n";
}
