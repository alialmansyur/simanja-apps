<?php

require __DIR__ . '/../vendor/autoload.php';

function inspectExcelStructure($filePath) {
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
$rows = inspectExcelStructure($file);

echo "Total raw rows in XML: " . count($rows) . "\n";
echo "Row 1: " . json_encode($rows[1] ?? []) . "\n";
echo "Row 2 (Header): " . json_encode($rows[2] ?? []) . "\n";

$numberedRows = [];
$unNumberedRows = [];

foreach ($rows as $rNum => $r) {
    if ($rNum < 3) continue;
    $no = $r['A'] ?? '';
    $hasContent = !empty($r['C']) || !empty($r['D']) || !empty($r['G']) || !empty($r['H']);
    if (!$hasContent && empty($no)) continue;

    if (!empty($no)) {
        $numberedRows[$rNum] = ['no' => $no, 'row' => $rNum, 'data' => $r];
    } else {
        $unNumberedRows[$rNum] = ['row' => $rNum, 'data' => $r];
    }
}

echo "Numbered rows (Column A has value): " . count($numberedRows) . "\n";
echo "Unnumbered rows with content: " . count($unNumberedRows) . "\n";

echo "\n--- Numbered rows from 135 to end ---\n";
foreach ($numberedRows as $rNum => $info) {
    if ($rNum >= 135) {
        echo sprintf("Excel Row %3d -> No di Kolom A: %-4s | Tgl: %-15s | Instansi: %s\n", 
            $rNum, $info['no'], $info['data']['C'] ?? '', $info['data']['D'] ?? '');
    }
}

echo "\n--- Unnumbered rows (Baris 150 - 181) ---\n";
foreach ($unNumberedRows as $rNum => $info) {
    echo sprintf("Excel Row %3d -> Kolom A: [KOSONG] | Tgl: %-15s | Instansi: %s\n", 
        $rNum, $info['data']['C'] ?? '', $info['data']['D'] ?? '');
}
