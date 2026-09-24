# Penyesuaian Logika Running Text Agenda Multi-Day

## 1. Kondisi Existing

### A. Lokasi Kode Implementasi
1. **Public Dashboard Display**:
   * File: `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx` (baris 89-114)
   * Potongan kode existing:
     ```javascript
     if (events && events.length > 0) {
         const todaysAgendas = events.filter(event => isToday(new Date(event.start)));
         if (todaysAgendas.length > 0) {
             messages.push(`Agenda Hari Ini: ${todaysAgendas.map(a => `${a.title} (${format(new Date(a.start), 'HH:mm', {locale: id})})`).join(', ')}`);
         } else {
             messages.push('Tidak ada agenda yang terjadwal untuk hari ini.');
         }
     }
     ```
2. **Admin Dashboard**:
   * File: `apps/agenda-admin/src/modules/dashboard/pages/DashboardPage.jsx` (baris 18-41)
   * Menggunakan `isWithinInterval(today, { start, end })` dari `date-fns`.

### B. Masalah & Gap Fungsional
* Pada `agenda-dashboard`, penyaringan agenda hari ini menggunakan fungsi `isToday(new Date(event.start))`.
* **Dampak**: Agenda yang memiliki durasi beberapa hari (multi-day agenda, contoh: 24 s.d. 26 September 2026) **hanya akan muncul pada tanggal 24 September**. Pada tanggal 25 dan 26 September, `isToday(start)` bernilai `false`, sehingga agenda tersebut lenyap dari teks berjalan (*running text*), menyebabkan informasi kegiatan tidak sampai ke audiens/pegawai.

---

## 2. Business Rule

1. **Aturan Tampilan Periode Multi-Day**:
   $$\text{Agenda Tampil pada Tanggal } T \iff \text{start\_date} \le T \le \text{end\_date}$$
   Setiap agenda aktif yang sedang berada dalam rentang tanggal pelaksanaannya (`start_date` sampai dengan `end_date`) **wajib ditampilkan** pada teks berjalan (*running text*) sepanjang periode tersebut.
2. **Contoh Kasus**:
   * **Agenda**: Pelaksanaan Seleksi PPPK BGN
   * **Start Date**: 24 September 2026, 08:00 WIB
   * **End Date**: 26 September 2026, 16:00 WIB
   * **Hasil yang Diharapkan**:
     * Pada 24 September 2026: **TAMPIL** di Running Text.
     * Pada 25 September 2026: **TAMPIL** di Running Text.
     * Pada 26 September 2026: **TAMPIL** di Running Text.
     * Pada 27 September 2026: **TIDAK TAMPIL** (sudah selesai).
3. **Format Label Waktu pada Running Text**:
   * Jika agenda berdurasi single-day: Tampilkan format jam kegiatan (e.g. `Rapat Evaluasi (09:00 WIB)`).
   * Jika agenda multi-day: Tampilkan jam harian atau penanda rentang (e.g. `Fasilitasi CAT (08:00 - 16:00 WIB)`).

---

## 3. File & Komponen Terdampak

