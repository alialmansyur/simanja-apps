# Perencanaan Integrasi ref_instansi pada Modul Agenda

## 1. Kondisi Existing

### A. Database
* Tabel `ref_instansi` sudah tersedia pada database `agenda_db` dengan skema:
  * `id` (BIGINT UNSIGNED, Primary Key, Auto Increment)
  * `kodeins` (INT, Kode Instansi BKN)
  * `nama` (VARCHAR(100), Nama Lengkap Instansi)
  * `kanreg` (INT, ID Kantor Regional)
  * `wilker` (INT, ID Wilayah Kerja)
  * `wilayah` (VARCHAR(6), Kode Wilayah)
  * `is_status` (INT / TINYINT, Status Keaktifan 1=Aktif, 0=Nonaktif)
  * `logo` (VARCHAR(50), Path / nama file logo)
  * `created_at`, `updated_at` (TIMESTAMP)
* Tabel `trx_agendas` saat ini **belum memiliki kolom foreign key** untuk mengaitkan agenda ke instansi (`ref_instansi_id` atau `instansi_id`).
* Belum ada relasi formal antara transaksi agenda dan master instansi.

### B. Backend (Laravel 11)
* **Model**: Belum ada model `Instansi.php` pada folder `app/Models/`.
* **Model `Agenda.php`**: Belum mendefinisikan relasi `instansi(): BelongsTo` dan properti `$fillable` belum memuat `ref_instansi_id`.
* **Controller**:
  * `ReferenceController.php`: Belum memiliki method `getInstansi()` untuk menyediakan data dropdown instansi.
  * `UnitController.php` (`agendas` & `storeAgenda`): Query `agendas` belum melakukan join ke tabel `ref_instansi`, dan method `storeAgenda` belum memvalidasi atau menyimpan field instansi.
  * `AgendaController.php` (`update`, `history`, `exportHistory`): Belum memvalidasi, mengupdate, atau memformat data instansi ke dalam response API.
  * `PublicDashboardController.php` & `DashboardController.php`: Belum memuat data instansi pada payload kalender/kegiatan.

### C. Frontend Admin (`apps/agenda-admin`)
* Halaman `admin/agenda/manage/{param}` dilayani oleh `AgendaManagementWorkspace.jsx`.
* State form agenda (`createInitialForm`) belum memuat field `instansiId`.
* Modal Tambah & Edit agenda belum menyediakan input pilihan Instansi.
* Modal Detail agenda (`selectedActivity`) belum menampilkan instansi penyelenggara/mitra.
* `agendaService.js` belum memiliki fungsi `getInstansi()`.

---

## 2. Business Rule

1. Setiap agenda kegiatan (terutama kategori Fasilitasi CAT, Rapat Koordinasi, atau Sosialisasi Eksternal) dapat ditautkan ke satu Instansi mitra / penyelenggara dari master `ref_instansi`.
2. Pengisian Instansi bersifat **opsional (nullable)** untuk mengakomodasi agenda internal kanreg murni yang tidak melibatkan instansi eksternal.
3. Input Instansi pada antarmuka admin menggunakan komponen **Searchable Select** (`react-select`) agar pengguna dapat mencari ribuan instansi berdasarkan nama atau kode instansi dengan cepat.
4. Data master instansi yang ditampilkan pada dropdown hanya instansi dengan status aktif (`is_status = 1`).
5. Pada modal Detail Agenda dan tabel riwayat, nama instansi ditampilkan dengan jelas jika agenda tersebut memiliki relasi instansi.

---

## 3. File & Komponen Terdampak

| Komponen / File | Layer | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `database/migrations/xxxx_add_ref_instansi_id_to_trx_agendas_table.php` | Database | Menambahkan kolom `ref_instansi_id` (foreign key nullable ke `ref_instansi.id`). |
| `app/Models/Instansi.php` | Backend Model | Membuat model Eloquent baru untuk tabel `ref_instansi`. |
| `app/Models/Agenda.php` | Backend Model | Menambahkan relasi `instansi(): BelongsTo` dan menambahkan `ref_instansi_id` ke `$fillable`. |
| `app/Http/Controllers/Api/ReferenceController.php` | Backend Controller | Menambahkan method `getInstansi()` untuk endpoint `GET /api/references/instansi`. |
| `app/Http/Controllers/Api/UnitController.php` | Backend Controller | Menambahkan join `ref_instansi` pada method `agendas` dan validasi/simpan `ref_instansi_id` pada `storeAgenda`. |
| `app/Http/Controllers/Api/AgendaController.php` | Backend Controller | Menambahkan validasi/update `ref_instansi_id` pada `update`, serta join dan mapping instansi pada `history` dan `exportHistory`. |
| `app/Http/Controllers/Api/PublicDashboardController.php` | Backend Controller | Memuat data `instansi` pada payload `events()` kalender publik jika ada. |
| `apps/agenda-admin/src/modules/agenda/services/agendaService.js` | Frontend Service | Menambahkan fungsi `getInstansi()` pemanggil API. |
| `apps/agenda-admin/src/modules/agenda/components/AgendaManagementWorkspace.jsx` | Frontend View | Mengintegrasikan state instansi, searchable select pada Modal Tambah/Edit, dan visualisasi pada Modal Detail. |

---

## 4. Database & Query Terdampak

### A. Skema Migration
```php
Schema::table('trx_agendas', function (Blueprint $table) {
    $table->unsignedBigInteger('ref_instansi_id')->nullable()->after('ref_unit_id');
    $table->foreign('ref_instansi_id')->references('id')->on('ref_instansi')->nullOnDelete();
});
```

### B. Query Backend
1. **Reference Instansi**:
   ```sql
   SELECT id, kodeins, nama FROM ref_instansi WHERE is_status = 1 ORDER BY nama ASC;
   ```
