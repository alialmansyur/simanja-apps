# Hasil Mapping & Rencana Import Dataset Jadwal CAT 2026

> [!IMPORTANT]
> **STATUS TAHAP 6: DATA MAPPED & READY FOR REVIEW**
> - Seluruh 179 baris data dari `/data/jadwal_cat_kanreg_2026.xlsx` telah berhasil dipetakan secara menyeluruh.
> - Backup basis data agenda eksisting telah dibuat dan diamankan (JSON & SQL).
> - **Tidak ada operasi database wipe atau insert nyata yang dijalankan** sampai user mereview dan memberikan instruksi eksekusi.

---

## 1. Laporan Backup Data Agenda Lama

Sebelum dilakukan pengosongan tabel untuk data baru, seluruh data agenda lama telah di-backup secara penuh:
* **Waktu Backup**: 24 September 2026 12:09 WIB
* **File JSON**: `apps/agenda-backend/database/backups/backup_agendas_20260924_full.json` (102 KB)
* **File SQL**: `apps/agenda-backend/database/backups/backup_agendas_20260924_full.sql` (77 KB)
* **Tabel yang Ter-backup**:
  1. `trx_agendas` (37 baris)
  2. `trx_agenda_rooms` (15 baris)
  3. `trx_agenda_participants` (8 baris)
  4. `trx_notulas` (5 baris)
  5. `trx_notula_attachments` (0 baris)
  6. `trx_audit_logs` (99 baris)

---

## 2. Standardisasi Format Judul & Deskripsi Sesuai Request

### A. Format Judul Wajib:
$$\text{Fasilitasi } + \text{Nama Seleksi} + \text{ } + \text{Instansi} + \text{ di } + \text{Lokasi}$$
*Contoh*:
- `Fasilitasi Seleksi Pengadaan Calon PPPK Kementerian Hak Asasi Manusia Tahun 2025 di Kanreg III BKN`
- `Fasilitasi ProASN Pemerintah Kab. Subang di Kanreg III BKN`
- `Fasilitasi Uji Kompetensi Pemerintah Kab. Ciamis di BKPSDM Kab. Ciamis`

### B. Format Deskripsi General:
- **ProASN / Profiling**: `"Fasilitasi ProASN untuk mendukung pemetaan kompetensi dan potensi ASN pada [Instansi] sebagai dasar dalam mengetahui profil, kemampuan, serta potensi pengembangan pegawai."`
- **CACT**: `"Fasilitasi Computer Assisted Competency Test (CACT) untuk mendukung pemetaan kompetensi dan potensi ASN pada [Instansi] secara objektif dan terstandar BKN."`
- **PPPK**: `"Fasilitasi Seleksi Kompetensi Pegawai Pemerintah dengan Perjanjian Kerja (PPPK) pada [Instansi] menggunakan sistem Computer Assisted Test (CAT) BKN yang transparan dan akuntabel."`
- **Non ASN**: `"Fasilitasi Seleksi Kompetensi Non ASN pada [Instansi] menggunakan sistem Computer Assisted Test (CAT) BKN untuk menjamin proses seleksi yang objektif dan transparan."`
- **Uji Kompetensi / Karier**: `"Fasilitasi Uji Kompetensi dan Pengembangan Karier ASN pada [Instansi] menggunakan sistem Computer Assisted Test (CAT) BKN untuk mendukung manajemen talenta dan meritokrasi."`

---

## 3. Rekap Mapping Referensi Master

### A. Referensi Instansi (`ref_instansi`)
Seluruh 89 variasi teks instansi pada Excel berhasil dipetakan 100% ke tabel `ref_instansi`:
* `Badan Gizi Nasional` $\rightarrow$ ID 678
* `Kementerian HAM` $\rightarrow$ ID 679
* `Kementerian Pendidikan TInggi, Sains dan Teknologi` $\rightarrow$ ID 680
* `Kepolisian RI` $\rightarrow$ ID 681
* `Kementerian Haji dan Umrah RI` $\rightarrow$ ID 682
* `Kementerian Kehutanan` $\rightarrow$ ID 683
* `Barantin` $\rightarrow$ ID 684
* `Kementerian Kebudayaan` $\rightarrow$ ID 685
* `Kementerian Imigrasi dan Pemasyarakatan (Imipas)` $\rightarrow$ ID 686
* Seluruh Pemerintah Kabupaten / Kota se-Wilayah Kerja Kanreg III BKN (Jawa Barat & Banten) telah terpetakan akurat.

