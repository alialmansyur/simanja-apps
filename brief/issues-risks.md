# Temuan Audit, Gap, Risiko & Potensi Mismatch (Issues & Risks)

Dokumen ini memuat ringkasan hasil audit teknis mendalam terhadap kode sumber, database, dan arsitektur aplikasi SIMANJA, yang mencakup temuan bug, inkonsistensi skema, celah fungsional (*gap*), potensi risiko operasional, serta hal-hal yang membutuhkan klarifikasi.

---

## 1. Inkonsistensi Skema Basis Data & Model (Database & Model Inconsistencies)

### A. Dualitas Tabel Pegawai (`ref_employees` vs `ref_pegawai`)
* **Temuan**: File migration awal `2026_07_06_090506_create_reference_tables.php` mendefinisikan tabel `ref_employees` (`nik`, `name`, `email`, `phone`, `ref_unit_id`, `position`). Namun, model `Employee.php`, relasi di `User.php`, dan seluruh query di controller secara nyata mengakses tabel `ref_pegawai` (`nip`, `nama`, `gender`, `status_pegawai`, `unit_id`, `is_status`).
* **Dampak**: Tabel `ref_employees` menjadi tabel *zombie* (tidak digunakan), sedangkan migrasi untuk `ref_pegawai` tidak ada di folder migrasi resmi (berasal dari legacy DB).
* **Rekomendasi**: Standardisasi skema dan buat migrasi resmi untuk `ref_pegawai`, serta hapus / bersihkan tabel lama `ref_employees`.

### B. Model `Announcement` Tanpa Tabel Migration
* **Temuan**: Model `Announcement.php` tersedia dan dipanggil oleh `DashboardController@announcements` serta `PublicDashboardController@announcements` di dalam blok `try-catch`. Namun, **tidak ada file migration** untuk tabel `announcements` pada basis data.
* **Dampak**: Query ke tabel pengumuman selalu gagal dan jatuh (*fallback*) ke array hardcoded statis.
* **Rekomendasi**: Buat migration untuk tabel `trx_announcements` / `announcements` atau satukan pengumuman sepenuhnya ke dalam Dynamic Settings Engine (`dashboard.running_text`).

### C. Ketidaksesuaian Nama Kolom UUID (`uid` vs `uuid`)
* **Temuan**:
  1. Pada migrasi `trx_notulas` (`2026_07_07_232408_update_trx_notulas_table.php`), kolom dinamai `uuid`. Namun, model `Notula.php` dan `NotulaRequest.php` menggunakan properti `uid` (`$fillable = ['uid', ...]`, `getRouteKeyName() => 'uid'`).
  2. Pada `ref_document_templates`, migrasi menambahkan `uuid`, namun controller `TemplateBuilderController` dan service mencari dengan fallback `where('uid', $uuid)->orWhere('id', $uuid)`.
* **Dampak**: Potensi runtime error pada database driver SQL yang ketat (*strict mode*) jika kolom fisik di tabel adalah `uuid` sementara Eloquent mencoba meng-insert field `uid`.
* **Rekomendasi**: Samakan penamaan kolom menjadi `uuid` secara konsisten di migrasi, model, dan API parameter.

### D. Model Tanpa Migrasi Aktif (Orphan Models)
* **Temuan**: Ditemukan beberapa model di `app/Models/` yang tidak memiliki tabel/rute aktif atau sisa rancangan lama: `AgendaApproval.php`, `AgendaAttachment.php`, `AgendaPublication.php`, `Department.php`, dan `Location.php`.
* **Rekomendasi**: Evaluasi apakah modul persetujuan multi-level (*Agenda Approval Workflow*) akan diaktifkan atau file model legacy tersebut diarsipkan.

---

## 2. Gap Fungsional Antarmuka Pengguna (Frontend UI Gaps)

### A. Halaman Placeholder Shell pada Admin Panel
* **Temuan**:
  1. Rute `/admin/calendar` (`apps/agenda-admin/src/modules/calendar/pages/CalendarPage.jsx`) saat ini masih berupa tampilan placeholder statis (`FeaturePageShell`), padahal di `agenda-dashboard` kalender interaktif sudah berfungsi penuh.
  2. Rute `/admin/audit-log` (`apps/agenda-admin/src/modules/audit/pages/AuditLogPage.jsx`) masih berupa placeholder statis (`FeaturePageShell`), padahal backend secara konsisten mencatat data aktivitas ke tabel `trx_audit_logs`.
