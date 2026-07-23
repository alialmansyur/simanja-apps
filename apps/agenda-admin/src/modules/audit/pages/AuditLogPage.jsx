import React from 'react';
import { Activity, Eye, ScrollText, ShieldAlert } from 'lucide-react';
import FeaturePageShell from '../../../layouts/FeaturePageShell';

const AuditLogPage = () => (
  <FeaturePageShell
    eyebrow="Keamanan & histori"
    title="Audit Log"
    description="Jejak aktivitas sistem untuk memantau perubahan agenda, perubahan permission, login admin, tindakan approval, dan aktivitas sensitif lainnya."
    primaryAction="Telusuri aktivitas terbaru"
    secondaryAction="Filter perubahan sensitif"
    metrics={[
      { label: 'Event tercatat', value: '8,492', caption: 'Total log aktivitas yang siap diaudit.', icon: Activity, theme: 'blue' },
      { label: 'Aksi sensitif', value: '36', caption: 'Perubahan penting dalam 7 hari terakhir.', icon: ShieldAlert, theme: 'amber' },
      { label: 'Log ditinjau', value: '91%', caption: 'Persentase log yang sudah tervalidasi admin.', icon: Eye, theme: 'emerald' },
      { label: 'Modul tercover', value: '10', caption: 'Target modul yang harus menulis audit trail.', icon: ScrollText, theme: 'violet' },
    ]}
    priorities={[
      'Bangun tabel audit dengan filter user, modul, aksi, dan rentang tanggal.',
      'Tampilkan before/after untuk perubahan field penting.',
      'Tambahkan penanda untuk aksi berisiko tinggi seperti delete, publish, dan permission update.',
      'Buat ekspor audit khusus untuk kebutuhan investigasi internal.',
    ]}
    checklist={[
      'Audit login, logout, CRUD, approval, dan publish.',
      'Filter lanjutan berdasarkan user atau modul.',
      'Detail perubahan before/after.',
      'Proteksi akses hanya untuk role tertentu.',
    ]}
  />
);

export default AuditLogPage;
