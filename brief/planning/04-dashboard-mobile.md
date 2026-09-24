# Perencanaan Optimasi Tampilan Responsif Dashboard Mobile

## 1. Kondisi Existing

### A. Arsitektur Layout Dashboard Saat Ini
Aplikasi display publik (`apps/agenda-dashboard`) dan halaman dashboard admin (`apps/agenda-admin/src/modules/dashboard`) menggunakan layout grid/flex dua kolom:
1. **Kolom Kiri / Atas (`TimelineSidebar.jsx` / `DashboardTimelineSidebar.jsx`)**: Menampilkan daftar agenda hari ini beserta kartu sorotan (*Highlight Card*) "Sedang Berlangsung".
2. **Kolom Kanan / Bawah (`MainCalendar.jsx` / `DashboardMainCalendar.jsx`)**: Menampilkan kalender visual interaktif bulanan/tahunan dan KPI cards.

### B. Masalah pada Tampilan Mobile (< 1280px / breakpoint `xl`)
Pada `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx` dan `TimelineSidebar.jsx`:
1. Container utama menggunakan class `h-screen overflow-hidden` secara global.
2. `TimelineSidebar` dibatasi dengan `max-h-[60vh]` dan memiliki `overflow-y-auto` mandiri, sedangkan container kalender utama di bawahnya juga memiliki `overflow-y-auto` mandiri.
3. Header sidebar memiliki class `sticky top-0 z-10`.
4. **Akibat UX**: Pada layar smartphone / tablet, pengguna mengalami *nested scrollbars* (dua area scroll terpisah dalam satu layar). Kartu highlight "Sedang Berlangsung" terasa terkunci / statis di area atas dengan tinggi kaku 60vh, sementara bagian kalender dan KPI terdorong ke bawah dan sulit di-scroll secara alami.

---

## 2. Business Rule & Sasaran Tampilan

1. **Pengalaman Scrolling Mobile Alami (Unified Page Scroll)**:
   * Pada resolusi mobile & tablet (< `xl` / < 1280px), seluruh halaman dashboard harus mengalir secara vertikal (*natural single-page scroll*).
   * Tidak boleh ada container bertinggi kaku (`max-h-[60vh]`) atau *inner scroll container* yang menjebak scroll jari pengguna.
2. **Highlight Card Bergerak Mengikuti Scroll**:
   * Kartu "Sedang Berlangsung" dan agenda hari ini berada di posisi wajar di atas kalender dan bergerak mengikuti alur scroll halaman secara dinamis (tidak fixed/statis mengunci viewport).
3. **Preservasi Layout Desktop (Zero Regression pada Desktop)**:
   * Pada resolusi desktop (`xl:` $\ge 1280\text{px}$), layout tetap berupa **Side-by-Side** (Sidebar kiri dengan scroll internal independen, Kalender kanan dengan scroll independen, dan header tetap berada di posisinya).
   * Tampilan Kiosk / TV Display kantor tidak mengalami pergeseran ukuran atau distorsi.

---

## 3. File & Komponen Terdampak

| Komponen / File | Layer | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx` | Frontend Public | Mengubah styling wrapper dari `h-screen overflow-hidden` menjadi `min-h-screen xl:h-screen xl:overflow-hidden` dan alur scroll mobile. |
| `apps/agenda-dashboard/src/components/TimelineSidebar.jsx` | Frontend Public | Menyesuaikan styling container sidebar pada mobile agar fluid tanpa `max-h-[60vh]` dan `overflow-y-auto` hanya aktif pada `xl:`. |
| `apps/agenda-admin/src/modules/dashboard/pages/DashboardPage.jsx` | Frontend Admin | Memastikan grid dashboard pada panel admin tetap responsive dan fluid pada breakpoint mobile. |
| `apps/agenda-admin/src/modules/dashboard/components/DashboardTimelineSidebar.jsx` | Frontend Admin | Menyesuaikan alur scroll sidebar admin pada tampilan mobile. |

---

## 4. Perubahan yang Diperlukan (Technical Specifications)

### A. Penyesuaian `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx`

```jsx
// SEBELUM:
<div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 ...">
  <Header ... />
  <RunningText ... />
  <div className="flex flex-col xl:flex-row flex-1 overflow-hidden relative">
    <motion.div className="flex flex-col xl:flex-row flex-1 overflow-y-auto xl:overflow-hidden w-full">
      <TimelineSidebar ... />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 scrollbar-hide w-full xl:w-auto">
        ...
      </main>
    </motion.div>
  </div>
