import {
  Building2,
  FileStack,
  FolderKanban,
  Layers3,
  MapPinned,
  UsersRound,
} from 'lucide-react';

export const masterDataModules = [
  {
    id: 'kategori-agenda',
    code: 'KAT',
    title: 'Kategori Agenda',
    shortTitle: 'Kategori',
    description: 'Kelola jenis kegiatan yang dipakai saat admin dan unit membuat agenda baru.',
    accent: 'text-blue-600 dark:text-blue-300',
    icon: FolderKanban,
    theme: 'from-blue-500/20 via-sky-500/10 to-cyan-400/10',
    addLabel: 'Tambah Kategori',
    searchPlaceholder: 'Cari nama kategori, kode...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Sekretariat Agenda' },
  },
  {
    id: 'lokasi-kegiatan',
    code: 'LOK',
    title: 'Lokasi Kegiatan',
    shortTitle: 'Lokasi',
    description: 'Susun daftar ruangan, aula, dan area kegiatan yang bisa dipilih lintas unit kerja.',
    accent: 'text-emerald-600 dark:text-emerald-300',
    icon: MapPinned,
    theme: 'from-emerald-500/20 via-green-500/10 to-lime-400/10',
    addLabel: 'Tambah Lokasi',
    searchPlaceholder: 'Cari lokasi, kode, atau kapasitas...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Rumah Tangga' },
  },
  {
    id: 'divisi-unit',
    code: 'DIV',
    title: 'Divisi & Unit Kerja',
    shortTitle: 'Divisi',
    description: 'Jaga konsistensi unit kerja yang tampil di agenda, filter laporan, dan approval.',
    accent: 'text-violet-600 dark:text-violet-300',
    icon: Building2,
    theme: 'from-violet-500/20 via-fuchsia-500/10 to-indigo-400/10',
    addLabel: 'Tambah Divisi',
    searchPlaceholder: 'Cari unit kerja atau kode...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Kepegawaian' },
  },
  {
    id: 'template-surat',
    code: 'TPL',
    title: 'Template Surat Tugas',
    shortTitle: 'Template',
    description: 'Sediakan template aktif agar proses administrasi agenda lebih cepat dan seragam.',
    accent: 'text-amber-600 dark:text-amber-300',
    icon: FileStack,
    theme: 'from-amber-500/20 via-orange-500/10 to-yellow-400/10',
    addLabel: 'Tambah Template',
    searchPlaceholder: 'Cari nama template atau kode...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Administrasi Umum' },
  },
  {
    id: 'prioritas-agenda',
    code: 'PRI',
    title: 'Prioritas Agenda',
    shortTitle: 'Prioritas',
    description: 'Atur level prioritas supaya dashboard, reminder, dan approval lebih terarah.',
    accent: 'text-rose-600 dark:text-rose-300',
    icon: Layers3,
    theme: 'from-rose-500/20 via-red-500/10 to-orange-400/10',
    addLabel: 'Tambah Prioritas',
    searchPlaceholder: 'Cari label prioritas atau kode...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Admin Sistem' },
  },
  {
    id: 'master-pegawai',
    code: 'PEG',
    title: 'Master Pegawai',
    shortTitle: 'Pegawai',
    description: 'Kelola referensi data pegawai untuk kebutuhan partisipan, penugasan, dan approval.',
    accent: 'text-cyan-600 dark:text-cyan-300',
    icon: UsersRound,
    theme: 'from-cyan-500/20 via-sky-500/10 to-blue-400/10',
    addLabel: 'Tambah Pegawai',
    searchPlaceholder: 'Cari nama, NIK, atau posisi...',
    stats: { total: 0, active: 0, draft: 0, owner: 'Kepegawaian' },
  },
];

export const formatMasterDataDate = (dateValue) => {
  if (!dateValue) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateValue));
  } catch (e) {
    return dateValue;
  }
};