### B. Referensi Jenis Seleksi (`ref_event_types`)
* `Penilaian Potensi dan Kompetensi (ProASN)` $\rightarrow$ ID 10 (`PROASN`)
* `Penilaian Potensi dan Kompetensi (CACT)` $\rightarrow$ ID 9 (`CACT`)
* `Seleksi PPPK` $\rightarrow$ ID 3 (`SELKOM P3K`)
* `Seleksi Selain Pegawai ASN` $\rightarrow$ ID 12 (`SELKOM NON ASN`)
* `Seleksi Pengembangan Karier / Uji Kompetensi` $\rightarrow$ ID 11 (`UJIKOM`)

---

## 4. Temuan Duplikasi Data (Duplicate Rows Review)

Dari total 179 baris data, terdeteksi **9 data double / duplikasi** pada file Excel (data pada baris bawah mengulang data yang sudah ada di baris atas dengan instansi, tanggal, dan lokasi yang sama):

| No | Baris Excel Duplikat | Baris Excel Original | Instansi | Tanggal | Lokasi | Judul |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | Row 150 (Index 148) | Row 89 (Index 87) | Pemerintah Kab. Subang | 2026-08-06 s/d 2026-08-07 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kab. Subang di Kanreg III BKN |
| 2 | Row 152 (Index 150) | Row 89 (Index 87) | Pemerintah Kab. Subang | 2026-08-06 s/d 2026-08-07 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kab. Subang di Kanreg III BKN |
| 3 | Row 153 (Index 151) | Row 105 (Index 103)| Pemerintah Kota Cimahi | 2026-08-20 s/d 2026-08-20 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kota Cimahi di Kanreg III BKN |
| 4 | Row 154 (Index 152) | Row 117 (Index 115)| Pemerintah Kab. Pangandaran | 2026-09-01 s/d 2026-09-03 | SMPN 1 Parigi | Fasilitasi ProASN Pemerintah Kab. Pangandaran di SMPN 1 Parigi |
| 5 | Row 155 (Index 153) | Row 119 (Index 117)| Pemerintah Kota Bandung | 2026-09-02 s/d 2026-09-03 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kota Bandung di Kanreg III BKN |
| 6 | Row 158 (Index 156) | Row 124 (Index 122)| Pemerintah Kota Tasikmalaya | 2026-09-07 s/d 2026-09-11 | BKPSDM Kota Tasikmalaya | Fasilitasi ProASN Pemerintah Kota Tasikmalaya di BKPSDM Kota Tasikmalaya |
| 7 | Row 159 (Index 157) | Row 137 (Index 135)| Pemerintah Kab. Cianjur | 2026-09-11 s/d 2026-09-11 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kab. Cianjur di Kanreg III BKN |
| 8 | Row 168 (Index 166) | Row 166 (Index 164)| Pemerintah Kab. Serang | 2026-11-02 s/d 2026-11-10 | UPSCPKP BKN Serang | Fasilitasi ProASN Pemerintah Kab. Serang di UPSCPKP BKN Serang |
| 9 | Row 170 (Index 168) | Row 134 (Index 132)| Pemerintah Kota Banjar | 2026-09-10 s/d 2026-09-10 | Kanreg III BKN | Fasilitasi ProASN Pemerintah Kota Banjar di Kanreg III BKN |

> **Rekomendasi Penanganan Duplikat**:
> Saat inject dilakukan, 9 baris duplikat ini di-skip (tidak di-insert ganda) sehingga total data bersih yang masuk ke database adalah **170 record unik**.

