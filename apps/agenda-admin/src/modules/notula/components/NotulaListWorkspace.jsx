import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, FileText, User, Filter, ArrowRight, X, Check, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button, { cn } from '../../../components/ui/Button';
import NotulaListWorkspaceSkeleton from './NotulaListWorkspaceSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { useNotulaList, useAgendaList } from '../hooks/useNotula';
import { createNotula, deleteNotula } from '../../../api/notulaApi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { confirmDialog } from '../../../utils/sweetalert';

const statusConfig = {
  'Selesai': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    indicator: 'bg-emerald-500',
  },
  'Menunggu Review': {
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    indicator: 'bg-amber-500',
  },
  'Draft': {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    indicator: 'bg-slate-400',
  },
};

const NotulaListWorkspace = () => {
  const navigate = useNavigate();
  const { notulas, isLoading, fetchNotulas } = useNotulaList();
  const { agendas, isLoading: isLoadingAgendas } = useAgendaList();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('Semua');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  const [manualTitle, setManualTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotulas({
        search: searchQuery,
        status: activeStatusFilter === 'Semua' ? '' : activeStatusFilter,
        start_date: startDate ? startDate.toISOString().split('T')[0] : '',
        end_date: endDate ? endDate.toISOString().split('T')[0] : '',
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeStatusFilter, startDate, endDate, fetchNotulas]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgenda) return;

    let payload = {};
    if (selectedAgenda.value === 'LAINNYA') {
        if (!manualTitle.trim()) {
            toast.error('Judul agenda wajib diisi');
            return;
        }
        payload = { title: manualTitle };
    } else {
        payload = { trx_agenda_id: selectedAgenda.value };
    }

    setIsSubmitting(true);
    try {
        const res = await createNotula(payload);
        setIsModalOpen(false);
        navigate(`/admin/notula/detail/${res.data.uid}`);
    } catch (err) {
        toast.error('Gagal membuat notula baru');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (uid) => {
    const result = await confirmDialog({
      title: 'Hapus notula ini?',
      text: 'Data notula akan dihapus dari sistem secara permanen.',
      confirmButtonText: 'Ya, hapus'
    });

    if (result.isConfirmed) {
      try {
        await deleteNotula(uid);
        toast.success('Notula berhasil dihapus');
        fetchNotulas();
      } catch (err) {
        toast.error('Gagal menghapus notula');
      }
    }
  };

  const agendaOptions = [
      ...agendas
        .filter(a => !a.has_notula)
        .filter(a => {
            const title = (a.title || '').toLowerCase();
            const desc = (a.description || '').toLowerCase();
            
            return true;
        })
        .map(a => ({ value: a.id, label: a.title })),
      { value: 'LAINNYA', label: 'Lainnya (Tulis Manual)...' }
  ];

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            Notula Rapat
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
            Kelola, rekam, dan publikasikan notulensi agenda rapat instansi.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari notula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-[1em] border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          
          <Button 
            variant="secondary" 
            onClick={() => fetchNotulas({
              search: searchQuery,
              status: activeStatusFilter === 'Semua' ? '' : activeStatusFilter,
              start_date: startDate ? startDate.toISOString().split('T')[0] : '',
              end_date: endDate ? endDate.toISOString().split('T')[0] : '',
            })}
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800",
              isFilterOpen && "bg-slate-200 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700"
            )}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </section>

      {/* Action Banner */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-[1.25em] border-2 border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Catat Agenda Baru</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Buat dokumen notulensi rapat baru untuk mencatat hasil pertemuan secara real-time.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setSelectedAgenda(null);
            setManualTitle('');
            setIsModalOpen(true);
          }}
          className="cursor-pointer shrink-0 gap-2 rounded-[1em] px-6 py-2.5 shadow-sm"
        >
          <Plus size={16} />
          Buat Notula Baru
        </Button>
      </section>

      {/* Animated Filter Panel */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isFilterOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Pencarian</h3>
            <button onClick={() => { setActiveStatusFilter('Semua'); setSearchQuery(''); setStartDate(null); setEndDate(null); }} className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Reset Semua</button>
          </div>
          
          <div className="flex flex-col gap-6 md:flex-row md:items-start lg:gap-10">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">Status Notula</label>
              <div className="flex flex-wrap gap-2">
                {['Semua', 'Selesai', 'Menunggu Review', 'Draft'].map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveStatusFilter(status)}
                    className={cn(
                      "cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      activeStatusFilter === status 
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-400" 
                        : "border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                  >
                    {activeStatusFilter === status && <Check size={12} />}
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="shrink-0">
              <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">Rentang Tanggal</label>
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <DatePicker 
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className="cursor-pointer w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                />
                <span className="text-slate-400">-</span>
                <DatePicker 
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className="cursor-pointer w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <NotulaListWorkspaceSkeleton />
      ) : notulas.length > 0 ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {notulas.map((notula, index) => {
            const statusStyle = statusConfig[notula.status] || statusConfig['Draft'];
            const formattedDate = new Date(notula.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            const formattedTime = new Date(notula.date).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={notula.uid}
                onClick={() => navigate(`/admin/notula/detail/${notula.uid}`)}
                className="group relative cursor-pointer overflow-hidden rounded-[1.25em] bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:bg-blue-50/60 hover:shadow-md hover:ring-blue-100 active:translate-y-0 dark:bg-slate-900 dark:ring-slate-800/80 dark:hover:bg-slate-800/80 dark:hover:ring-blue-900/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide', statusStyle.badge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.indicator)} />
                    {notula.status.toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notula.uid);
                    }}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[0.7em] bg-red-50 text-red-500 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                    title="Hapus Notula"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {notula.title}
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <Calendar size={15} className="text-slate-400 transition duration-200 group-hover:-rotate-6 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span>{formattedDate} • {formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <User size={15} className="text-slate-400 transition duration-200 group-hover:-rotate-6 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span>{notula.author}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <FileText size={15} className="text-slate-400 transition duration-200 group-hover:-rotate-6 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span>{notula.participants} Peserta Tercatat</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                    Buka Editor
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </section>
      ) : (
        <EmptyState 
          title="Tidak ada notula ditemukan" 
          description="Ubah kata kunci pencarian atau reset filter untuk melihat data lain." 
          className="min-h-[400px] rounded-[1.25em] border border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20"
        />
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/80 animate-modal-overlay">
          <div className="w-full max-w-md overflow-hidden rounded-[1.25em] bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Buat Notula Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Pilih Agenda Rapat
                  </label>
                  <Select 
                    options={agendaOptions}
                    value={selectedAgenda}
                    onChange={(option) => setSelectedAgenda(option)}
                    placeholder="Pilih atau cari agenda..."
                    isLoading={isLoadingAgendas}
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '1em',
                        borderColor: '#e2e8f0',
                        padding: '2px',
                        boxShadow: 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#cbd5e1'
                        }
                      }),
                      option: (base) => ({
                        ...base,
                        cursor: 'pointer'
                      })
                    }}
                  />
                </div>
                
                {selectedAgenda && selectedAgenda.value === 'LAINNYA' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                      Judul Rapat / Agenda Baru
                    </label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Contoh: Rapat Evaluasi Bulanan..."
                      autoFocus
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-[1em]"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={!selectedAgenda || isSubmitting || (selectedAgenda.value === 'LAINNYA' && !manualTitle.trim())}
                  className="cursor-pointer rounded-[1em] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Menyimpan...
                    </>
                  ) : (
                    'Mulai Tulis Notula'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotulaListWorkspace;
