import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileDown,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  ChevronsUpDown,
  CalendarDays,
  FileSpreadsheet,
  X,
  MapPin,
  Video,
  Building2
} from 'lucide-react';
import HistoryWorkspaceSkeleton from './HistoryWorkspaceSkeleton';
import Button, { cn } from '../../../components/ui/Button';
import DataTablePagination from '../../../components/ui/DataTablePagination';
import EmptyState from '../../../components/ui/EmptyState';
import historyService from '../services/historyService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const statusTone = {
  'Selesai': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Berlangsung': 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  'Tertunda': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  'Dibatalkan': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

const categoryTone = {
  Rapat: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Monitoring: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  Sosialisasi: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  Pembahasan: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  Persiapan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
};

const HistoryWorkspace = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [roomFilter, setRoomFilter] = useState('Semua');
  const [picFilter, setPicFilter] = useState('Semua');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        per_page: pageSize,
        sort_by: sortConfig.key,
        sort_dir: sortConfig.direction,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'Semua') params.status = statusFilter;
      if (roomFilter !== 'Semua') params.room = roomFilter;
      if (picFilter !== 'Semua') params.pic = picFilter;

      const response = await historyService.getHistory(params);
      setHistory(response.items || []);
      setTotalItems(response.total || 0);
      setTotalPages(response.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortConfig, searchQuery, statusFilter, roomFilter, picFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('Semua');
    setRoomFilter('Semua');
    setPicFilter('Semua');
    setCurrentPage(1);
    fetchHistory();
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const params = {
        sort_by: sortConfig.key,
        sort_dir: sortConfig.direction,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'Semua') params.status = statusFilter;
      if (roomFilter !== 'Semua') params.room = roomFilter;
      if (picFilter !== 'Semua') params.pic = picFilter;

      const data = await historyService.exportHistory(params);
      
      const worksheetData = data.map((item, index) => ({
        'No': index + 1,
        'ID Agenda': item.id,
        'No. Surat Tugas': item.stNumber || '-',
        'Judul Agenda': item.agendaTitle,
        'Ruangan': item.room,
        'Waktu Pelaksanaan': `${item.date} (${item.time})`,
        'Penanggung Jawab': item.pic,
        'Status': item.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      const colWidths = [
        { wch: 5 }, { wch: 10 }, { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 15 }
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Agenda');
      
      XLSX.writeFile(workbook, `Riwayat_Agenda_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
      console.error('Export Excel failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const params = {
        sort_by: sortConfig.key,
        sort_dir: sortConfig.direction,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'Semua') params.status = statusFilter;
      if (roomFilter !== 'Semua') params.room = roomFilter;
      if (picFilter !== 'Semua') params.pic = picFilter;

      const data = await historyService.exportHistory(params);
      
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Laporan Riwayat Agenda', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);
      
      let filterText = 'Filter: ';
      let filters = [];
      if (statusFilter !== 'Semua') filters.push(`Status (${statusFilter})`);
      if (roomFilter !== 'Semua') filters.push(`Ruangan (${roomFilter})`);
      if (picFilter !== 'Semua') filters.push(`PIC (${picFilter})`);
      if (searchQuery) filters.push(`Pencarian ("${searchQuery}")`);
      
      if (filters.length > 0) {
        doc.text(filterText + filters.join(', '), 14, 34);
      } else {
        doc.text('Filter: Semua Data', 14, 34);
      }

      const tableColumn = ["No", "ID", "Judul Agenda", "Ruangan", "Waktu", "PIC", "Status"];
      const tableRows = [];

      data.forEach((item, index) => {
        const rowData = [
          index + 1,
          item.id,
          item.agendaTitle,
          item.room,
          `${item.date}\n${item.time}`,
          item.pic,
          item.status
        ];
        tableRows.push(rowData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 15 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 40 },
          4: { cellWidth: 45 },
          5: { cellWidth: 35 },
          6: { cellWidth: 20 },
        },
      });

      doc.save(`Riwayat_Agenda_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('Export PDF failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const SortableHead = ({ label, sortKey, align = 'left' }) => (
    <th className={cn('px-5 py-3', align === 'right' ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.28em] transition hover:text-slate-700 dark:hover:text-slate-200',
          sortConfig.key === sortKey ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <span>{label}</span>
        <ChevronsUpDown size={14} strokeWidth={1.75} />
      </button>
    </th>
  );

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            Riwayat Agenda
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
            Lihat daftar riwayat penggunaan ruang rapat dan agenda.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={isExporting || isLoading}
            onClick={exportToExcel}
            className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} className={isExporting ? "animate-pulse" : ""} />
            Export Excel
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={isExporting || isLoading}
            onClick={exportToPDF}
            className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <FileDown size={16} className={isExporting ? "animate-pulse" : ""} />
            Export PDF
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

      <section className="rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Daftar Riwayat</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {totalItems} agenda ditemukan dari data riwayat.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => setIsFilterVisible((current) => !current)}
                className="admin-toolbar-control inline-flex cursor-pointer items-center gap-2 rounded-[1em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-extrabold tracking-[0.01em] text-blue-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-blue-300 dark:hover:border-blue-900"
              >
                <Filter size={16} />
                Filter Data
                <ChevronDown size={16} className={cn('transition duration-200', isFilterVisible ? 'rotate-180' : '')} />
              </button>

              <div className="admin-toolbar-control flex items-center gap-2 rounded-[1.25em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.75rem] font-extrabold tracking-[0.01em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <ChevronsLeftRight size={16} className="text-slate-400 dark:text-slate-500" />
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
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
            isFilterVisible ? 'max-h-[32rem] opacity-100' : 'max-h-0 border-b-0 opacity-0'
          )}
        >
          <div
            className={cn(
              'px-5 py-4 transition duration-300 ease-out',
              isFilterVisible ? 'translate-y-0' : '-translate-y-2'
            )}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="block min-w-0 xl:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pencarian
                </span>
                <div className="admin-filter-input-shell admin-filter-field rounded-[1em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Search size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari ID atau judul agenda..."
                    className="admin-filter-field w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>Semua</option>
                  <option>Selesai</option>
                  <option>Berlangsung</option>
                  <option>Tertunda</option>
                  <option>Dibatalkan</option>
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Ruangan
                </span>
                <select
                  value={roomFilter}
                  onChange={(event) => {
                    setRoomFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>Semua</option>
                  <option value="Lantai 1">Lantai 1</option>
                  <option value="Lantai 2">Lantai 2</option>
                  <option value="Lantai 3">Lantai 3</option>
                </select>
              </label>

              <div className="flex min-w-0 items-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="admin-filter-field inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <HistoryWorkspaceSkeleton />
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/40">
              <tr className="text-left">
                <SortableHead label="Agenda & Ruangan" sortKey="agendaTitle" />
                <SortableHead label="Waktu" sortKey="date" />
                <SortableHead label="Penanggung Jawab" sortKey="pic" />
                <SortableHead label="Status" sortKey="status" />
                <th className="px-5 py-3 text-right text-[8px] font-extrabold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-0 py-8">
                    <EmptyState 
                      title="Tidak ada riwayat yang cocok" 
                      description="Ubah filter tanggal atau kata kunci untuk melihat data lain." 
                    />
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.uuid} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                    <td className="px-5 py-4">
                      <div className="min-w-[15rem]">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">{item.agendaTitle}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.id} &bull; {item.room}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.date}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {item.pic}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[item.status] || 'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300')}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(item)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                          aria-label={`Detail ${item.agendaTitle}`}
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {!isLoading && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startItem={startItem}
            endItem={endItem}
            totalItems={totalItems}
          />
        )}
      </section>

      {selectedActivity ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Detail Agenda</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedActivity.agendaTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 mt-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {/* Deskripsi */}
                <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Deskripsi</span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                    {selectedActivity.description || '-'}
                  </div>
                </div>

                {/* Kategori */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', categoryTone[selectedActivity.category] || categoryTone['Rapat'])}>
                    {selectedActivity.category || 'Rapat'}
                  </span>
                </div>

                {/* Status Publikasi */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status Publikasi</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedActivity.status] || statusTone['Tertunda'])}>
                    {selectedActivity.status}
                  </span>
                </div>

                {/* Waktu Pelaksanaan */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Waktu Pelaksanaan</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span>{selectedActivity.date}, {selectedActivity.time}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lokasi</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedActivity.isOnline ? <Video size={16} className="text-blue-500" /> : <MapPin size={16} className="text-blue-500" />}
                    <span>{selectedActivity.location}</span>
                  </div>
                </div>

                {/* Tautan Meeting (Jika Online) */}
                {selectedActivity.isOnline && selectedActivity.onlineUrl && (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tautan Meeting</span>
                    <a href={selectedActivity.onlineUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      Join URL
                    </a>
                  </div>
                )}

                {/* Penanggung Jawab */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">PIC / Penanggung Jawab</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <span>{selectedActivity.pic}</span>
                  </div>
                </div>

                {/* No Surat Tugas */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Surat Tugas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedActivity.stNumber && selectedActivity.stNumber !== '0' ? selectedActivity.stNumber : '-'}
                  </span>
                </div>

                {/* Partisipan */}
                <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2 border-b-0">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Partisipan</span>
                  <div className="flex flex-wrap gap-2 sm:w-2/3 sm:justify-end">
                    {selectedActivity.isAllEmployees ? (
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                        Semua Pegawai
                      </span>
                    ) : (
                      selectedActivity.participants?.length > 0 ? (
                        selectedActivity.participants.map((participant) => (
                          <span
                            key={participant.value}
                            className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {participant.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Tidak ada spesifik / Tertentu</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HistoryWorkspace;
