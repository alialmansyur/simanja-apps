<?php

require __DIR__ . '/../vendor/autoload.php';

function inspectXlsxDetails($filePath) {
    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) throw new Exception("Cannot open {$filePath}");

    echo "=== ARCHIVE FILES IN XLSX ===\n";
    $sheets = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (str_contains($name, 'sheet') || str_contains($name, 'workbook')) {
            echo "- " . $name . "\n";
        }
    }

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

    // Read workbook to get sheet names
    $wbXml = $zip->getFromName('xl/workbook.xml');
    if ($wbXml) {
        $wb = simplexml_load_string($wbXml);
        echo "\n=== WORKBOOK SHEETS ===\n";
        foreach ($wb->sheets->sheet as $s) {
            echo "Sheet Name: " . (string)$s['name'] . " | sheetId: " . (string)$s['sheetId'] . " | r:id: " . (string)$s->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships')['id'] . "\n";
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
$rows = inspectXlsxDetails($file);

echo "\n=== ROWS AROUND 140 - 185 ===\n";
foreach ($rows as $rNum => $r) {
    if ($rNum >= 135 && $rNum <= 185) {
        $no = $r['A'] ?? '';
        $surat = $r['B'] ?? '';
        $tgl = $r['C'] ?? '';
        $ins = $r['D'] ?? '';
        $lok = $r['F'] ?? '';
        $jenis = $r['G'] ?? '';
        $nama = $r['H'] ?? '';
        echo sprintf("Excel Row %3d | No: %-4s | Tgl: %-20s | Instansi: %-28s | Jenis: %-22s | Nama: %s\n", 
            $rNum, $no, substr($tgl, 0, 20), substr($ins, 0, 28), substr($jenis, 0, 22), substr($nama, 0, 30));
    }
}
