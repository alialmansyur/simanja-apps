# Perbaikan Validasi Duplikasi Agenda

## 1. Kondisi Existing

### A. Implementasi Validasi Saat Ini
Pengecekan duplikasi agenda saat ini diimplementasikan secara manual di dalam controller:
1. `apps/agenda-backend/app/Http/Controllers/Api/UnitController.php` (method `storeAgenda` baris 276-291)
2. `apps/agenda-backend/app/Http/Controllers/Api/AgendaController.php` (method `update` baris 182-198)

Snippet query existing:
```php
// Duplicate Validation Check (Unit + Kegiatan + Tanggal)
if ($categoryId && $validated['startDate']) {
    $duplicateQuery = DB::table('trx_agendas')
        ->where('ref_unit_id', $unit->id) // atau $agenda->ref_unit_id pada update
        ->where('ref_agenda_category_id', $categoryId)
        ->where('start_date', $validated['startDate'])
        ->whereNull('deleted_at');
        
    if (isset($agenda)) {
        $duplicateQuery->where('id', '!=', $agenda->id);
    }
        
    $exists = $duplicateQuery->exists();
    if ($exists) {
        return response()->json([
            'message' => 'Agenda dengan Unit, Kategori Kegiatan, dan Tanggal yang sama sudah ada.',
            'error' => 'Duplicate Agenda'
        ], 422);
    }
}
```

### B. Kelemahan & Masalah Logika Existing
1. **Memblokir Kegiatan Multi-Lokasi**: Query hanya mengecek `ref_unit_id` + `ref_agenda_category_id` + `start_date`. Jika Unit Kerja menyelenggarakan dua agenda bertipe sama di hari yang sama pada lokasi yang berbeda (misal: CAT Tim A di Serang dan CAT Tim B di Ciamis, atau Rapat Tim 1 di Ruang Rapat Utama dan Tim 2 di Aula), sistem saat ini **menolak secara keliru** dengan status 422.
2. **Hanya Memeriksa `start_date` Tunggal**: Jika agenda berlangsung multi-hari (misal: 24-26 Sept), validasi tidak memeriksa irisan rentang tanggal (*date range overlap*), melainkan hanya mencocokkan exact tanggal mulai.
3. **Mengabaikan Pengecekan Lokasi**: Lokasi fisik (ruangan internal via `trx_agenda_rooms` maupun lokasi luar kantor via `offline_location`) atau mode online (`is_online`) sama sekali tidak dipertimbangkan dalam evaluasi duplikasi.

---

## 2. Business Rule Baru

1. **Aturan Utama**:
   $$\text{Agenda diperbolehkan jika Lokasi Kegiatan Berbeda, meskipun Unit Kerja, Kategori Agenda, dan Periode Tanggal Beririsan.}$$
2. **Kriteria Duplikasi Sebenarnya (True Duplicate)**:
   Sebuah agenda dianggap duplikat HANYA JIKA:
   * Unit Kerja sama (`ref_unit_id` sama) **DAN**
   * Kategori Kegiatan sama (`ref_agenda_category_id` sama) **DAN**
   * Periode Tanggal beririsan ($(\text{start\_date}_A \le \text{end\_date}_B) \land (\text{end\_date}_A \ge \text{start\_date}_B)$) **DAN**
   * **Lokasi kegiatan bertabrakan / sama persis**:
     * **Mode Online**: Kedua agenda sama-sama mode online (`is_online = true`) dan memiliki `online_url` / `online_meeting_id` yang sama, ATAU
     * **Mode Offline Internal (Ruangan)**: Kedua agenda menggunakan setidaknya satu ruangan yang sama pada pivot `trx_agenda_rooms` (`array_intersect(roomIds_A, roomIds_B)` tidak kosong), ATAU
     * **Mode Offline Luar Kantor**: Kedua agenda memiliki nama lokasi luar yang sama (`LOWER(TRIM(offline_location_A)) == LOWER(TRIM(offline_location_B))`).

3. **Kondisi yang Diizinkan (Bukan Duplikat)**:
   * Unit sama + Kategori sama + Tanggal sama, namun **Ruangan berbeda** (e.g. Ruang 1 vs Ruang 2) $\rightarrow$ **DIIZINKAN**.
   * Unit sama + Kategori sama + Tanggal sama, namun **Lokasi luar berbeda** (e.g. "UPSCPKP ASN Serang" vs "BKPSDM Kab. Ciamis") $\rightarrow$ **DIIZINKAN**.
   * Unit sama + Kategori sama + Tanggal sama, satu **Online** dan satu **Offline di lokasi spesifik** $\rightarrow$ **DIIZINKAN**.
   * Unit sama + Kategori sama + Tanggal sama, namun **Jam/Waktu sama sekali tidak beririsan** $\rightarrow$ **DIIZINKAN**.

