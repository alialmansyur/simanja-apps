import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Clock, Users, MapPin, Search, RefreshCw } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import DashboardMainCalendar from '../../dashboard/components/DashboardMainCalendar';
import { roomService } from '../services/roomService';
import RoomDetailWorkspaceSkeleton from './RoomDetailWorkspaceSkeleton';

const statusConfig = {
  'Tersedia': {
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900',
  },
  'Sedang Digunakan': {
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-rose-200 dark:ring-rose-900',
  },
  'Tidak Aktif': {
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 ring-slate-200 dark:ring-slate-800',
  }
};

const RoomDetailWorkspace = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchRoomDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await roomService.getRoomByUid(uuid);
      if (response.data) {
        setRoom(response.data);
      }
    } catch (error) {
      console.error('Failed to load room details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchRoomDetail();
  }, [fetchRoomDetail]);

  const events = useMemo(() => {
    if (!room || !room.agendas) return [];
    
    return room.agendas.map(agenda => {
      // Parse ISO date and time properly
      // If start_time doesn't have seconds, handle it
      const startStr = agenda.start_time?.length === 5 ? `${agenda.start_time}:00` : agenda.start_time;
      const endStr = agenda.end_time?.length === 5 ? `${agenda.end_time}:00` : agenda.end_time;
      
      const startDateStr = typeof agenda.start_date === 'string' ? agenda.start_date.split('T')[0] : agenda.start_date;
      const endDateStr = typeof agenda.end_date === 'string' ? agenda.end_date.split('T')[0] : agenda.end_date;

      return {
        id: agenda.id,
        title: agenda.title,
        start: new Date(`${startDateStr}T${startStr}`),
        end: new Date(`${endDateStr}T${endStr}`),
        location: room.name,
        type: agenda.is_online ? 'online' : 'offline',
        description: agenda.description || 'Tidak ada deskripsi',
        category: agenda.category,
        isOnline: agenda.is_online,
        onlineUrl: agenda.online_url,
        onlineMeetingId: agenda.online_meeting_id,
        onlinePassword: agenda.online_password,
        participants: agenda.participants_formatted || [],
        stNumber: agenda.st_number || '-',
        ndNumber: agenda.nd_number || '-',
        isAllEmployees: agenda.is_all_employees,
        team: agenda.team || (agenda.is_online ? 'Virtual Meeting' : 'Offline Meeting'),
      };
    });
  }, [room]);

  const todayEvents = events.filter(e => {
    const today = new Date();
    return e.start.getDate() === today.getDate() && 
           e.start.getMonth() === today.getMonth() && 
           e.start.getFullYear() === today.getFullYear();
  });

  const statusColor = statusConfig[room?.status]?.color || statusConfig['Tidak Aktif'].color;

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      {/* Header Section */}
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/ruangan')}
              className="inline-flex cursor-pointer gap-2 border border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft size={16} />
              Kembali
            </Button>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-[1.35rem]">
              Detail {room?.name || 'Ruangan'}
            </h1>
            <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
              Lihat detail informasi dan jadwal penggunaan ruangan secara spesifik.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchRoomDetail}
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </section>

      {isLoading ? (
        <RoomDetailWorkspaceSkeleton />
      ) : !room ? (
        <div className="flex flex-col items-center justify-center rounded-[1.25em] border border-slate-200 border-dashed py-16 dark:border-slate-800">
          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">Ruangan Tidak Ditemukan</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Silakan kembali ke halaman sebelumnya.</p>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (col-4) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[1.25em] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Informasi Ruangan</h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1',
                  statusColor
                )}
              >
                <CheckCircle2 size={14} />
                {room.status}
              </span>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kapasitas</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{room.capacity} Orang</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50 overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kode Ruangan</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{room.code || room.id}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fasilitas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {room.facilities && room.facilities.length > 0 ? (
                  room.facilities.map((fac, idx) => (
                    <span key={idx} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {fac}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 italic">Tidak ada data fasilitas</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[1.25em] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Agenda Hari Ini</h2>
            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {todayEvents.length > 0 ? (
                todayEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-slate-800">
                      <span className="text-xs font-bold text-slate-500">
                        {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={event.title}>{event.title}</h4>
                      <p className="text-sm text-slate-500 truncate" title={event.team}>{event.team}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada agenda hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (col-8) */}
        <div className="lg:col-span-8">
          <DashboardMainCalendar 
            events={events}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
          />
        </div>
        </section>
      )}
    </div>
  );
};

export default RoomDetailWorkspace;
