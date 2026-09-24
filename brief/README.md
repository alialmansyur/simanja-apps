# SIMANJA (Sistem Manajemen Agenda & Notula Kanreg)
## Technical Documentation & System Brief

Dokumentasi ini disusun oleh **Senior Fullstack Developer & System Analyst** sebagai hasil audit komprehensif terhadap seluruh source code, basis data, API, arsitektur, dan business rules project **SIMANJA**. Dokumen ini berfungsi sebagai **acuan resmi pengembangan dan pemeliharaan project**.

---

### 1. Ikhtisar Project (Project Overview)

SIMANJA adalah sistem terintegrasi untuk pengelolaan agenda kerja, peminjaman ruangan, pembuatan notula rapat, penugasan fasilitasi CAT, visualisasi jadwal kalender, dan monitoring publik pada lingkungan Kantor Regional (Kanreg) BKN.

Aplikasi ini dibangun menggunakan arsitektur modern multi-app (Monorepo) yang memisahkan backend REST API, panel administrasi internal, dan layar display publik.

```
simanja-apps/
├── apps/
│   ├── agenda-backend/      # Laravel 11 REST API & Business Logic Server
│   ├── agenda-admin/        # React 18 + Vite Admin Control Panel (SPA)
│   └── agenda-dashboard/    # React 18 + Vite Public Display / Kiosk (SPA)
├── brief/                   # Dokumentasi Arsitektur & Analisa Sistem
├── docker-compose.yml       # Orkestrasi Container Multi-Service
└── .env                     # Global Environment Configuration
```

---

### 2. Ringkasan Ekosistem Aplikasi

| Aplikasi | Teknologi Utama | Port Default | Deskripsi & Audiens |
| :--- | :--- | :--- | :--- |
| **`agenda-backend`** | PHP 8.2+, Laravel 11, Laravel Sanctum, Spatie Permission, Google2FA, MySQL | `8102` (Docker) / `8000` (Dev) | Penyedia REST API, autentikasi berbasis Bearer token & MFA, validasi bentrok jadwal, orkestrasi database, dan audit logging. |
| **`agenda-admin`** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Axios | `8104` (Docker) / `5173` (Dev) | Portal manajemen untuk Super Admin, Admin, dan Pegawai/Unit Kerja untuk membuat agenda, mencatat notula, mengatur user/role, dan konfigurasi sistem. |
| **`agenda-dashboard`**| React 18, Vite, Tailwind CSS, Lucide Icons | `8103` (Docker) / `5173` (Dev) | Layar display publik (Kiosk/TV informasi kantor) untuk menampilkan running text pengumuman, KPI agenda bulanan, dan kalender kegiatan interaktif. |

---

### 3. Struktur Dokumen Brief

Seluruh hasil audit dan analisa dipetakan secara terstruktur ke dalam dokumen-dokumen berikut:

| Dokumen | Deskripsi Isi |
| :--- | :--- |
| **[`architecture.md`](./architecture.md)** | Arsitektur sistem, mapping Route → Controller → Service/Model → Database → View/Frontend, middleware pipeline, dan diagram arsitektur. |
| **[`business-flow.md`](./business-flow.md)** | Alur bisnis end-to-end untuk setiap modul (Auth, MFA, Agenda, Notula, Ruangan, Display Publik, Master Data, dsb). |
| **[`database.md`](./database.md)** | Struktur database lengkap, kamus data per tabel, relasi antar tabel (ERD), foreign keys, dan indeks. |
| **[`roles-permissions.md`](./roles-permissions.md)** | Hirarki role, matriks permission, mekanisme `scopeVisibleTo`, proteksi route frontend, dan manajemen hak akses. |
| **[`business-rules.md`](./business-rules.md)** | Aturan validasi bentrok pegawai/ruangan, aturan duplikasi agenda, lifecycle notula, penugasan Fasilitasi CAT, dan OTP MFA. |
| **[`issues-risks.md`](./issues-risks.md)** | Temuan bug, gap implementasi aktual vs kebutuhan, inkonsistensi skema DB, celah keamanan, dan daftar `[NEEDS CLARIFICATION]`. |

---

### 4. Konfigurasi Lingkungan & Quick Start

#### A. Database Connection
Konfigurasi database sentral terdefinisi pada root `.env` dan `apps/agenda-backend/.env`:
* **Host**: `150.165.10.107` (Remote/Staging) atau `localhost` (Local)
* **Database**: `agenda_db`
* **Driver**: `mysql`

#### B. Menjalankan via Docker Compose
```bash
docker-compose up -d --build
```

#### C. Menjalankan Manual (Development Mode)
1. **Backend (`apps/agenda-backend`)**:
   ```bash
   composer install
   php artisan migrate
   php artisan db:seed
   php artisan serve --port=8000
   ```
2. **Admin Panel (`apps/agenda-admin`)**:
   ```bash
   npm install
   npm run dev
   ```
3. **Public Dashboard (`apps/agenda-dashboard`)**:
   ```bash
   npm install
   npm run dev
   ```

---

> **Catatan Auditor**: Dokumen ini disusun tanpa melakukan perubahan pada kode sumber, struktur database, atau business logic yang ada, murni berdasarkan observasi dan analisa menyeluruh implementasi aktual.
