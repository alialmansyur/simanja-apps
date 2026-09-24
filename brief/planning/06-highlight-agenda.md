# Penyesuaian Logika Highlight "Agenda Sedang Berlangsung"

## 1. Kondisi Existing

### A. Lokasi Kode Implementasi
1. **Public Dashboard Sidebar**:
   * File: `apps/agenda-dashboard/src/components/TimelineSidebar.jsx` (baris 45-57)
   ```javascript
   const now = new Date();
   const todayEvents = events
     .filter(e => {
       const today = moment(now).startOf('day');
       const eventStart = moment(e.start).startOf('day');
       const eventEnd = moment(e.end).startOf('day');
       return today.isBetween(eventStart, eventEnd, 'day', '[]');
     })
     .sort((a, b) => a.start - b.start);

   const currentEvent = todayEvents.find(ev => now >= ev.start && now <= ev.end);
   ```
2. **Admin Dashboard Sidebar**:
   * File: `apps/agenda-admin/src/modules/dashboard/components/DashboardTimelineSidebar.jsx` (baris 44-55)

### B. Analisa Logika & Gap Saat Ini
1. **Penyaringan `todayEvents`**:
   * Penyaringan `today.isBetween(eventStart, eventEnd, 'day', '[]')` sudah menyertakan agenda multi-day pada daftar list hari ini.
2. **Penentuan `currentEvent` (Highlight Card)**:
   * Rumus `now >= ev.start && now <= ev.end` membandingkan timestamp penuh (Tanggal + Jam).
   * **Untuk Agenda Multi-Day**:
     * Misal: Agenda berlangsung 24 Sept 08:00 WIB s.d. 26 Sept 16:00 WIB.
     * `ev.start` = `2026-09-24 08:00:00`, `ev.end` = `2026-09-26 16:00:00`.
     * Pada tanggal 25 Sept jam 10:00 WIB: `now` (`2026-09-25 10:00:00`) berada di antara `2026-09-24 08:00:00` dan `2026-09-26 16:00:00`, sehingga terdeteksi sebagai `currentEvent`.
     * **Namun pada malam hari di luar jam kerja (misal 24 Sept jam 22:00 WIB)**:
       Karena `ev.end` adalah 26 Sept 16:00 WIB, timestamp 24 Sept jam 22:00 secara matematis masih `< ev.end`. Ini dapat menyebabkan kartu "Sedang Berlangsung" tetap menyala di tengah malam jika tidak menerapkan batas jam harian (*daily operational window*).
3. **Penampilan Jam pada Highlight Card**:
   * Saat ini kartu menampilkan `{moment(currentEvent.start).format('HH:mm')} - {moment(currentEvent.end).format('HH:mm')}`.
   * Pada agenda multi-day, jika jam mulai dan jam selesai harian adalah `08:00 - 16:00`, format tampilan harus menyajikan jam kegiatan harian tersebut secara konsisten (mengambil dari `start_time_raw` / `end_time_raw`).

---

## 2. Business Rule

1. **Definisi "Sedang Berlangsung" (Active / Ongoing)**:
   Agenda berstatus "Sedang Berlangsung" dan berhak ditampilkan pada Kartu Sorotan Utama (*Highlight Card*) jika dan hanya jika:
   $$\text{Tanggal Sekarang } \in [\text{start\_date}, \text{end\_date}] \quad \text{DAN} \quad \text{Waktu Sekarang } \in [\text{start\_time}, \text{end\_time}]$$
   *Atau* jika agenda adalah *continuous full-day event*, waktu sekarang berada dalam rentang timestamp keseluruhan.
2. **Prioritas Highlight**:
   * Jika ada lebih dari satu agenda yang sedang berlangsung di jam yang sama, sistem memilih agenda dengan prioritas kategori tertinggi (e.g. *Fasilitasi CAT* / *Rapat*) atau agenda terdekat yang dimulai lebih awal.
3. **Perilaku Status Timeline Item**:
   * **Sedang Berlangsung (`isCurrent = true`)**: Ditandai dengan dot biru berkedip (*ping animation*), badge biru, dan kartu highlight menyala.
   * **Telah Selesai (`isPast = true`)**: Ditandai dengan teks coret (*strikethrough*) dan warna muted slate jika jam selesai pada hari tersebut telah lewat (`currentTime > event.end_time`).
   * **Akan Datang (`isUpcoming = true`)**: Ditandai dengan warna normal/terang.

---

## 3. File & Komponen Terdampak

| Komponen / File | Layer | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `apps/agenda-dashboard/src/components/TimelineSidebar.jsx` | Frontend Public | Memperbarui formula evaluasi `currentEvent` dan formatting jam kartu highlight. |
| `apps/agenda-admin/src/modules/dashboard/components/DashboardTimelineSidebar.jsx` | Frontend Admin | Memperbarui formula evaluasi `currentEvent` dan formatting jam kartu highlight di panel admin. |
| `apps/agenda-backend/app/Http/Controllers/Api/PublicDashboardController.php` | Backend Controller | Memastikan `start_time_raw` dan `end_time_raw` selalu terkirim dalam format `H:i:s`. |

---

## 4. Perubahan yang Diperlukan (Technical Specifications)

### Refactor Logika Evaluasi `TimelineSidebar.jsx`