---

## 5. Cuplikan Tabel Pemetaan 179 Baris Data

| Idx | No Excel | Surat BKN | Tanggal | Instansi (ref_instansi_id) | Event Type | Judul Agenda | Lokasi |
| :---: | :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 1 | 1 | 37/B-KS.04.01... | 2026-01-06 s/d 2026-01-06 | Badan Gizi Nasional (678) | PPPK (3) | Fasilitasi Seleksi Kompetensi PPPK Tahap 2 Badan Gizi Nasional di Kanreg III BKN - R. CAT Lt. 3 | Kanreg III BKN - R. CAT Lt. 3 |
| 2 | 2 | 744/B-KS.04.01... | 2026-02-11 s/d 2026-02-12 | Kementerian Hak Asasi Manusia (679) | PPPK (3) | Fasilitasi Seleksi Pengadaan Calon PPPK Kementerian HAM Tahun 2025 di Kanreg III BKN | Kanreg III BKN |
| 3 | 3 | - | 2026-02-12 s/d 2026-02-12 | Pemerintah Kab. Pandeglang (130) | UJIKOM (11) | Fasilitasi Seleksi Pengembangan Karier Pemerintah Kab. Pandeglang di UPSCPKP ASN Serang | UPSCPKP ASN Serang |
| 4 | 4 | 206/UDPICAT... | 2026-02-13 s/d 2026-02-13 | Pemerintah Kab. Ciamis (123) | UJIKOM (11) | Fasilitasi Seleksi Pengembangan Karier Pemerintah Kab. Ciamis di BKPSDM Kab. Ciamis | BKPSDM Kab. Ciamis |
| 5 | 5 | - | 2026-02-13 s/d 2026-02-13 | Kementerian Hak Asasi Manusia (679) | PPPK (3) | Fasilitasi Seleksi Pengadaan Calon PPPK Kementerian HAM Tahun 2025 di UPSCPKP ASN Serang | UPSCPKP ASN Serang |
| 6 | 6 | 216/UDPICAT... | 2026-02-19 s/d 2026-02-19 | Pemerintah Kab. Indramayu (127) | UJIKOM (11) | Fasilitasi Seleksi Pengembangan Karier Pemerintah Kab. Indramayu di Kanreg III BKN | Kanreg III BKN |
| 7 | 7 | - | 2026-02-23 s/d 2026-02-23 | Kementerian Kehutanan (683) | CACT (9) | Fasilitasi CACT Kementerian Kehutanan di UPSCPKP ASN Serang | UPSCPKP ASN Serang |
| 8 | 8 | 815/B-NK.02... | 2026-02-24 s/d 2026-02-25 | Kementerian Kehutanan (683) | CACT (9) | Fasilitasi CACT Kementerian Kehutanan di Kanreg III BKN | Kanreg III BKN |
| 9 | 9 | 944/B-KS.04... | 2026-02-25 s/d 2026-02-25 | Radio Republik Indonesia (670) | UJIKOM (11) | Fasilitasi Seleksi Pengembangan Karier Radio Republik Indonesia di UPSCPKP ASN Serang | UPSCPKP ASN Serang |
| 10 | 10 | 400.9.13.5... | 2026-02-26 s/d 2026-02-26 | Pemerintah Kab. Bandung (121) | UJIKOM (11) | Fasilitasi Seleksi Pengembangan Karier Pemerintah Kab. Bandung di Kanreg III BKN | Kanreg III BKN |
| ... | ... | ... | ... | ... | ... | ... | ... |
| 179 | - | - | 2026-11-16 s/d 2026-12-03 | Pemerintah Kab. Tangerang (133) | PROASN (10) | Fasilitasi ProASN Pemerintah Kab. Tangerang di BKPSDM Kab. Tangerang | BKPSDM Kab. Tangerang |

*(Seluruh 179 data lengkap tersimpan di `apps/agenda-backend/scripts/mapped_cat_2026.json`)*
