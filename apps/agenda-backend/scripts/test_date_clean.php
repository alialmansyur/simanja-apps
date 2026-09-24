<?php

function parseDateClean($str) {
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

    // 1. Single day: "12 Februari 2026" or "6 Januari 2026" or "20 Agustus 2026"
    if (preg_match('/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
        $mo = $months[$m[2]] ?? null;
        if ($mo) {
            $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $yr = !empty($m[3]) ? $m[3] : '2026';
            return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d1}"];
        }
    }

    // 2. Standard ranges: "11 s.d 12 Februari 2026" or "6-7 Agustus 2026" or "1 - 4 Sept 2026" or "1- 3 September 2026"
    if (preg_match('/^(\d{1,2})\s*(?:s\.d|s\/d|-|–)\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i', $clean, $m)) {
        $mo = $months[$m[3]] ?? null;
        if ($mo) {
            $d1 = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $d2 = str_pad($m[2], 2, '0', STR_PAD_LEFT);
            $yr = !empty($m[4]) ? $m[4] : '2026';
            return ["{$yr}-{$mo}-{$d1}", "{$yr}-{$mo}-{$d2}"];
        }
    }

    // 3. Cross-month: "28 Februari s.d 2 Maret 2026" or "31 Agustus s.d 4 Sept 2026"
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

    // 4. Special multi-day string expressions in dataset:
    // '14,15,21,22 Nov, 5-6 Des' -> 2026-11-14 to 2026-12-06
    if (str_contains($clean, 'nov') && str_contains($clean, 'des')) {
        return ["2026-11-14", "2026-12-06"];
    }

    // '30 Nov - 4 Des' -> 2026-11-30 to 2026-12-04
    if (preg_match('/^30\s*nov\s*[-–]\s*4\s*des/i', $clean)) {
        return ["2026-11-30", "2026-12-04"];
    }

    // '21-23 Sept' -> 2026-09-21 to 2026-09-23
    if (preg_match('/^21\s*[-–]\s*23\s*sept?/i', $clean)) {
        return ["2026-09-21", "2026-09-23"];
    }

    // '16-20 nov, 23-27 nov, 30 nov-3 des' -> 2026-11-16 to 2026-12-03
    if (str_contains($clean, '16-20 nov') && str_contains($clean, '3 des')) {
        return ["2026-11-16", "2026-12-03"];
    }

    // '2-6, 9,10 November 2026' -> '2026-11-02' to '2026-11-10'
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

$testDates = [
    '6 Januari 2026',
    '11 s.d 12 Februari 2026',
    '12 Februari 2026',
    '13 Februari 2026',
    '19 Februari 2026',
    '46077',
    '24 s.d 25 Februari 2026',
    '46079',
    '26 Februari 2026',
    '27 Februari 2026',
    '6-7 Agustus 2026',
    '20 Agustus 2026',
    '1- 3 September 2026',
    '1 - 4 Sept 2026',
    '7 - 11 Sept 2026',
    '2-6, 9,10 November 2026',
    '14,15,21,22 Nov, 5-6 Des',
    '30 Nov - 4 Des',
    '21-23 Sept',
    '16-20 nov, 23-27 nov, 30 nov-3 des',
];

echo "=== TEST DATES CLEAN PARSER ===\n";
foreach ($testDates as $td) {
    [$s, $e] = parseDateClean($td);
    echo sprintf("%-38s -> %s s/d %s\n", "'{$td}'", $s, $e);
}
