<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

class CatScheduleMapper
{
    private $instansiTable;
    private $eventTypesTable;
    private $roomsTable;
    private $categoriesTable;
    private $unitsTable;
    private $statusesTable;

    public $aliasMap = [
        'atr/bpn' => 'Kementerian Agraria dan Tata Ruang/Badan Pertanahan Nasional',
        'bkkbn' => 'Badan Kependudukan dan Keluarga Berencana Nasional',
        'bp2mi' => 'Badan Pelindungan Pekerja Migran Indonesia',
        'badan pengatur bumn' => 'BUMN',
        'barantin' => 'Badan Karantina Indonesia',
        'basarnas' => 'Badan Nasional Pencarian dan Pertolongan',
        'kejaksaan ri' => 'Kejaksaan Agung RI',
        'kepolisian ri' => 'Kepolisian Negara Republik Indonesia',
        'lan' => 'Lembaga Administrasi Negara',
        'lpp rri' => 'Radio Republik Indonesia',
        'tvri' => 'Televisi Republik Indonesia',
        'kementerian imipas' => 'Kementerian Imigrasi dan Pemasyarakatan',
        'kementerian imigrasi dan pemasyarakatan' => 'Kementerian Imigrasi dan Pemasyarakatan',
        'kementerian ham' => 'Kementerian Hak Asasi Manusia',
        'kementerian kebudayaan' => 'Kementerian Kebudayaan',
        'kementerian kehutanan' => 'Kementerian Kehutanan',
        'kementerian pariwisata' => 'Kementerian Pariwisata',
        'kementerian pekerjaan umum' => 'Kementerian Pekerjaan Umum',
        'kementerian pendidikan tinggi, sains dan teknologi' => 'Kementerian Pendidikan Tingggi, Sains, dan Teknologi',
        'kementerian pendidikan tinggi sains dan teknologi' => 'Kementerian Pendidikan Tingggi, Sains, dan Teknologi',
        'badan gizi nasional' => 'Badan Gizi Nasional',
        'kementerian haji dan umrah ri' => 'Kementerian Haji dan Umroh',
        'kementerian haji dan umrah' => 'Kementerian Haji dan Umroh',
        'badan kepegawaian negara' => 'Badan Kepegawaian Negara',
        'badan pemeriksa keuangan' => 'Badan Pemeriksa Keuangan',
        'komisi pemilihan umum' => 'Komisi Pemilihan Umum',
        'kementerian agama' => 'Kementerian Agama',
        'kementerian esdm' => 'Kementerian Energi dan Sumber Daya Mineral',
        'kementerian perhubungan' => 'Kementerian Perhubungan',
        'kementerian perindustrian' => 'Kementerian Perindustrian',
        'kementerian pertahanan' => 'Kementerian Pertahanan',
        'kementerian sosial' => 'Kementerian Sosial',

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

    public function __construct()
    {
        $this->instansiTable = DB::table('ref_instansi')->get();
        $this->eventTypesTable = DB::table('ref_event_types')->get();
        $this->roomsTable = DB::table('ref_rooms')->get();
        $this->categoriesTable = DB::table('ref_agenda_categories')->get();
        $this->unitsTable = DB::table('ref_units')->get();
        $this->statusesTable = DB::table('ref_statuses')->get();
    }

    public function readExcel($filePath)
    {
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

    public function parseDateString($str)
    {
        $str = trim($str);
        if (empty($str)) return [null, null];

        if (is_numeric($str)) {
            $unixTimestamp = ((float)$str - 25569) * 86400;
            $d = gmdate('Y-m-d', $unixTimestamp);
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
            'september' => '09', 'sep' => '09', 'sept' => '09',
            'oktober' => '10', 'okt' => '10',
            'november' => '11', 'nov' => '11',
            'desember' => '12', 'des' => '12', 'des' => '12',
        ];

        $clean = strtolower($str);
        $clean = preg_replace('/\s+/', ' ', $clean);

        // 1. Single day
        if (preg_match('/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
            $mo = $months[$m[2]] ?? null;
            if ($mo) {
                $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                $yr = !empty($m[3]) ? $m[3] : '2026';
                return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d1}"];
            }
        }

        // 2. Standard ranges
        if (preg_match('/^(\d{1,2})\s*(?:s\.d|s\/d|-|–)\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
            $mo = $months[$m[3]] ?? null;
            if ($mo) {
                $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                $d2 = str_pad($m[2], 2, '0', STR_PAD_LEFT);
                $yr = !empty($m[4]) ? $m[4] : '2026';
                return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d2}"];
            }
        }

        // 3. Cross-month
        if (preg_match('/^(\d{1,2})\s+([a-z]+)\s*(?:s\.d|s\/d|-|–)\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
            $mo1 = $months[$m[2]] ?? null;
            $mo2 = $months[$m[4]] ?? null;
            if ($mo1 && $mo2) {
                $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                $d2 = str_pad($m[3], 2, '0', STR_PAD_LEFT);
                $yr = !empty($m[5]) ? $m[5] : '2026';
                return ["{$yr}-{$mo1}-{$d1}", "{$yr}-{$mo2}-{$d2}"];
            }
        }

        // 4. Special multi-day string expressions:
        if (str_contains($clean, '16-20 nov') && str_contains($clean, '3 des')) {
            return ["2026-11-16", "2026-12-03"];
        }

        if (str_contains($clean, 'nov') && str_contains($clean, 'des')) {
            return ["2026-11-14", "2026-12-06"];
        }

        if (preg_match('/^30\s*nov\s*[-–]\s*4\s*des/i', $clean)) {
            return ["2026-11-30", "2026-12-04"];
        }

        if (preg_match('/^21\s*[-–]\s*23\s*sept?/i', $clean)) {
            return ["2026-09-21", "2026-09-23"];
        }

        if (preg_match('/^(\d{1,2})[\s\-,0-9]+\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
            $mo = $months[$m[2]] ?? '11';
            $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $yr = !empty($m[3]) ? $m[3] : '2026';
            preg_match_all('/\d+/', $str, $dayMatches);
            $allDays = array_map('intval', $dayMatches[0]);
            $daysOnly = array_filter($allDays, fn($d) => $d <= 31);
            $maxDay = !empty($daysOnly) ? max($daysOnly) : (int)$d1;
            $d2 = str_pad($maxDay, 2, '0', STR_PAD_LEFT);
            return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d2}"];
        }

        return [null, null];
    }

    private function normalize($str)
    {
        $str = strtolower(trim($str));
        $str = preg_replace('/[^\w\s]/', '', $str);
        return preg_replace('/\s+/', ' ', $str);
    }

    public function matchInstansi($rawName)
    {
        $cleanRaw = strtolower(trim($rawName));
        $targetName = $this->aliasMap[$cleanRaw] ?? $rawName;
        $normTarget = $this->normalize($targetName);

        // 1. Exact match on target or raw
        foreach ($this->instansiTable as $ins) {
            if (strtolower(trim($ins->nama)) === strtolower(trim($targetName)) || strtolower(trim($ins->nama)) === $cleanRaw) {
                return $ins;
            }
        }

        // 2. Normalized match
        foreach ($this->instansiTable as $ins) {
            if ($this->normalize($ins->nama) === $normTarget) {
                return $ins;
            }
        }

        // 3. Substring match
        foreach ($this->instansiTable as $ins) {
            $normIns = $this->normalize($ins->nama);
            if (str_contains($normIns, $normTarget) || str_contains($normTarget, $normIns)) {
                return $ins;
            }
        }

        return null;
    }

    public function matchEventType($jenisRaw, $namaRaw)
    {
        $j = strtolower(trim($jenisRaw));
        $n = strtolower(trim($namaRaw));

        if (str_contains($n, 'proasn') || str_contains($j, 'proasn')) {
            return 10; // PROASN
        }

        if (str_contains($n, 'cact') || str_contains($j, 'cact')) {
            return 9; // CACT
        }

        if (str_contains($j, 'pppk') || str_contains($n, 'pppk') || str_contains($n, 'p3k')) {
            return 3; // SELKOM P3K
        }

        if (str_contains($j, 'pengembangan karier') || str_contains($n, 'pengembangan karier')) {
            return 13; // BANGKIR - Seleksi Pengembangan Karier
        }

        if (str_contains($j, 'uji kompetensi') || str_contains($n, 'uji kompetensi')) {
            return 11; // UJIKOM - Uji Kompetensi
        }

        if (str_contains($j, 'selain pegawai asn') || str_contains($j, 'non asn') || str_contains($n, 'non asn')) {
            return 12; // SELKOM NON ASN
        }

        if (str_contains($j, 'penilaian potensi') || str_contains($j, 'kompetensi')) {
            return 10; // Default PROASN
        }

        return 13; // Fallback BANGKIR
    }

    public function buildCleanTitle($namaRaw, $jenisRaw, $instansiDisplay, $lokasiDisplay)
    {
        $n = trim($namaRaw);
        $j = trim($jenisRaw);

        $selectionName = '';
        if (!empty($n) && $n !== '-' && strtolower($n) !== 'remedial') {
            $lines = explode("\n", $n);
            $selectionName = trim($lines[0]);
        } elseif (strtolower($n) === 'remedial') {
            $selectionName = "Remedial " . ($j ?: "Uji Kompetensi");
        } else {
            $selectionName = $j ?: "Seleksi Pengembangan Karier";
        }

        $selectionName = preg_replace('/\s+/', ' ', $selectionName);

        if (str_contains(strtolower($selectionName), strtolower($instansiDisplay))) {
            $title = "Fasilitasi {$selectionName} di {$lokasiDisplay}";
        } else {
            $title = "Fasilitasi {$selectionName} {$instansiDisplay} di {$lokasiDisplay}";
        }

        $title = preg_replace('/\s+/', ' ', $title);
        return trim($title);
    }

    public function buildDescription($eventTypeId, $namaRaw, $instansiDisplay)
    {
        switch ($eventTypeId) {
            case 10: // PROASN
                return "Fasilitasi ProASN untuk mendukung pemetaan kompetensi dan potensi ASN pada {$instansiDisplay} sebagai dasar dalam mengetahui profil, kemampuan, serta potensi pengembangan pegawai.";
            case 9: // CACT
                return "Fasilitasi Computer Assisted Competency Test (CACT) untuk mendukung pemetaan kompetensi dan potensi ASN pada {$instansiDisplay} secara objektif dan terstandar BKN.";
            case 3: // PPPK
                return "Fasilitasi Seleksi Kompetensi Pegawai Pemerintah dengan Perjanjian Kerja (PPPK) pada {$instansiDisplay} menggunakan sistem Computer Assisted Test (CAT) BKN yang transparan dan akuntabel.";
            case 12: // NON ASN
                return "Fasilitasi Seleksi Kompetensi Non ASN pada {$instansiDisplay} menggunakan sistem Computer Assisted Test (CAT) BKN untuk menjamin proses seleksi yang objektif dan transparan.";
            case 13: // BANGKIR
                return "Fasilitasi Seleksi Pengembangan Karier ASN pada {$instansiDisplay} menggunakan sistem Computer Assisted Test (CAT) BKN untuk mendukung manajemen talenta dan meritokrasi.";
            case 11: // UJIKOM
            default:
                return "Fasilitasi Uji Kompetensi ASN pada {$instansiDisplay} menggunakan sistem Computer Assisted Test (CAT) BKN untuk mendukung penataan jabatan fungsional dan kompetensi ASN.";
        }
    }
}

$mapper = new CatScheduleMapper();
$file = realpath(__DIR__ . '/../../../data/jadwal_cat_kanreg_2026.xlsx');
$rawRows = $mapper->readExcel($file);

$processed = [];
$missingInstansi = [];
$seen = [];

foreach ($rawRows as $rNum => $r) {
    if ($rNum < 3) continue;
    $no = $r['A'] ?? '';
    $surat = $r['B'] ?? '';
    $tgl = $r['C'] ?? '';
    $instansiRaw = $r['D'] ?? '';
    $unitKerjaRaw = $r['E'] ?? '';
    $lokasiRaw = $r['F'] ?? '';
    $jenisRaw = $r['G'] ?? '';
    $namaRaw = $r['H'] ?? '';

    if (empty($no) && empty($tgl) && empty($instansiRaw) && empty($jenisRaw) && empty($namaRaw)) {
        continue;
    }

    [$sDate, $eDate] = $mapper->parseDateString($tgl);
    $insObj = $mapper->matchInstansi($instansiRaw);

    $instansiId = $insObj ? $insObj->id : null;
    $instansiName = $insObj ? $insObj->nama : $instansiRaw;

    if (!$insObj) {
        $missingInstansi[$instansiRaw] = ($missingInstansi[$instansiRaw] ?? 0) + 1;
    }

    $eventTypeId = $mapper->matchEventType($jenisRaw, $namaRaw);
    $lokasiClean = !empty($lokasiRaw) ? $lokasiRaw : (!empty($unitKerjaRaw) ? $unitKerjaRaw : 'Kanreg III BKN');
    $title = $mapper->buildCleanTitle($namaRaw, $jenisRaw, $instansiName, $lokasiClean);
    $description = $mapper->buildDescription($eventTypeId, $namaRaw, $instansiName);

    $dupKey = md5("{$sDate}|{$eDate}|{$instansiName}|{$lokasiClean}|{$eventTypeId}|{$namaRaw}");
    $isDup = false;
    $dupOf = null;
    if (isset($seen[$dupKey])) {
        $isDup = true;
        $dupOf = $seen[$dupKey];
    } else {
        $seen[$dupKey] = count($processed) + 1;
    }

    $processed[] = [
        'index' => count($processed) + 1,
        'excel_row' => $rNum,
        'col_no' => $no,
        'surat_bkn' => $surat,
        'raw_date' => $tgl,
        'start_date' => $sDate,
        'end_date' => $eDate,
        'raw_instansi' => $instansiRaw,
        'ref_instansi_id' => $instansiId,
        'instansi_name' => $instansiName,
        'unit_kerja' => $unitKerjaRaw,
        'raw_lokasi' => $lokasiRaw,
        'lokasi_display' => $lokasiClean,
        'raw_jenis' => $jenisRaw,
        'raw_nama' => $namaRaw,
        'ref_event_type_id' => $eventTypeId,
        'title' => $title,
        'description' => $description,
        'is_duplicate' => $isDup,
        'duplicate_of_index' => $dupOf,
    ];
}

echo "=== MAPPING SUMMARY ===\n";
echo "Total Rows Parsed   : " . count($processed) . "\n";
echo "Missing Instansi    : " . count($missingInstansi) . "\n";
echo "Duplicate Records   : " . count(array_filter($processed, fn($p) => $p['is_duplicate'])) . "\n";

$jsonOut = __DIR__ . '/mapped_cat_2026.json';
file_put_contents($jsonOut, json_encode($processed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "Full mapping JSON updated: {$jsonOut}\n";