| Komponen / File | Layer | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx` | Frontend Public | Mengubah filter `events.filter(...)` pada `runningTextMessages` dari `isToday(event.start)` menjadi evaluasi rentang tanggal aktif `[start, end]`. |
| `apps/agenda-admin/src/modules/dashboard/pages/DashboardPage.jsx` | Frontend Admin | Memastikan konsistensi penanganan waktu multi-day dan format teks berjalan di admin. |
| `apps/agenda-backend/app/Http/Controllers/Api/PublicDashboardController.php` | Backend Controller | Memastikan endpoint `events()` menyediakan field `start`, `end`, `start_date_raw`, dan `end_date_raw` secara lengkap. |

---

## 4. Perubahan yang Diperlukan (Technical Specifications)

### A. Refactor pada `apps/agenda-dashboard/src/layouts/DashboardLayout.jsx`

Gunakan perbandingan `moment` atau `date-fns` `startOfDay` yang mencakup rentang inklusif:

```javascript
const runningTextMessages = useMemo(() => {
  const messages = [];
  
  if (settings && settings['dashboard.running_text']) {
    messages.push(settings['dashboard.running_text']);
  }

  if (events && events.length > 0) {
    const today = moment().startOf('day');

    const todaysAgendas = events.filter(event => {
      if (!event.start) return false;
      const eventStart = moment(event.start).startOf('day');
      const eventEnd = moment(event.end || event.start).startOf('day');
      // Inklusif: hari ini >= tanggal mulai DAN hari ini <= tanggal selesai
      return today.isBetween(eventStart, eventEnd, 'day', '[]');
    });

    if (todaysAgendas.length > 0) {
      const agendaDescriptions = todaysAgendas.map(a => {
        const startTimeStr = a.start_time_raw 
          ? a.start_time_raw.substring(0, 5) 
          : moment(a.start).format('HH:mm');
        const endTimeStr = a.end_time_raw 
          ? a.end_time_raw.substring(0, 5) 
          : moment(a.end).format('HH:mm');
          
        const timeDisplay = (startTimeStr && endTimeStr && startTimeStr !== '00:00' && endTimeStr !== '23:59')
          ? ` (${startTimeStr} - ${endTimeStr} WIB)`
          : '';

        return `${a.title}${timeDisplay}`;
      });

      messages.push(`Agenda Hari Ini: ${agendaDescriptions.join(' • ')}`);
    } else {
      messages.push('Tidak ada agenda yang terjadwal untuk hari ini.');
    }
  }

  if (announcements && announcements.length > 0) {
    if (typeof announcements[0] === 'string') {
      messages.push(...announcements);
    } else if (announcements[0].title) {
      messages.push(...announcements.map(a => a.title));
    }
  }

  return messages.length > 0 ? messages : ['Selamat datang di Aplikasi Agenda.'];
}, [settings, events, announcements]);
```

---

## 5. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Perbedaan Timezone antara Client Browser dan Server. | Tanggal terdeteksi maju/mundur 1 hari pada pergantian tengah malam. | Gunakan normalisasi string tanggal `YYYY-MM-DD` atau `startOf('day')` pada timezone lokal browser. |
| Jumlah teks agenda hari ini sangat panjang jika ada banyak event bersamaan. | Running text terlalu lama untuk berputar 1 siklus. | Pisahkan daftar agenda dengan bullet separator ` • ` yang jelas dan atur kecepatan animasi marquee (`speed` prop pada `RunningText.jsx`) agar tetap nyaman dibaca. |

---

## 6. Urutan Implementasi

1. **Tahap 1**: Update fungsi `useMemo` `runningTextMessages` pada `DashboardLayout.jsx` di `agenda-dashboard`.
2. **Tahap 2**: Validasi keselarasan pada `DashboardPage.jsx` di `agenda-admin`.
3. **Tahap 3**: Buat agenda simulasi 3 hari (Start: Kemarin, End: Besok).
4. **Tahap 4**: Verifikasi running text menampilkan agenda tersebut pada hari ini.

---

## 7. Testing yang Diperlukan

* [x] **Test Kasus 1 (Agenda Single-Day Hari Ini)**:
  Agenda 24 Sept 2026 (09:00 - 11:00).
  $\rightarrow$ **Berhasil Muncul pada 24 Sept 2026**.
* [x] **Test Kasus 2 (Agenda Multi-Day Hari Pertama)**:
  Agenda 24 - 26 Sept 2026.
  $\rightarrow$ **Berhasil Muncul pada 24 Sept 2026**.
* [x] **Test Kasus 3 (Agenda Multi-Day Hari Tengah / Kedua)**:
  Agenda 24 - 26 Sept 2026, tanggal sistem disimulasikan 25 Sept 2026.
  $\rightarrow$ **Berhasil Muncul pada 25 Sept 2026**.
* [x] **Test Kasus 4 (Agenda Multi-Day Hari Terakhir / Ketiga)**:
  Agenda 24 - 26 Sept 2026, tanggal sistem disimulasikan 26 Sept 2026.
  $\rightarrow$ **Berhasil Muncul pada 26 Sept 2026**.
* [x] **Test Kasus 5 (Agenda Sudah Lewat / Kedaluwarsa)**:
  Agenda 20 - 22 Sept 2026, tanggal sistem 24 Sept 2026.
  $\rightarrow$ **Tidak Muncul di Running Text**.
