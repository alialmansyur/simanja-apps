# Alur Bisnis Sistem (Business Flow)

Dokumen ini memetakan seluruh alur proses bisnis (*business flow*) dari setiap modul yang berjalan di SIMANJA berdasarkan implementasi aktual pada source code.

---

## 1. Alur Autentikasi & Multi-Factor Authentication (MFA / 2FA)

Sistem mengizinkan pengguna masuk menggunakan **NIP Pegawai** atau **Alamat Email**. Implementasi MFA didukung menggunakan protokol TOTP (Google Authenticator) via library `PragmaRX\Google2FA`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Admin/Pegawai)
    participant UI as LoginPage.jsx
    participant AuthAPI as AuthController & AuthService
    participant MfaAPI as MfaController
    participant DB as MySQL (auth_users, settings)

    User->>UI: Input Identifier (NIP / Email) + Password
    UI->>AuthAPI: POST /api/login {email, password}
    AuthAPI->>DB: Query User by email ATAU employee.nip
    alt Kredensial Salah
        AuthAPI->>DB: Catat AuditLog (Login Gagal)
        AuthAPI-->>UI: 422 Unprocessable Entity (Pesan Error)
    else Kredensial Benar
        AuthAPI->>DB: Cek Setting mfa.enabled & mfa.required_for_roles
        alt MFA Aktif (Role Wajib MFA / User Memiliki Secret)
            AuthAPI->>AuthAPI: Generate Sanctum Token (Ability: ['mfa_verify'])
            AuthAPI-->>UI: 200 OK {requires_mfa: true, mfa_setup_required: bool, token: temp_token}
            UI->>User: Redirect ke /mfa-verify
            User->>UI: Input 6-Digit OTP / Scan QR Code
            UI->>MfaAPI: POST /api/mfa/verify {code} (Bearer: temp_token)
            MfaAPI->>MfaAPI: Verifikasi TOTP via Google2FA::verifyKey()
            alt OTP Valid
                MfaAPI->>DB: Revoke temp_token & Update two_factor_confirmed_at
                MfaAPI->>MfaAPI: Generate Full Token (Ability: ['*'])
                MfaAPI->>DB: Catat AuditLog (Verifikasi MFA Berhasil)
                MfaAPI-->>UI: 200 OK {token: full_token, user: {...}}
                UI->>User: Redirect ke /admin
            else OTP Salah
                MfaAPI-->>UI: 422 Unprocessable Entity ("Kode OTP tidak valid.")
            end
        else MFA Tidak Aktif
            AuthAPI->>DB: Revoke token lama & Generate Full Token (['*'])
            AuthAPI->>DB: Catat AuditLog (Login Berhasil)
            AuthAPI-->>UI: 200 OK {token: full_token, user: {...}}
            UI->>User: Redirect ke /admin
        end
    end
```

---

## 2. Alur Manajemen Agenda & Pendeteksian Konflik Jadwal

Pengelolaan agenda dilakukan per **Unit Kerja** (`ref_units`). Sistem dilengkapi mesin pendeteksi bentrok jadwal pegawai (`ReferenceController@getEmployeeAvailability`) dan pencegahan duplikasi data agenda.

```mermaid
flowchart TD
    Start(["Mulai Tambah / Edit Agenda"]) --> SelectUnit["Pilih Unit Kerja & Buka Workspace Agenda"]
    SelectUnit --> FillForm["Isi Detail: Judul, Kategori, Rentang Tanggal & Jam"]
    
    FillForm --> CheckConflict{"Cek Ketersediaan Pegawai & Ruangan\n(Realtime via API)"}
    CheckConflict -->|"Bentrok Terdeteksi"| ShowConflictBadge["Tampilkan Indikator Bentrok & Nama Agenda Lawan"]
    CheckConflict -->|"Tersedia"| ReadyToSubmit["Status Hijau / Siap Disimpan"]
    
    ShowConflictBadge --> UserDecide["User Memilih Tetap Lanjut / Ubah Jadwal"]
    UserDecide --> Submit["Klik Simpan Agenda"]
    ReadyToSubmit --> Submit
    
    Submit --> CheckDuplicate{"Backend Duplicate Check:\n(Unit + Kategori + Tanggal Sama?)"}
    CheckDuplicate -->|"Duplikat Ditemukan"| RejectDuplicate["Tolak: 422 Unprocessable Entity\n('Agenda dengan Unit, Kategori & Tanggal yang sama sudah ada')"]
    
    CheckDuplicate -->|"Lolos Validasi"| BeginTrx["Mulai Database Transaction"]
    BeginTrx --> SaveAgenda["Simpan / Update record ke trx_agendas"]
    SaveAgenda --> SaveRooms["Simpan Multi Ruangan ke trx_agenda_rooms (Pivot)"]
    
    SaveRooms --> CheckCategoryCAT{"Apakah Kategori 'Fasilitasi CAT'?"}
    CheckCategoryCAT -->|"Ya"| SaveOfficers["Simpan Petugas + Posisi Jabatan\n(ref_officer_position_id) ke trx_agenda_participants"]
    CheckCategoryCAT -->|"Bukan CAT"| CheckAllEmp{"Apakah 'Semua Pegawai' dicentang?"}
    
    CheckAllEmp -->|"Ya (is_all_employees=true)"| CommitTrx["Commit Transaction"]
    CheckAllEmp -->|"Tidak (Spesifik Pegawai)"| SaveParticipants["Simpan Daftar Pegawai Terpilih ke trx_agenda_participants"]
    
    SaveParticipants --> CommitTrx
    SaveOfficers --> CommitTrx
    CommitTrx --> End(["Selesai: Agenda Terbit & Notifikasi Sukses"])