</div>

// SESUDAH:
<div className="flex flex-col min-h-screen xl:h-screen w-full overflow-x-hidden overflow-y-auto xl:overflow-hidden bg-slate-100 dark:bg-slate-950 ...">
  <Header ... />
  <RunningText ... />
  <div className="flex flex-col xl:flex-row flex-1 xl:overflow-hidden relative">
    <motion.div className="flex flex-col xl:flex-row flex-1 w-full">
      <TimelineSidebar ... />
      <main className="flex-1 px-4 md:px-6 py-4 md:py-5 w-full xl:w-auto xl:overflow-y-auto scrollbar-hide">
        ...
      </main>
    </motion.div>
  </div>
</div>
```

### B. Penyesuaian `apps/agenda-dashboard/src/components/TimelineSidebar.jsx`

```jsx
// SEBELUM:
<div className="w-full xl:w-80 2xl:w-96 bg-slate-50 dark:bg-slate-900/50 border-t xl:border-t-0 xl:border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0 max-h-[60vh] xl:max-h-none">
  <div className="px-6 py-5 border-b ... sticky top-0 z-10 ...">
    ...
  </div>
  <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
    {/* Highlight card & timeline items */}
  </div>
</div>

// SESUDAH:
<div className="w-full xl:w-80 2xl:w-96 bg-slate-50 dark:bg-slate-900/50 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/80 xl:sticky xl:top-0 z-10 backdrop-blur-md">
    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Agenda Hari Ini</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Anda memiliki {todayEvents.length} agenda dijadwalkan</p>
  </div>
  
  <div className="p-6 xl:flex-1 xl:overflow-y-auto scrollbar-hide">
    {/* Highlight Card & Timeline items render secara fluid di mobile */}
  </div>
</div>
```

---

## 5. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Perubahan CSS merusak tampilan Full HD / 4K Kiosk Display. | Tampilan TV display kantor menjadi rusak atau muncul scrollbar ganda. | Batasi seluruh perubahan viewport mobile dengan utility prefix Tailwind (`xl:h-screen`, `xl:overflow-hidden`, `xl:overflow-y-auto`). Mode desktop tidak disentuh selain penegasan prefix `xl:`. |
| Header dan Running Text ikut ter-scroll hilang di mobile. | Header menghilang saat pengguna scroll jauh ke bawah. | Header dan Running text dapat diatur `sticky top-0 z-30` atau dibiarkan di posisi teratas halaman sesuai preferensi kenyamanan membaca di mobile. |

---

## 6. Urutan Implementasi

1. **Tahap 1**: Refactor class Tailwind pada `DashboardLayout.jsx` di `agenda-dashboard` untuk membedakan alur scroll mobile vs desktop (`xl:`).
2. **Tahap 2**: Refactor class Tailwind pada `TimelineSidebar.jsx` (hilangkan `max-h-[60vh]`, sesuaikan `sticky` hanya pada breakpoint `xl`).
3. **Tahap 3**: Periksa dan selaraskan `DashboardPage.jsx` & `DashboardTimelineSidebar.jsx` pada `agenda-admin`.
4. **Tahap 4**: Pengujian multi-resolusi (Mobile 375px, Tablet 768px, Laptop 1366px, Kiosk 1920px).

---

## 7. Testing yang Diperlukan

* [x] **Mobile Device Simulation (375px - 425px - iPhone/Android)**:
  * Buka halaman public dashboard di browser mobile view.
  * Lakukan gesture scroll dari atas ke bawah.
  * Pastikan seluruh halaman mengalir lancar dalam 1 scrollbar browser.
  * Pastikan Highlight Card "Sedang Berlangsung" bergerak secara alami saat di-scroll dan tidak fixed/statis menutupi konten lain.
* [x] **Tablet Simulation (768px - iPad/Tablet)**:
  * Pastikan layout tersusun rapi secara vertikal tanpa overlap.
* [x] **Desktop & Kiosk Simulation ($\ge 1280\text{px}$ & $1920\text{px}$)**:
  * Pastikan layout desktop tetap split 2 kolom kiri-kanan.
  * Pastikan tinggi dashboard tetap pas 1 layar (`h-screen`) tanpa scrollbar browser luar yang bocor.
  * Pastikan sidebar kiri dan kalender kanan dapat di-scroll secara independen jika konten melebihi tinggi layar.
