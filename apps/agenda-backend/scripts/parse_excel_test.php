<?php

require __DIR__ . '/../vendor/autoload.php';

function readXlsx($filePath) {
    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) {
        throw new Exception("Cannot open {$filePath}");
    }

    // 1. Read shared strings
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

    // 2. Read sheet1
    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    if (!$sheetXml) {
        // Try finding any sheet in xl/worksheets/
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (strpos($name, 'xl/worksheets/sheet') === 0) {
                $sheetXml = $zip->getFromName($name);
                break;
            }
        }
    }
    $zip->close();

    if (!$sheetXml) {
        throw new Exception("No worksheet XML found in xlsx");
    }

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
echo "Reading file: {$file}\n";

$data = readXlsx($file);
echo "Total rows found: " . count($data) . "\n\n";

$header = null;
$firstFew = 0;
foreach ($data as $rNum => $rData) {
    if ($firstFew < 15) {
        echo "Row {$rNum}: " . json_encode($rData, JSON_UNESCAPED_UNICODE) . "\n";
        $firstFew++;
    }
}