```

### Lifecycle Status Agenda:
1. **Draft**: Agenda baru dicatat, belum final.
2. **Terjadwal / Publish**: Agenda resmi diagendakan, dapat dilihat di kalender admin dan layar display publik jika `publish_type = 'public'`.
3. **Butuh Approval**: Agenda menunggu persetujuan (fitur struktur data telah ada di `AgendaApproval`).
4. **Selesai**: Agenda telah terlaksana.
5. **Batal**: Agenda dibatalkan (tidak dimunculkan pada kalender publik).

---

## 3. Alur Pemantauan Okupansi Ruangan (Dynamic Room Occupancy)

Status penggunaan ruangan (`ref_rooms`) tidak disimpan sebagai status statis di database, melainkan **dihitung secara dinamis saat runtime** oleh `RoomController` berdasarkan jadwal agenda yang aktif:

```mermaid
flowchart TD
    Req["Request GET /api/rooms atau /api/rooms/{uid}"] --> LoadRooms["Load Ruangan + Eager Load Agendas Aktif (end_date >= Hari Ini)"]
    LoadRooms --> LoopAgenda["Iterasi Setiap Agenda pada Ruangan"]
    
    LoopAgenda --> CalcWindow["Hitung Buffer Window:\nStart Buffer = start_time - 1 Jam\nEnd Buffer = end_time + 1 Jam"]
    
    CalcWindow --> CheckNow{"Waktu Sekarang (now)\nberada di antara Start Buffer & End Buffer?"}
    CheckNow -->|"Ya"| MarkBusy["Status Ruangan: 'Sedang Digunakan'\nSet currentAgenda = agenda.title"]
    CheckNow -->|"Tidak"| CheckFuture{"start_time > now?"}
    
    CheckFuture -->|"Ya (Agenda Terdekat)"| SetNext["Set nextAgenda = agenda.title + (Waktu Mulai)"]
    CheckFuture -->|"Tidak"| ContinueLoop["Lanjut ke Agenda Berikutnya"]
    
    MarkBusy --> CheckActive{"is_active Ruangan == true?"}
    SetNext --> CheckActive
    ContinueLoop --> CheckActive
    
    CheckActive -->|"Tidak"| FinalInactive["Status: 'Tidak Aktif'"]
    CheckActive -->|"Ya, dan ada bentrok buffer"| FinalBusy["Status: 'Sedang Digunakan'"]
    CheckActive -->|"Ya, dan tidak ada bentrok"| FinalAvailable["Status: 'Tersedia'"]
    
    FinalInactive --> Response["Return JSON ke Frontend (RoomsPage / RoomDetailPage)"]
    FinalBusy --> Response
    FinalAvailable --> Response