2. **Agenda Fetch / History**:
   ```sql
   LEFT JOIN ref_instansi ON trx_agendas.ref_instansi_id = ref_instansi.id
   SELECT ..., trx_agendas.ref_instansi_id, ref_instansi.nama as instansi_name, ref_instansi.kodeins as instansi_code
   ```

---

## 5. Perubahan yang Diperlukan

### Backend
1. Buat file migration penambahan kolom `ref_instansi_id` pada `trx_agendas`.
2. Buat file model `app/Models/Instansi.php`:
   ```php
   namespace App\Models;
   use Illuminate\Database\Eloquent\Model;
   
   class Instansi extends Model {
       protected $table = 'ref_instansi';
       protected $fillable = ['kodeins', 'nama', 'kanreg', 'wilker', 'wilayah', 'is_status', 'logo'];
   }
   ```
3. Update `app/Models/Agenda.php`:
   * Tambah `'ref_instansi_id'` pada `$fillable`.
   * Tambah method:
     ```php
     public function instansi(): BelongsTo {
         return $this->belongsTo(Instansi::class, 'ref_instansi_id');
     }
     ```
4. Update `ReferenceController.php`:
   ```php
   public function getInstansi(): JsonResponse {
       $instansi = DB::table('ref_instansi')
           ->where('is_status', 1)
           ->select('id', 'kodeins', 'nama')
           ->orderBy('nama', 'asc')
           ->get();
       return response()->json(['message' => 'Success', 'data' => $instansi]);
   }
   ```
5. Daftarkan route pada `routes/api.php`:
   ```php
   Route::get('/references/instansi', [ReferenceController::class, 'getInstansi']);
   ```
6. Update validasi pada `UnitController@storeAgenda` & `AgendaController@update`:
   ```php
   'instansiId' => 'nullable|integer|exists:ref_instansi,id',
   ```
   Dan sertakan `ref_instansi_id` pada operasi `insertGetId` dan `update`.

### Frontend (`agenda-admin`)
1. Update `agendaService.js`:
   ```javascript
   getInstansi: async () => {
       const response = await axiosInstance.get('/references/instansi');
       return response.data.data;
   },
   ```
2. Update `AgendaManagementWorkspace.jsx`:
   * State: `const [instansiOptions, setInstansiOptions] = useState([]);`
   * Fetch saat component did mount: memuat data master instansi dan memformatnya menjadi `{ value: item.id, label: `${item.nama} (${item.kodeins || '-'})`, name: item.nama }`.
   * Form state: `instansiId: ''`.
   * Pada Modal Tambah / Edit: Tambahkan komponen `Select` (react-select) dengan opsi filter/search, placeholder "Pilih atau cari instansi...", `isClearable={true}`.
   * Pada Modal Detail (`selectedActivity`): Tambahkan baris informasi Instansi:
     ```jsx
     {selectedActivity.instansiName && (
       <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
         <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Instansi</span>
         <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedActivity.instansiName}</span>
       </div>
     )}
     ```

---

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Jumlah data `ref_instansi` cukup besar (>600 records). | Loading dropdown sedikit berat jika me-render semua DOM option sekaligus. | Gunakan `react-select` dengan built-in search virtualization atau pagination jika diperlukan. Data 686 item sangat ringan untuk JSON API (<50KB). |
| Data agenda existing memiliki nilai `ref_instansi_id = NULL`. | Potensi error null reference jika frontend mengasumsikan field selalu ada. | Terapkan null-safe access (`activity.instansiName || '-'`) di seluruh level backend dan frontend. |
| Perubahan validasi pada payload `storeAgenda` & `update`. | Error 422 jika format ID instansi tidak sesuai. | Validasi `nullable|integer|exists:ref_instansi,id` memastikan hanya ID valid atau null yang lolos. |

---

## 7. Urutan Implementasi

1. **Tahap 1**: Buat dan jalankan migrasi database `add_ref_instansi_id_to_trx_agendas_table`.
2. **Tahap 2**: Buat model `Instansi.php` dan update model `Agenda.php`.
3. **Tahap 3**: Tambahkan method `getInstansi()` pada `ReferenceController.php` dan daftarkan route di `routes/api.php`.
4. **Tahap 4**: Update `UnitController.php` (`storeAgenda`, `agendas`) dan `AgendaController.php` (`update`, `history`, `exportHistory`) untuk menyertakan `ref_instansi_id`.
5. **Tahap 5**: Update `agendaService.js` pada `agenda-admin`.
6. **Tahap 6**: Update `AgendaManagementWorkspace.jsx` (fetch options, searchable select pada create/edit, tampilan pada detail, penyesuaian payload submit).
7. **Tahap 7**: Pengujian fungsional simpan, update, tampil detail, dan filter instansi.

---

## 8. Testing yang Diperlukan

* [x] **Migration Check**: Kolom `ref_instansi_id` berhasil terbuat dengan constraint foreign key yang tepat ke `ref_instansi(id)`.
* [x] **API Endpoint Check**: Uji `GET /api/references/instansi` mengembalikan daftar instansi aktif (`is_status = 1`) dalam format JSON standar.
* [x] **Create Agenda with Instansi**: Form modal tambah agenda berhasil menampilkan searchable select di bawah Deskripsi Kegiatan ukuran col-12 dan menyimpan `ref_instansi_id`.
* [x] **Create Agenda without Instansi**: Agenda baru tanpa instansi tetap tersimpan valid (`NULL`).
* [x] **Edit Agenda**: Form modal edit berhasil me-load dan memperbarui data instansi.
* [x] **Detail Modal View**: Modal detail agenda menampilkan nama instansi dengan badge khusus jika terisi.
* [x] **Data Export**: History dan export memetakan instansi dengan baik.
