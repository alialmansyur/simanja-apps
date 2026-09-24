# Aturan Bisnis & Lifecycle Data (Business Rules)

Dokumen ini merangkum seluruh aturan bisnis (*business rules*), validasi data, dan siklus hidup (*lifecycle*) entitas pada sistem SIMANJA.

---

## 1. Aturan Penjadwalan & Pengelolaan Agenda

### A. Validasi Waktu & Lokasi
1. **Rentang Tanggal Valid**: `endDate` wajib bernilai sama dengan atau setelah `startDate` (`after_or_equal:startDate`).
2. **Format Jam**: Waktu mulai (`startTime`) dan selesai (`endTime`) harus berformat waktu valid (`H:i:s` atau `H:i`).
3. **Pemisahan Mode Pertemuan (Online vs Offline)**:
   * **Online (`is_online = true`)**: Form mewajibkan pengisian tautan pertemuan (`online_url`), meeting ID (`online_meeting_id`), dan passcode (`online_password`). Kolom ruangan fisik dikosongkan.
   * **Offline (`is_online = false`)**: Kegiatan dialokasikan ke satu atau beberapa ruangan (`roomIds[]` pada pivot `trx_agenda_rooms`) atau lokasi luar kantor (`offline_location`).

### B. Pencegahan Duplikasi Agenda (Duplicate Prevention)
Sistem mencegah pembuatan agenda ganda pada unit kerja yang sama. Kriteria duplikasi:
$$\text{ref\_unit\_id} + \text{ref\_agenda\_category\_id} + \text{start\_date}$$
Jika ditemukan record aktif (`deleted_at IS NULL`) dengan kombinasi ketiga variabel di atas, sistem akan menolak penyimpanan dengan kode status HTTP `422 Unprocessable Entity` (*"Agenda dengan Unit, Kategori Kegiatan, dan Tanggal yang sama sudah ada"*).

### C. Mesin Pendeteksi Bentrok Pegawai (Conflict Detection Engine)
Algoritma pada `ReferenceController@getEmployeeAvailability` memeriksa ketersediaan setiap pegawai internal berdasarkan irisan waktu:
$$\text{Agenda A dan B Bentrok jika: } (\text{Start}_A \le \text{End}_B) \land (\text{End}_A \ge \text{Start}_B) \land (\text{StartTime}_A \le \text{EndTime}_B) \land (\text{EndTime}_A \ge \text{StartTime}_B)$$

* **Kondisi Pengabaian Bentrok**:
  1. Agenda dengan status `Batal` atau `Selesai` diabaikan dari perhitungan bentrok.
  2. Agenda yang telah lewat dari waktu sekarang (`CONCAT(end_date, ' ', end_time) < now()`) diabaikan.
  3. **Pengecualian Khusus**: Pegawai dengan NIP `197005131991031001` (Kepala Kantor Regional) diberi bypass ketersediaan agar selalu berstatus `is_available = true` tanpa blokir bentrok.

### D. Perlakuan Khusus Kategori "Fasilitasi CAT"
* Jika kategori agenda adalah **`Fasilitasi CAT`**:
  * Daftar peserta bertindak sebagai **Daftar Petugas Ujian CAT**.
  * Setiap petugas wajib dipasangkan dengan peran jabatan (`ref_officer_position_id`), misalnya: *Koordinator Lapangan, Pengawas Ruang, Tim IT/Server, Tim Keamanan, dsb*.
* Jika kategori umum (Rapat, Monitoring, Sosialisasi):
  * Jika `is_all_employees = true`, maka agenda ditujukan untuk seluruh pegawai tanpa mencatat baris peserta individual di tabel pivot.
  * Jika `is_all_employees = false`, maka peserta individual disimpan ke `trx_agenda_participants`.

---

## 2. Aturan Okupansi & Pemantauan Ruangan (Room Occupancy Rules)

Status ruangan dihitung secara dinamis (*realtime runtime calculation*) pada `RoomController`:

```text
[ start_time - 1 Jam ] <=========== BUFFER WAKTU AGENDA ===========> [ end_time + 1 Jam ]
                               ▲ Waktu Sekarang (NOW) ▲
                           Status: "Sedang Digunakan"
```

1. **Buffer Persiapan & Selesai (±1 Jam)**:
   * Batas awal pemakaian dihitung $1\text{ jam}$ sebelum jam mulai agenda (`start_time - 1 hour`).
   * Batas akhir pemakaian dihitung $1\text{ jam}$ setelah jam selesai agenda (`end_time + 1 hour`).
2. **Kondisi Penentuan Status**:
   * **`Sedang Digunakan`**: Jika waktu saat ini (`now`) berada dalam rentang buffer waktu agenda aktif.
   * **`Tersedia`**: Ruangan berstatus `is_active = true` dan tidak ada agenda yang sedang berlangsung di dalam buffer waktu.
   * **`Tidak Aktif`**: Ruangan diset nonaktif (`is_active = false`) oleh Administrator.
3. **Pemberitahuan Agenda Berikutnya (`nextAgenda`)**:
   * Menampilkan judul agenda terdekat berikutnya beserta jam mulai (misal: *"Rapat Koordinasi (25/09/2026 14:00)"*).

---

## 3. Aturan & Lifecycle Notula Rapat

1. **Identitas Unik**: Setiap notula memiliki identifier UUID acak (`uid`) yang di-generate otomatis saat pembuatan (`Str::uuid()`).
2. **Keterikatan dengan Agenda**:
   * Notula dapat ditautkan ke record agenda (`trx_agenda_id`).
   * Dropdown pemilihan agenda secara otomatis menyaring agenda hari libur nasional / cuti bersama dan menandai agenda yang sudah memiliki notula (`has_notula = true`).
3. **Presensi & Daftar Kehadiran**:
   * Mendukung presensi pegawai internal (`ref_employee_id`).
   * Mendukung pencatatan tamu dari instansi luar kantor (`guest_name`, `guest_nip`, `guest_institution`).
4. **Lifecycle Status Notula**:
   * **`Draft`**: Notulensi sedang disusun, ringkasan, keputusan, dan catatan masih dapat diubah sewaktu-waktu.
   * **`Final` / `Disahkan`**: Notulensi telah difinalisasi dan siap diekspor / dicetak sebagai dokumen resmi.

---

## 4. Aturan Keamanan & Pengaturan Multi-Factor Authentication (MFA)

1. **Mekanisme Dual Identifier Login**:
   * User dapat login menggunakan format email valid (`user@agenda.local`) ATAU NIP 18-digit (`1985...`).
2. **Evaluasi Keharusan MFA pada Login**:
   * Sistem membaca pengaturan dinamis `mfa.enabled` dari tabel `settings`.
   * Sistem membaca daftar peran wajib MFA pada setting `mfa.required_for_roles` (Array JSON, e.g. `["Super Admin", "Admin"]`).
   * Jika MFA aktif dan role user masuk dalam daftar ATAU user telah mengaktifkan MFA mandiri (`two_factor_secret` terisi), sistem **wajib mengalihkan** user ke tahap verifikasi OTP.
3. **Token Ability Isolation**:
   * Token sementara yang diterbitkan saat login pertama hanya memiliki ability `['mfa_verify']`. Token ini dilarang digunakan untuk memanggil endpoint data operasional.
4. **Proteksi Reset MFA**:
   * Hanya akun dengan role **Super Admin** yang memiliki izin untuk mereset secret MFA pengguna lain (`POST /api/users/{user}/reset-mfa`).