```

---

## 4. Alur Pembuatan & Pengelolaan Notula Rapat (Meeting Minutes)

Modul Notula (`trx_notulas`) berfungsi mencatat hasil pelaksanaan agenda rapat, notulensi keputusan, catatan tindak lanjut, dan daftar presensi kehadiran peserta.

```mermaid
sequenceDiagram
    autonumber
    actor Notulis as Notulis / Staff Admin
    participant UI as MinutesPage & NotulaDetailPage
    participant API as NotulaController
    participant DB as MySQL (trx_notulas, trx_agenda_participants)

    Notulis->>UI: Buka Menu Notula & Klik "Buat Notula Baru"
    UI->>API: GET /api/agendas (Daftar Agenda untuk Dropdown)
    API-->>UI: Kembalikan List Agenda (Ditandai has_notula)
    Notulis->>UI: Pilih Agenda & Masukkan Judul Notula
    UI->>API: POST /api/notulas {trx_agenda_id, title, status: 'Draft'}
    API->>DB: Insert ke trx_notulas (Generate UUID otomatis)
    API-->>UI: 201 Created {uid, title, ...}
    UI->>Notulis: Alihkan ke Workspace Notula (/admin/notula/detail/:uid)
    
    Note over Notulis, UI: Pengisian Konten Notulensi
    Notulis->>UI: Isi Ringkasan, Keputusan, Catatan Tambahan
    UI->>API: PUT /api/notulas/:uid {summary, decisions, notes, status}
    API->>DB: Update record trx_notulas
    
    Note over Notulis, UI: Presensi & Peserta Tambahan (Internal / Eksternal Guest)
    Notulis->>UI: Tambah Peserta Tamu / Pegawai Luar Unit
    UI->>API: POST /api/notulas/:uid/participants {employee_id, guest_name, guest_nip, guest_institution}
    API->>DB: Insert ke trx_agenda_participants
    API-->>UI: 201 Created (Peserta berhasil ditambahkan)
    
    Notulis->>UI: Klik "Cetak / Export PDF Notula"
    UI->>UI: Render Template PDF & Pratinjau Cetak
```

---

## 5. Alur Layar Display Publik & Kiosk (`agenda-dashboard`)

Aplikasi `agenda-dashboard` dirancang untuk berjalan tanpa autentikasi (*public display screen*) pada TV informasi lobi atau kiosk digital kantor.

```mermaid
flowchart TD
    Display["Layar Kiosk / TV Membuka agenda-dashboard"] --> ParallelFetch["Parallel API Request (Tanpa Auth Header)"]
    
    ParallelFetch --> A["GET /api/settings/public\n(Ambil Nama Kantor, Logo, Running Text)"]
    ParallelFetch --> B["GET /api/public/dashboard/kpi\n(Hitung Total Agenda, Selesai, Reminder Bulan Ini)"]
    ParallelFetch --> C["GET /api/public/dashboard/announcements\n(Ambil Teks Pengumuman Berjalan)"]
    ParallelFetch --> D["GET /api/public/dashboard/events\n(Ambil Agenda Public rentang -3 s/d +3 Bulan)"]
    
    A & B & C & D --> Render["Render UI Publik"]
    
    Render --> Comp1["LiveClock: Jam Digital Realtime"]
    Render --> Comp2["RunningText Ticker: Berita & Pengumuman"]
    Render --> Comp3["KPICards: Statistik Agenda Bulan Berjalan"]
    Render --> Comp4["MainCalendar & YearView: Kalender Interaktif"]
    Render --> Comp5["TimelineSidebar: Daftar Agenda Mendatang"]
    
    Comp4 --> ModalEvent["Klik Event Card: Buka Modal Detail Agenda"]
    ModalEvent --> GCalExport["Tombol 'Add to Google Calendar'\n(Generate gCalStart / gCalEnd URL)"]
```

---

## 6. Alur Template Builder Dokumen & Surat Tugas

Sistem menyediakan builder visual untuk template surat kedinasan (`ref_document_templates` & `ref_document_templates_body`):

1. Admin membuka **Master Data → Template Surat**.
2. Memilih template atau membuat template baru dengan menentukan:
   * **Kategori Dokumen** (e.g. Surat Tugas, Undangan, Berita Acara).
   * **Format Nomor Surat** (e.g. `ST/{UNIT}/{ROMAN_MONTH}/{YEAR}`).
3. Masuk ke **Template Builder Workspace** (`TemplateDetailWorkspace.jsx`):
   * Mengatur **Kop Surat**.
   * Menulis klausul **Menimbang**, **Mengingat**, dan **Memperhatikan**.
   * Menyusun **Body Content** dokumen menggunakan editor teks.
4. Backend menyimpan data header di `ref_document_templates` dan rincian klausul di `ref_document_templates_body` menggunakan relasi `hasOne`.

---

## 7. Alur Dynamic System Settings Engine

Pengaturan aplikasi dikelola secara terpusat dan dinamis:
1. `setting_groups` mengelompokkan setelan (misal: General, Security/MFA, Notifications).
2. Setiap `settings` memiliki tipe data (`text`, `boolean`, `select`, `multiselect`, `image`, `password`).
3. Endpoint `POST /api/settings/bulk-update` menerima key-value secara kolektif:
   * Tipe `image` disimpan ke storage publik.
   * Tipe `password` (misal SMTP) dienkripsi menggunakan `Crypt::encryptString`.
   * Cache `app_settings` dibersihkan otomatis via `Cache::forget('app_settings')`.
   * Setelan dengan `is_public = true` diekspos melalui `GET /api/settings/public`.
