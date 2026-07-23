import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Presentation, MapPin, Users, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { roomService } from '../services/roomService';
import RoomsWorkspaceSkeleton from './RoomsWorkspaceSkeleton';

const statusConfig = {
  'Tersedia': {
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900',
    icon: CheckCircle2,
  },
  'Sedang Digunakan': {
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-rose-200 dark:ring-rose-900',
    icon: XCircle,
  },
  'Tidak Aktif': {
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 ring-slate-200 dark:ring-slate-800',
    icon: XCircle,
  }
};

const RoomsWorkspace = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const loadRooms = useCallback(async (withSkeleton = false) => {
    if (withSkeleton) setIsLoading(true);
    try {
      const response = await roomService.getRooms({
        page,
        per_page: 8,
        search: debouncedSearch,
        status: statusFilter
      });
      
      setRooms(response.data || []);
      
      if (response.meta) {
        setTotalPages(response.meta.last_page);
        setTotalItems(response.meta.total);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadRooms(true);
  }, [loadRooms]);

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            Manajemen Ruangan
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
            Pantau ketersediaan dan penggunaan ruang rapat secara realtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadRooms(true)}
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFilterVisible((current) => !current)}
            className={cn(
              "cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800",
              isFilterVisible && "bg-slate-200 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700"
            )}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown size={16} className={cn('transition duration-300', isFilterVisible ? 'rotate-180' : '')} />
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="space-y-5">
        {/* Filters */}
        <div
          className={cn(
            'overflow-hidden rounded-[1.25em] bg-white transition-all duration-300 ease-out dark:bg-slate-900',
            isFilterVisible ? 'max-h-[28rem] border border-slate-200 p-5 shadow-sm opacity-100 dark:border-slate-800' : 'max-h-0 border-0 p-0 opacity-0'
          )}
        >
          <div className={cn("transition duration-300 ease-out", isFilterVisible ? "translate-y-0" : "-translate-y-4")}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Pencarian</h3>
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('Semua'); }} 
                className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Reset Semua
              </button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Pencarian</label>
                <div className="admin-filter-input-shell admin-filter-field rounded-[1em] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 flex items-center gap-2 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama ruangan..."
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full cursor-pointer rounded-[1em] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Tersedia">Tersedia</option>
                  <option value="Sedang Digunakan">Sedang Digunakan</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <RoomsWorkspaceSkeleton />
        ) : rooms.length === 0 ? (
          <EmptyState 
            title="Data Tidak Ditemukan" 
            description="Silakan sesuaikan filter atau kata kunci pencarian Anda." 
            className="rounded-[1.25em] border border-slate-200 border-dashed py-16 dark:border-slate-800"
          />
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => {
                const StatusIcon = statusConfig[room.status]?.icon || statusConfig['Tidak Aktif'].icon;
                const statusColor = statusConfig[room.status]?.color || statusConfig['Tidak Aktif'].color;
                
                return (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/admin/ruangan/${room.uid}`)}
                    className="group relative cursor-pointer overflow-hidden rounded-[1.25em] bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:bg-blue-50/60 hover:shadow-md hover:ring-blue-100 active:translate-y-0 dark:bg-slate-900 dark:ring-slate-800/80 dark:hover:bg-slate-800/80 dark:hover:ring-blue-900/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1em] bg-blue-100 dark:bg-blue-950/40">
                        <Presentation size={24} className="text-blue-600 transition duration-200 group-hover:-rotate-6 dark:text-blue-300" />
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1',
                          statusColor
                        )}
                      >
                        <StatusIcon size={12} />
                        {room.status}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        {room.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users size={16} />
                          {room.capacity} Orang
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin size={16} />
                          {room.code || `R-${room.id}`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
                      <div className="flex items-start gap-2 text-sm">
                        <Clock size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {room.currentAgenda ? 'Sedang Berlangsung:' : 'Agenda Berikutnya:'}
                          </p>
                          <p className="truncate text-slate-500 dark:text-slate-400">
                            {room.currentAgenda || room.nextAgenda || 'Tidak ada agenda terdekat'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Menampilkan <span className="font-bold text-slate-900 dark:text-slate-100">{rooms.length}</span> dari <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> ruangan
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="border border-slate-200 px-3 dark:border-slate-700"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="px-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Hal {page} dari {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="border border-slate-200 px-3 dark:border-slate-700"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default RoomsWorkspace;
