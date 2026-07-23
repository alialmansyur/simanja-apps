import React from 'react';
import { CalendarDays, Clock3, MapPinned, SplitSquareVertical } from 'lucide-react';
import FeaturePageShell from '../../../layouts/FeaturePageShell';

const CalendarPage = () => (
  <FeaturePageShell
    eyebrow="Visualisasi jadwal"
    title="Kalender Agenda"
    description="Tampilan kalender operasional untuk memantau jadwal harian, mingguan, dan bulanan sekaligus mendeteksi bentrok ruangan, waktu, dan divisi."
    primaryAction="Lihat agenda per minggu"
    secondaryAction="Atur filter lokasi dan divisi"
    metrics={[
      { label: 'Agenda hari ini', value: '24', caption: 'Tersebar di beberapa unit dan ruangan.', icon: CalendarDays, theme: 'blue' },
      { label: 'Slot bentrok', value: '3', caption: 'Butuh penyesuaian waktu atau ruangan.', icon: SplitSquareVertical, theme: 'amber' },
      { label: 'Rata-rata durasi', value: '02:15', caption: 'Durasi kegiatan dalam format jam:menit.', icon: Clock3, theme: 'violet' },
      { label: 'Lokasi aktif', value: '11', caption: 'Ruangan yang dipakai pada rentang terpilih.', icon: MapPinned, theme: 'emerald' },
    ]}
    priorities={[
      'Sediakan view month, week, dan day seperti pada dashboard publik namun dengan kontrol admin.',
      'Tambahkan drag-and-drop reschedule beserta konfirmasi perubahan.',
      'Tampilkan indikator bentrok jadwal antar ruangan dan PIC.',
      'Hubungkan quick create agenda langsung dari slot kalender.',
    ]}
    checklist={[
      'Sinkronisasi data kalender dengan modul agenda.',
      'Filter berdasarkan status, lokasi, PIC, dan unit.',
      'Highlight agenda yang belum published atau belum approved.',
      'Navigasi cepat ke detail agenda dari event card.',
    ]}
  />
);

export default CalendarPage;
