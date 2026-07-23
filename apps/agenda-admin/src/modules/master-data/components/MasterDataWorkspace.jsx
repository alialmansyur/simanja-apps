import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { confirmDialog } from '../../../utils/sweetalert';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  ChevronsUpDown,
  Eye,
  FileDown,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UsersRound,
  X,
  Loader2,
  Building2,
} from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import {
  formatMasterDataDate,
  masterDataModules,
} from '../data/masterDataCatalog';
import { useMasterData } from '../../../hooks/useMasterData';
import MasterDataWorkspaceSkeleton from './MasterDataWorkspaceSkeleton';
import DataTablePagination from '../../../components/ui/DataTablePagination';
import EmptyState from '../../../components/ui/EmptyState';

const statusTone = {
  Aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Nonaktif: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const createInitialForm = (module) => {
  const base = {
    code: '',
    name: '',
    scope: '',
    status: 'Draft',
    owner: module.stats?.owner || 'Admin',
    usageCount: '0',
    updatedAt: new Date().toISOString().split('T')[0],
    group: '',
    linkedModules: 'Agenda',
    description: '',
  };
  
  if (module.id === 'template-surat') {
    return {
      ...base,
      category: 'Surat Tugas',
      format_nomor: '',
      menimbang: '',
      mengingat: '',
      memperhatikan: '',
      body_content: '',
      kop_surat: '',
    };
  }
  if (module.id === 'prioritas-agenda') {
    return {
      ...base,
      sla_days: 1,
      color_hex: '#3b82f6',
      status: 'Aktif'
    };
  }
  if (module.id === 'master-pegawai') {
    return {
      ...base,
      status: 'Aktif',
      gender: '1',
      unit_id: '',
    };
  }
  
  return base;
};

const LOADING_DELAY_MS = 650;
const tableHeadCellClass =
  'px-5 py-3 align-middle uppercase text-slate-500 dark:text-slate-400';

const MasterDataWorkspace = ({ moduleId, onBack }) => {
  const navigate = useNavigate();
  const selectedModule = masterDataModules.find((module) => module.id === moduleId);
  const { data: entries, loading: isLoading, error, fetch, create, update, remove } = useMasterData(moduleId);
  const { data: unitsData, fetch: fetchUnits } = useMasterData('divisi-unit');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(selectedModule ? createInitialForm(selectedModule) : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [scopeFilter, setScopeFilter] = useState('Semua');
  const [updatedFilter, setUpdatedFilter] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  useEffect(() => {
    if (!selectedModule) {
      onBack();
      return undefined;
    }

    setEntryForm(createInitialForm(selectedModule));
    setSelectedEntry(null);
    setEditingEntry(null);
    setSearchQuery('');
    setStatusFilter('Semua');
    setScopeFilter('Semua');
    setUpdatedFilter('');
    setCurrentPage(1);
    setSortConfig({ key: 'updatedAt', direction: 'desc' });

    fetch();
    if (selectedModule.id === 'master-pegawai') {
      fetchUnits();
    }
  }, [moduleId, onBack, selectedModule, fetch, fetchUnits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, scopeFilter, updatedFilter, pageSize]);

  if (!selectedModule) {
    return null;
  }

  if (!entryForm) {
    return <MasterDataWorkspaceSkeleton />;
  }

  const scopeOptions = Array.from(new Set(entries.map((entry) => entry.scope)));

  const filteredEntries = entries.filter((entry) => {
    const keyword = searchQuery.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      entry.name.toLowerCase().includes(keyword) ||
      entry.code.toLowerCase().includes(keyword) ||
      entry.owner.toLowerCase().includes(keyword) ||
      entry.group.toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === 'Semua' || entry.status === statusFilter;
    const matchesScope = scopeFilter === 'Semua' || entry.scope === scopeFilter;
    const matchesUpdated = !updatedFilter || entry.updatedAt === updatedFilter;

    return matchesSearch && matchesStatus && matchesScope && matchesUpdated;
  });

  const sortedEntries = [...filteredEntries].sort((left, right) => {
    const { key, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    const leftValue = left[key] ?? '';
    const rightValue = right[key] ?? '';

    if (key === 'updatedAt') {
      return (new Date(leftValue) - new Date(rightValue)) * modifier;
    }

    if (key === 'usageCount') {
      return (Number(leftValue) - Number(rightValue)) * modifier;
    }

    return String(leftValue).localeCompare(String(rightValue), 'id', { sensitivity: 'base' }) * modifier;
  });

  const totalItems = sortedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEntries = sortedEntries.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalItems);

  const handleDelete = async (entry) => {
    const result = await confirmDialog({
      title: 'Hapus master data ini?',
      text: `${entry.name} akan dihapus dari daftar ${selectedModule.shortTitle}.`,
      confirmButtonText: 'Ya, hapus'
    });

    if (result.isConfirmed) {
      await remove(entry.uuid);
    }
  };

  const handleFormChange = (field, value) => {
    setEntryForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setEntryForm(createInitialForm(selectedModule));
    setIsFormModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      code: entry.code || '',
      name: entry.name || '',
      scope: entry.scope || '',
      status: entry.status || 'Draft',
      owner: entry.owner || '',
      usageCount: String(entry.usageCount || 0),
      updatedAt: entry.updatedAt || new Date().toISOString().split('T')[0],
      group: entry.group || '',
      linkedModules: Array.isArray(entry.linkedModules) ? entry.linkedModules.join(', ') : '',
      description: entry.description || '',
      category: entry.category || '',
      format_nomor: entry.format_nomor || '',
      menimbang: entry.menimbang || '',
      mengingat: entry.mengingat || '',
      memperhatikan: entry.memperhatikan || '',
      body_content: entry.body_content || '',
      kop_surat: typeof entry.kop_surat === 'object' ? JSON.stringify(entry.kop_surat) : (entry.kop_surat || ''),
      gender: entry.gender || '1',
      unit_id: entry.unit_id || '',
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingEntry(null);
    setEntryForm(createInitialForm(selectedModule));
  };

  const handleSubmitEntry = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        code: entryForm.code.trim(),
        name: entryForm.name.trim(),
        scope: entryForm.scope.trim(),
        status: entryForm.status,
        owner: entryForm.owner.trim(),
        usageCount: Number(entryForm.usageCount || 0),
        updatedAt: entryForm.updatedAt,
        group: entryForm.group.trim(),
        linkedModules: typeof entryForm.linkedModules === 'string' ? entryForm.linkedModules
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean) : entryForm.linkedModules,
        description: entryForm.description.trim(),
      };
      
      if (selectedModule.id === 'template-surat') {
        payload.category = entryForm.category;
        payload.format_nomor = entryForm.format_nomor;
        payload.menimbang = entryForm.menimbang;
        payload.mengingat = entryForm.mengingat;
        payload.memperhatikan = entryForm.memperhatikan;
        payload.body_content = entryForm.body_content;
        payload.kop_surat = entryForm.kop_surat;
      }
      
      if (selectedModule.id === 'master-pegawai') {
        payload.gender = entryForm.gender;
        payload.unit_id = entryForm.unit_id;
      }

      if (editingEntry) {
        await update(editingEntry.uuid, payload);
      } else {
        await create(payload);
      }

      closeFormModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('Semua');
    setScopeFilter('Semua');
    setUpdatedFilter('');
    setCurrentPage(1);
    fetch();
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortableHead = ({ label, sortKey, align = 'left' }) => (
    <th className={cn(tableHeadCellClass, align === 'right' ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 text-current transition hover:text-slate-700 dark:hover:text-slate-200',
          sortConfig.key === sortKey ? 'text-slate-700 dark:text-slate-200' : ''
        )}
      >
        <span>{label}</span>
        <ChevronsUpDown size={12} strokeWidth={2} />
      </button>
    </th>
  );

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[1em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-extrabold tracking-[0.01em] text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>

          <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">{selectedModule.title}</h1>
          <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-slate-500 dark:text-slate-400">{selectedModule.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700">
            <FileDown size={16} />
            Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </section>

      {/* Action Banner */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-[1.25em] border-2 border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tambah {selectedModule.title}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tambahkan entri data baru ke dalam kelompok {selectedModule.title.toLowerCase()}.
            </p>
          </div>
        </div>
        <Button 
          onClick={openCreateModal}
          className="cursor-pointer shrink-0 gap-2 rounded-[1em] px-6 py-2.5 shadow-sm"
        >
          <Plus size={16} />
          {selectedModule.addLabel}
        </Button>
      </section>

      <section className="rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Daftar Master Data</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {totalItems} data ditemukan dari {entries.length} entri.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => setIsFilterVisible((current) => !current)}
                className="admin-toolbar-control inline-flex cursor-pointer items-center gap-2 rounded-[1em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-extrabold tracking-[0.01em] text-blue-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-blue-300 dark:hover:border-blue-900"
              >
                <Search size={16} />
                Filter Data
                <ChevronDown size={16} className={cn('transition duration-200', isFilterVisible ? 'rotate-180' : '')} />
              </button>

              <div className="admin-toolbar-control flex items-center gap-2 rounded-[1.25em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.75rem] font-extrabold tracking-[0.01em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <ChevronsLeftRight size={16} className="text-slate-400 dark:text-slate-500" />
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="cursor-pointer bg-transparent text-slate-700 outline-none dark:text-slate-200"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden border-b border-slate-200 bg-slate-50/60 transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-950/30',
            isFilterVisible ? 'max-h-[28rem] opacity-100' : 'max-h-0 border-b-0 opacity-0'
          )}
        >
          <div className={cn('px-5 py-4 transition duration-300 ease-out', isFilterVisible ? 'translate-y-0' : '-translate-y-2')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_12rem_12rem_12rem_auto]">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pencarian
                </span>
                <div className="admin-filter-input-shell admin-filter-field rounded-[1em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Search size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={selectedModule.searchPlaceholder}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>Semua</option>
                  <option>Aktif</option>
                  <option>Draft</option>
                  <option>Nonaktif</option>
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Cakupan
                </span>
                <select
                  value={scopeFilter}
                  onChange={(event) => setScopeFilter(event.target.value)}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>Semua</option>
                  {scopeOptions.map((scope) => (
                    <option key={scope}>{scope}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Diperbarui
                </span>
                <input
                  type="date"
                  value={updatedFilter}
                  onChange={(event) => setUpdatedFilter(event.target.value)}
                  className="admin-filter-field w-full rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <div className="flex min-w-0 items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('Semua');
                    setScopeFilter('Semua');
                    setUpdatedFilter('');
                  }}
                  className="admin-filter-field inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                >
                  <RotateCcw size={15} />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <MasterDataWorkspaceSkeleton />
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/40">
              <tr className="text-left">
                <SortableHead label="Nama Data" sortKey="name" />
                <SortableHead label="Cakupan" sortKey="scope" />
                <SortableHead label="Status" sortKey="status" />
                <SortableHead label="Diperbarui" sortKey="updatedAt" />
                <th className={cn(tableHeadCellClass, 'w-[10rem] min-w-[10rem] px-4 text-center')}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-0 py-8">
                    <EmptyState 
                      title="Tidak ada master data yang cocok" 
                      description="Ubah kata kunci pencarian atau reset filter untuk melihat data lain." 
                    />
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                  <tr key={entry.uuid} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                    <td className="px-5 py-4">
                      <div className="min-w-[18rem]">
                        <p 
                          className={cn(
                            "text-sm font-extrabold text-slate-900 dark:text-slate-50",
                            selectedModule.id === 'template-surat' ? "cursor-pointer hover:text-blue-600 hover:underline transition-colors" : ""
                          )}
                          onClick={() => {
                            if (selectedModule.id === 'template-surat') {
                              navigate(`/admin/master-data/template-surat/detail/template/${entry.uid}`);
                            }
                          }}
                        >
                          {entry.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {selectedModule.id === 'master-pegawai' ? entry.code : entry.group}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.scope}</td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[entry.status])}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[10rem] text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatMasterDataDate(entry.updatedAt)}
                      </div>
                    </td>
                    <td className="w-[10rem] min-w-[10rem] px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedModule.id === 'template-surat') {
                              navigate(`/admin/master-data/template-surat/detail/template/${entry.uid}`);
                            } else {
                              setSelectedEntry(entry);
                            }
                          }}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                          aria-label={`Detail ${entry.name}`}
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-900 dark:hover:text-amber-300"
                          aria-label={`Edit ${entry.name}`}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-300"
                          aria-label={`Hapus ${entry.name}`}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startItem={startItem}
          endItem={endItem}
          totalItems={totalItems}
        />
        </>
        )}
      </section>

      {selectedEntry ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-3xl overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  DETAIL {selectedModule.shortTitle}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedEntry.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {selectedModule.id === 'master-pegawai' ? (
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">NIP</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.code || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Nama Lengkap</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.name || '-'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Unit Kerja</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                        {selectedEntry.unit_name || '-'}
                      </span>
                    </div>

                  <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Jenis Kelamin</span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.gender === '1' || selectedEntry.gender === 'L' ? 'Laki-laki' : (selectedEntry.gender === '2' || selectedEntry.gender === 'P' ? 'Wanita' : '-')}
                    </div>
                  </div>

                  <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Status Pegawai</span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.scope || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Status Aktif</span>
                    <div className="flex justify-end sm:w-2/3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedEntry.status])}>
                        {selectedEntry.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (selectedModule.id === 'divisi-unit' || selectedModule.id === 'lokasi-kegiatan' || selectedModule.id === 'kategori-agenda' || selectedModule.id === 'prioritas-agenda' || selectedModule.id === 'template-surat') ? (
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">
                      {selectedModule.id === 'divisi-unit' ? 'Kode Unit' : selectedModule.id === 'kategori-agenda' ? 'Kode Kategori' : selectedModule.id === 'prioritas-agenda' ? 'Kode Prioritas' : selectedModule.id === 'template-surat' ? 'Kode Template' : 'Kode Ruangan'}
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.code || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">
                      {selectedModule.id === 'divisi-unit' ? 'Nama Divisi / Unit' : selectedModule.id === 'kategori-agenda' ? 'Nama Kategori' : selectedModule.id === 'prioritas-agenda' ? 'Nama Prioritas' : selectedModule.id === 'template-surat' ? 'Nama Template' : 'Nama Ruangan'}
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                      {selectedEntry.name || '-'}
                    </div>
                  </div>
                  
                  {selectedModule.id === 'lokasi-kegiatan' && (
                    <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Gedung / Area</span>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                        {selectedEntry.scope || '-'}
                      </div>
                    </div>
                  )}

                  {selectedModule.id === 'prioritas-agenda' && (
                    <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Warna (Hex)</span>
                      <div className="flex sm:w-2/3 sm:justify-end items-center gap-2">
                        <div 
                          className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm" 
                          style={{ backgroundColor: selectedEntry.color_hex || '#000' }}
                        />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedEntry.color_hex || '-'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedModule.id === 'template-surat' && (
                    <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Kategori</span>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                        {selectedEntry.category || selectedEntry.scope || '-'}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">
                      {selectedModule.id === 'lokasi-kegiatan' ? 'Kapasitas' : selectedModule.id === 'prioritas-agenda' ? 'SLA / Target' : selectedModule.id === 'template-surat' ? 'Format Nomor' : 'Deskripsi'}
                    </span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right leading-relaxed break-all">
                      {selectedModule.id === 'lokasi-kegiatan' 
                        ? (selectedEntry.usageCount ? `${selectedEntry.usageCount} Orang` : '-') 
                        : selectedModule.id === 'prioritas-agenda' 
                        ? (selectedEntry.sla_days ? `${selectedEntry.sla_days} Hari` : '-')
                        : selectedModule.id === 'template-surat'
                        ? (selectedEntry.format_nomor || selectedEntry.description || '-')
                        : (selectedEntry.description || '-')}
                    </div>
                  </div>
                  
                  <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Status Aktif</span>
                    <div className="flex justify-end sm:w-2/3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedEntry.status])}>
                        {selectedEntry.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedEntry.status])}>
                    {selectedEntry.status}
                  </span>
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {selectedEntry.scope}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEntry.description}</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoTile label="Kode" value={selectedEntry.code} />
                  <InfoTile label="Kelompok" value={selectedEntry.group} />
                  <InfoTile label="Pemilik Data" value={selectedEntry.owner} />
                  <InfoTile label="Diperbarui" value={formatMasterDataDate(selectedEntry.updatedAt)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1em] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pemakaian</span>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{selectedEntry.usageCount}x</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Dipakai di modul agenda dan workflow terkait.</p>
                </div>
                <div className="rounded-[1em] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Terhubung ke</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedEntry.linkedModules.map((item) => (
                      <span
                        key={item}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      ) : null}

      {isFormModalOpen ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {editingEntry ? 'Edit Master Data' : 'Tambah Master Data'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedModule.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedModule.id === 'master-pegawai' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          NIP
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Lengkap
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Unit Kerja
                        </span>
                        <select
                          value={entryForm.unit_id}
                          onChange={(event) => handleFormChange('unit_id', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="">-- Pilih Unit Kerja --</option>
                          {unitsData && unitsData.map(unit => (
                            <option key={unit.uuid} value={unit.id}>{unit.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Jenis Kelamin
                        </span>
                        <select
                          value={entryForm.gender}
                          onChange={(event) => handleFormChange('gender', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="1">Laki-laki</option>
                          <option value="2">Wanita</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status Pegawai
                        </span>
                        <input
                          type="text"
                          value={entryForm.scope}
                          onChange={(event) => handleFormChange('scope', event.target.value)}
                          placeholder="Contoh: ASN / Non-ASN"
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status
                        </span>
                        <select
                          value={entryForm.status}
                          onChange={(event) => handleFormChange('status', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </label>
                    </>
                  ) : selectedModule.id === 'lokasi-kegiatan' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kode Ruangan
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status
                        </span>
                        <select
                          value={entryForm.status}
                          onChange={(event) => handleFormChange('status', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Ruangan
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Gedung / Area
                        </span>
                        <input
                          type="text"
                          value={entryForm.scope}
                          onChange={(event) => handleFormChange('scope', event.target.value)}
                          placeholder="Contoh: Gedung A"
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kapasitas (Orang)
                        </span>
                        <input
                          type="number"
                          value={entryForm.usageCount}
                          onChange={(event) => handleFormChange('usageCount', event.target.value)}
                          min="0"
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                    </>
                  ) : selectedModule.id === 'kategori-agenda' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Kategori
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status
                        </span>
                        <select
                          value={entryForm.status}
                          onChange={(event) => handleFormChange('status', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Deskripsi / Keterangan
                        </span>
                        <textarea
                          value={entryForm.description}
                          onChange={(event) => handleFormChange('description', event.target.value)}
                          rows={3}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                    </>
                  ) : selectedModule.id === 'prioritas-agenda' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kode Prioritas
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          placeholder="Kosongkan untuk generate otomatis"
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status
                        </span>
                        <select
                          value={entryForm.status}
                          onChange={(event) => handleFormChange('status', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Prioritas
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          SLA / Target Penyelesaian (Hari)
                        </span>
                        <input
                          type="number"
                          value={entryForm.sla_days}
                          onChange={(event) => handleFormChange('sla_days', event.target.value)}
                          min="0"
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Warna / Label (Hex)
                        </span>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={entryForm.color_hex}
                            onChange={(event) => handleFormChange('color_hex', event.target.value)}
                            className="h-11 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={entryForm.color_hex}
                            onChange={(event) => handleFormChange('color_hex', event.target.value)}
                            placeholder="#000000"
                            required
                            className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                    </>
                  ) : selectedModule.id === 'divisi-unit' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kode Unit
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Divisi / Unit Kerja
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Deskripsi / Keterangan
                        </span>
                        <textarea
                          value={entryForm.description}
                          onChange={(event) => handleFormChange('description', event.target.value)}
                          placeholder="Penjelasan singkat mengenai unit ini..."
                          rows={3}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                    </>
                  ) : selectedModule.id === 'template-surat' ? (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kode Template
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          placeholder="Kosongkan untuk generate otomatis"
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Status
                        </span>
                        <select
                          value={entryForm.status}
                          onChange={(event) => handleFormChange('status', event.target.value)}
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </label>
                      
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Nama Template
                        </span>
                        <input
                          type="text"
                          value={entryForm.name}
                          onChange={(event) => handleFormChange('name', event.target.value)}
                          required
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>

                      <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
                        <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Pengaturan Template Surat</h4>
                      </div>
                      
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kategori Surat
                        </span>
                        <input
                          type="text"
                          value={entryForm.category}
                          onChange={(event) => handleFormChange('category', event.target.value)}
                          placeholder="Contoh: Surat Tugas"
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Format Nomor
                        </span>
                        <input
                          type="text"
                          value={entryForm.format_nomor}
                          onChange={(event) => handleFormChange('format_nomor', event.target.value)}
                          placeholder="Contoh: ST/{unit}/2026"
                          className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Konfigurasi Kop Surat (JSON)
                        </span>
                        <textarea
                          value={entryForm.kop_surat}
                          onChange={(event) => handleFormChange('kop_surat', event.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Menimbang
                        </span>
                        <textarea
                          value={entryForm.menimbang}
                          onChange={(event) => handleFormChange('menimbang', event.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Mengingat
                        </span>
                        <textarea
                          value={entryForm.mengingat}
                          onChange={(event) => handleFormChange('mengingat', event.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Memperhatikan
                        </span>
                        <textarea
                          value={entryForm.memperhatikan}
                          onChange={(event) => handleFormChange('memperhatikan', event.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Isi Surat (Body Content)
                        </span>
                        <textarea
                          value={entryForm.body_content}
                          onChange={(event) => handleFormChange('body_content', event.target.value)}
                          rows={5}
                          className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Kode
                        </span>
                        <input
                          type="text"
                          value={entryForm.code}
                          onChange={(event) => handleFormChange('code', event.target.value)}
                          required
                          className="w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Status
                    </span>
                    <select
                      value={entryForm.status}
                      onChange={(event) => handleFormChange('status', event.target.value)}
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option>Draft</option>
                      <option>Aktif</option>
                      <option>Nonaktif</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Nama Data
                    </span>
                    <input
                      type="text"
                      value={entryForm.name}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      placeholder={`Masukkan nama ${selectedModule.shortTitle.toLowerCase()}`}
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Cakupan
                    </span>
                    <input
                      type="text"
                      value={entryForm.scope}
                      onChange={(event) => handleFormChange('scope', event.target.value)}
                      placeholder="Contoh: Lintas Unit"
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kelompok
                    </span>
                    <input
                      type="text"
                      value={entryForm.group}
                      onChange={(event) => handleFormChange('group', event.target.value)}
                      placeholder="Contoh: Koordinasi"
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Pemilik Data
                    </span>
                    <input
                      type="text"
                      value={entryForm.owner}
                      onChange={(event) => handleFormChange('owner', event.target.value)}
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Dipakai
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={entryForm.usageCount}
                      onChange={(event) => handleFormChange('usageCount', event.target.value)}
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Tanggal Update
                    </span>
                    <input
                      type="date"
                      value={entryForm.updatedAt}
                      onChange={(event) => handleFormChange('updatedAt', event.target.value)}
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Modul Terkait
                    </span>
                    <input
                      type="text"
                      value={entryForm.linkedModules}
                      onChange={(event) => handleFormChange('linkedModules', event.target.value)}
                      placeholder="Pisahkan dengan koma"
                      required
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Deskripsi
                    </span>
                    <textarea
                      value={entryForm.description}
                      onChange={(event) => handleFormChange('description', event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={closeFormModal} className="cursor-pointer">
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="cursor-pointer gap-2 bg-blue-600 bg-none shadow-none hover:bg-blue-700 hover:shadow-none disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {isSubmitting ? 'Menyimpan...' : (editingEntry ? 'Simpan Perubahan' : 'Simpan Master Data')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="rounded-[1em] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
    <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</span>
    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default MasterDataWorkspace;