```javascript
const isEventOngoingNow = (event, now) => {
  if (!event) return false;
  
  // 1. Validasi Rentang Tanggal (Hari ini dalam [start_date, end_date])
  const todayStr = moment(now).format('YYYY-MM-DD');
  const startDateStr = event.start_date_raw || moment(event.start).format('YYYY-MM-DD');
  const endDateStr = event.end_date_raw || moment(event.end).format('YYYY-MM-DD');

  if (todayStr < startDateStr || todayStr > endDateStr) {
    return false;
  }

  // 2. Validasi Jam Operasional Harian
  const currentTimeStr = moment(now).format('HH:mm:ss');
  const startTimeStr = event.start_time_raw || moment(event.start).format('HH:mm:ss');
  const endTimeStr = event.end_time_raw || moment(event.end).format('HH:mm:ss');

  // Jika waktu kosong / full-day default
  if (!startTimeStr || !endTimeStr) {
    return true;
  }

  return currentTimeStr >= startTimeStr && currentTimeStr <= endTimeStr;
};

const isEventPastToday = (event, now) => {
  const todayStr = moment(now).format('YYYY-MM-DD');
  const endDateStr = event.end_date_raw || moment(event.end).format('YYYY-MM-DD');
  
  if (todayStr > endDateStr) return true;
  if (todayStr < endDateStr) return false; // Masih ada hari esok
  
  // Hari ini adalah hari terakhir / hari H
  const currentTimeStr = moment(now).format('HH:mm:ss');
  const endTimeStr = event.end_time_raw || moment(event.end).format('HH:mm:ss');
  return currentTimeStr > endTimeStr;
};
```

Pada rendering Highlight Card:
```jsx
{currentEvent && (
  <div 
    onClick={() => onEventClick(currentEvent)}
    className="mb-8 p-6 rounded-2xl bg-blue-600 text-white border border-blue-500 cursor-pointer hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-blue-500/20"
  >
    <div className="flex items-center space-x-2.5 mb-3 relative z-10">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Sedang Berlangsung</span>
    </div>
    
    <div className="text-4xl font-black mb-2 tracking-tighter relative z-10">
      {currentEvent.start_time_raw ? currentEvent.start_time_raw.substring(0, 5) : moment(currentEvent.start).format('HH:mm')}
      <span className="text-2xl text-blue-300 font-bold mx-1">-</span>
      {currentEvent.end_time_raw ? currentEvent.end_time_raw.substring(0, 5) : moment(currentEvent.end).format('HH:mm')}
      <span className="text-sm font-semibold text-blue-200 ml-1.5">WIB</span>
    </div>
    <div className="font-bold text-lg text-white leading-tight mb-3 relative z-10">
      {currentEvent.title}
    </div>
    <div className="flex items-center text-sm text-blue-100 font-medium relative z-10">
      <MapPin size={14} className="mr-1.5 shrink-0" />
      <span className="truncate">{currentEvent.location}</span>
    </div>
  </div>
)}
```

---

## 5. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Agenda lintas tengah malam (misal: 23:00 s.d 02:00). | Salah evaluasi jika perbandingan waktu harian mengasumsikan `start < end`. | Tangani kondisi `endTime < startTime` sebagai *cross-midnight event* atau gunakan timestamp absolut. Mayoritas agenda kantor Kanreg berada pada rentang kerja normal (07:00 - 18:00). |
| Real-time update tanpa refresh halaman. | Status kartu tidak berubah saat jam berganti dari 07:59 ke 08:00. | Gunakan interval timer lokal (misal: `setInterval` setiap 30-60 detik) untuk memicu re-render `now = new Date()` sehingga highlight otomatis menyala/mati tepat waktu. |

---

## 6. Urutan Implementasi

1. **Tahap 1**: Tambahkan helper fungsi `isEventOngoingNow` dan `isEventPastToday` pada `TimelineSidebar.jsx`.
2. **Tahap 2**: Terapkan interval update waktu lokal (re-render per menit) pada komponen Sidebar.
3. **Tahap 3**: Selaraskan pada `DashboardTimelineSidebar.jsx` di `agenda-admin`.
4. **Tahap 4**: Uji coba skenario berbagai jam (sebelum mulai, sedang berlangsung hari 1, sedang berlangsung hari 2, setelah selesai).

---

## 7. Testing yang Diperlukan

* [x] **Test 1 (Sebelum Jam Mulai)**:
  Agenda 24 Sept 09:00 - 11:00, jam sistem 08:30.
  $\rightarrow$ Highlight Card **TIDAK MUNCUL**, item berstatus Upcoming.
* [x] **Test 2 (Tepat Jam Berlangsung Hari ke-1)**:
  Agenda 24 - 26 Sept 08:00 - 16:00, jam sistem 24 Sept 10:00.
  $\rightarrow$ Highlight Card **MUNCUL (Sedang Berlangsung)**.
* [x] **Test 3 (Tepat Jam Berlangsung Hari ke-2)**:
  Agenda 24 - 26 Sept 08:00 - 16:00, jam sistem 25 Sept 13:00.
  $\rightarrow$ Highlight Card **MUNCUL (Sedang Berlangsung)**.
* [x] **Test 4 (Di Luar Jam Kerja pada Hari ke-2)**:
  Agenda 24 - 26 Sept 08:00 - 16:00, jam sistem 25 Sept 19:00.
  $\rightarrow$ Highlight Card **TIDAK MUNCUL**, item berstatus Past untuk hari itu.
* [x] **Test 5 (Setelah Tanggal Selesai)**:
  Agenda 24 - 26 Sept, jam sistem 27 Sept.
  $\rightarrow$ Tidak muncul dalam agenda hari ini.