* **Dampak**: Administrator tidak dapat melihat visualisasi kalender terintegrasi atau meninjau audit trail secara visual melalui menu admin.
* **Rekomendasi**: Implementasikan tabel data dinamis pada `AuditLogPage` dan integrasikan komponen kalender interaktif pada `CalendarPage`.

---

## 3. Celah Keamanan & Validasi Otorisasi (Security & Authorization Gaps)

### A. Kurangnya Pengecekan Otorisasi Role pada `SettingController@bulkUpdate`
* **Temuan**: Endpoint `POST /api/settings/bulk-update` hanya dilindungi middleware `auth:sanctum`, namun **tidak memverifikasi apakah pemanggil memiliki role `Super Admin`** (berbeda dengan `UserController` dan `MasterDataController` yang memverifikasi `$request->user()->hasRole(...)`).
* **Dampak**: Pengguna biasa ber-role `User` yang memiliki token valid secara teknis dapat mengirim payload ke endpoint ini untuk mengubah pengaturan sistem global.
* **Rekomendasi**: Tambahkan validasi otorisasi `if (!$request->user()->hasRole('Super Admin')) return $this->errorResponse('Unauthorized', null, 403);`.

### B. URL Hardcoded pada Frontend (`http://localhost:8000`)
* **Temuan**: Pada `apps/agenda-admin/src/layouts/Sidebar.jsx` baris 57:
  ```jsx
  src={`http://localhost:8000/storage/${settings['app.logo']}`}
  ```
* **Dampak**: Saat aplikasi dideploy ke lingkungan server staging/produksi (port 8102 / domain riil), gambar logo akan gagal dimuat (*broken image link*).
* **Rekomendasi**: Ganti dengan baseURL dinamis dari `import.meta.env.VITE_API_BASE_URL` atau Storage Base URL.

### C. Filter Hardcoded Nama Hari Libur pada `AgendaController@index`
* **Temuan**: Pada `AgendaController@index`, penyaringan hari libur dilakukan dengan string matching manual:
  ```php
  if (str_contains($t, 'cuti bersama') || str_contains($t, 'hari libur')) return false;
  if (str_contains($t, 'isra mikraj') || str_contains($t, 'wafat yesus')) return false;
  // ...
  ```
* **Dampak**: Rentan terlewat jika terdapat variasi penulisan nama hari libur, dan memperlambat pemrosesan collection di PHP.
* **Rekomendasi**: Tambahkan flag boolean `is_holiday` atau kategori khusus `Hari Libur` pada query database SQL langsung.

---

## 4. Potensi Race Condition pada Pengecekan Bentrok

* **Temuan**: Pengecekan duplikasi (`duplicateQuery->exists()`) dan pengecekan bentrok jadwal dilakukan pada layer aplikasi sebelum query `insertGetId` dalam blok transaksi standar.
* **Risiko**: Pada kondisi konkurensi tinggi (dua user menginput jadwal yang sama persis di milidetik yang sama), kedua request dapat lolos validasi awal sebelum commit.
* **Rekomendasi**: Tambahkan *Unique Database Constraint* atau kunci pesimistik (*pessimistic lock*) pada rentang waktu yang krusial.

---

## 5. Daftar Bagian yang Membutuhkan Klarifikasi `[NEEDS CLARIFICATION]`

1. `[NEEDS CLARIFICATION]` **Tabel Master Pegawai**: Apakah struktur tabel `ref_pegawai` sudah final dari integrasi database SIMPEG/Kepegawaian eksternal, atau perlu diselaraskan dengan migrasi `ref_employees`?
2. `[NEEDS CLARIFICATION]` **Modul Pengumuman (Announcements)**: Apakah pengumuman akan dibuatkan tabel tersendiri (`trx_announcements`) dengan fitur jadwal tayang (`publish_at`/`unpublish_at`), atau cukup memanfaatkan setelan teks berjalan (`dashboard.running_text`) pada Dynamic Settings?
3. `[NEEDS CLARIFICATION]` **Agenda Approval Workflow**: Pada source code terdapat tabel seeder `ref_statuses` (status: `Butuh approval`) dan model `AgendaApproval.php`. Apakah alur *multi-tier approval* (Staf mengajukan -> Kasubag/Koordinator menyetujui -> Agenda Terbit) direncanakan untuk diaktifkan pada fase pengembangan berikutnya?
4. `[NEEDS CLARIFICATION]` **Halaman Admin Calendar & Audit Log**: Apakah modul Kalender dan Audit Log pada panel admin direncanakan untuk dibangun penuh menggunakan tabel dan kalender interaktif pada sprint berikutnya?