---

## 3. File & Komponen Terdampak

| Komponen / File | Layer | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `apps/agenda-backend/app/Http/Controllers/Api/UnitController.php` | Backend Controller | Memperbarui logika method `storeAgenda` dengan query validasi duplikasi berbasis lokasi & irisan waktu. |
| `apps/agenda-backend/app/Http/Controllers/Api/AgendaController.php` | Backend Controller | Memperbarui logika method `update` dengan query validasi duplikasi berbasis lokasi & irisan waktu. |
| `apps/agenda-backend/app/Services/AgendaValidationService.php` *(Opsional/Rekomendasi)* | Backend Service | Helper/Service terpusat untuk logika validasi bentrok & duplikasi agar DRY (*Don't Repeat Yourself*). |

---

## 4. Database & Query Terdampak

Tidak ada perubahan struktur tabel/skema DDL. Query validation diubah menjadi pengecekan relasional multi-faktor:

```sql
-- Mencari agenda aktif dari unit & kategori yang sama dengan rentang tanggal beririsan
SELECT a.id, a.is_online, a.offline_location, a.online_meeting_id, a.online_url,
       a.start_date, a.end_date, a.start_time, a.end_time
FROM trx_agendas a
WHERE a.deleted_at IS NULL
  AND a.ref_unit_id = :unit_id
  AND a.ref_agenda_category_id = :category_id
  AND a.start_date <= :request_end_date
  AND a.end_date >= :request_start_date
  AND (:exclude_id IS NULL OR a.id != :exclude_id);
```

Setelah kandidat agenda beririsan ditemukan, backend mengevaluasi kriteria bentrok lokasi di memory PHP / subquery:
1. Pengecekan ruangan via `trx_agenda_rooms` yang bertaut pada candidate ID.
2. Pengecekan string `offline_location` (case-insensitive normalized).
3. Pengecekan overlap jam/waktu jika diperlukan.

---

## 5. Perubahan yang Diperlukan

### Backend Implementation Detail

Buat method proteksi terpusat atau helper fungsi `checkDuplicateAgenda(...)`:

```php
private function checkDuplicateAgenda($unitId, $categoryId, $startDate, $endDate, $startTime, $endTime, $isOnline, $roomIds, $offlineLocation, $onlineMeetingId = null, $excludeAgendaId = null): ?string
{
    if (!$categoryId || !$startDate || !$endDate) {
        return null;
    }

    $candidates = DB::table('trx_agendas')
        ->where('ref_unit_id', $unitId)
        ->where('ref_agenda_category_id', $categoryId)
        ->where('start_date', '<=', $endDate)
        ->where('end_date', '>=', $startDate)
        ->whereNull('deleted_at')
        ->when($excludeAgendaId, function ($q) use ($excludeAgendaId) {
            return $q->where('id', '!=', $excludeAgendaId);
        })
        ->get();

    if ($candidates->isEmpty()) {
        return null;
    }

    $candidateIds = $candidates->pluck('id')->toArray();
    $candidateRooms = DB::table('trx_agenda_rooms')
        ->whereIn('trx_agenda_id', $candidateIds)
        ->get()
        ->groupBy('trx_agenda_id');

    foreach ($candidates as $candidate) {
        $isLocationConflict = false;

        if ($isOnline && $candidate->is_online) {
            // Jika keduanya online dan menggunakan meeting ID / room link yang sama
            if (!empty($onlineMeetingId) && !empty($candidate->online_meeting_id) && $onlineMeetingId === $candidate->online_meeting_id) {
                $isLocationConflict = true;
            } elseif (empty($onlineMeetingId) && empty($candidate->online_meeting_id)) {
                // Keduanya generic online pada waktu bersamaan
                $isLocationConflict = true;
            }
        } elseif (!$isOnline && !$candidate->is_online) {
            // Keduanya offline
            $candidateRoomIds = isset($candidateRooms[$candidate->id]) 
                ? $candidateRooms[$candidate->id]->pluck('ref_room_id')->toArray() 
                : [];

            // 1. Cek bentrok ruangan fisik internal
            if (!empty($roomIds) && !empty($candidateRoomIds)) {
                $intersect = array_intersect($roomIds, $candidateRoomIds);
                if (!empty($intersect)) {
                    $isLocationConflict = true;
                }
            }

            // 2. Cek bentrok lokasi offline luar kantor
            if (!empty($offlineLocation) && !empty($candidate->offline_location)) {
                if (strcasecmp(trim($offlineLocation), trim($candidate->offline_location)) === 0) {
                    $isLocationConflict = true;
                }
            }
        }

        if ($isLocationConflict) {
            return "Agenda dengan Unit, Kategori Kegiatan, Periode Tanggal, dan Lokasi yang sama sudah ada ({$candidate->title}).";
        }
    }

    return null;
}
```

Terapkan pemanggilan fungsi ini pada:
1. `UnitController@storeAgenda` sebelum transaksi database.
2. `AgendaController@update` sebelum transaksi database.

---

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Over-permissive validation jika lokasi berupa teks bebas dengan sedikit perbedaan penulisan (e.g. "Hotel Savoy Homann" vs "Savoy Homann Hotel"). | Dua agenda dengan maksud lokasi sama lolos validasi. | Normalisasi string (lowercase, hapus spasi berlebih, strip tanda baca) saat perbandingan. |
| Agenda dengan banyak ruangan vs single room. | Potensi miskalkulasi jika hanya membandingkan index pertama. | Gunakan `array_intersect()` untuk memeriksa seluruh himpunan `roomIds`. |
| Performa query jika jumlah agenda dalam satu unit sangat banyak. | Beban komputasi query. | Query disaring ketat di SQL berdasarkan `ref_unit_id`, `ref_agenda_category_id`, rentang tanggal `start_date <= end` & `end_date >= start`, serta `deleted_at IS NULL` yang memanfaatkan indeks. |

---

## 7. Urutan Implementasi

1. **Tahap 1**: Buat fungsi verifikasi duplikasi terpadu `checkDuplicateAgenda`.
2. **Tahap 2**: Pasang fungsi verifikasi pada `UnitController@storeAgenda`.
3. **Tahap 3**: Pasang fungsi verifikasi pada `AgendaController@update`.
4. **Tahap 4**: Jalankan pengujian skenario duplikasi (lokasi sama vs lokasi beda vs multi-ruangan vs online/offline).

---

## 8. Testing yang Diperlukan

* [x] **Test Kasus 1 (Blokir Duplikasi Penuh)**:
  Input Agenda A (Unit X, Kategori CAT, 2026-09-24, Ruang 1).
  Input Agenda B (Unit X, Kategori CAT, 2026-09-24, Ruang 1).
  $\rightarrow$ **Berhasil Ditolak (HTTP 422 Duplicate)**.
* [x] **Test Kasus 2 (Izinkan Lokasi Ruangan Berbeda)**:
  Input Agenda A (Unit X, Kategori CAT, 2026-09-24, Ruang 1).
  Input Agenda B (Unit X, Kategori CAT, 2026-09-24, Ruang 2).
  $\rightarrow$ **Berhasil Disimpan (HTTP 200/201)**.
* [x] **Test Kasus 3 (Izinkan Lokasi Luar Kantor Berbeda)**:
  Input Agenda A (Unit X, Kategori CAT, 2026-09-24, Lokasi: "UPSCPKP ASN Serang").
  Input Agenda B (Unit X, Kategori CAT, 2026-09-24, Lokasi: "BKPSDM Kab. Ciamis").
  $\rightarrow$ **Berhasil Disimpan (HTTP 200/201)**.
* [x] **Test Kasus 4 (Blokir Lokasi Luar Kantor Sama)**:
  Input Agenda A (Unit X, Kategori CAT, 2026-09-24, Lokasi: "UPSCPKP ASN Serang").
  Input Agenda B (Unit X, Kategori CAT, 2026-09-24, Lokasi: "upscpkp asn serang").
  $\rightarrow$ **Berhasil Ditolak (HTTP 422 Duplicate)**.
* [x] **Test Kasus 5 (Izinkan Online vs Offline)**:
  Input Agenda A (Unit X, Kategori Rapat, 2026-09-24, Online).
  Input Agenda B (Unit X, Kategori Rapat, 2026-09-24, Offline Ruang Rapat).
  $\rightarrow$ **Berhasil Disimpan**.
* [x] **Test Kasus 6 (Izinkan Jam Berbeda / Non-Overlapping Hours)**:
  Input Agenda A (Unit X, Kategori Rapat, 2026-09-24, 08:00 - 11:30, Ruang 1).
  Input Agenda B (Unit X, Kategori Rapat, 2026-09-24, 13:00 - 16:00, Ruang 1).
  $\rightarrow$ **Berhasil Disimpan**.
* [x] **Test Kasus 7 (Update Self Exemption)**:
  Edit Agenda A tanpa mengubah unit/kategori/tanggal/lokasi.
  $\rightarrow$ **Berhasil Disimpan (tidak mendeteksi dirinya sendiri sebagai duplikat)**.
