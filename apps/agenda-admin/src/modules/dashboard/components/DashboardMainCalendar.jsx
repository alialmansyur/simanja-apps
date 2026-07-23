import React, { useEffect, useRef, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/id';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Search,
  Share2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { cn } from '../../../components/ui/Button';

moment.locale('id');
const localizer = momentLocalizer(moment);
import EmptyState from '../../../components/ui/EmptyState';

const statusTone = {
  Publish: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Batal: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  Selesai: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
};

const publishTone = {
  'public': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'unit': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  'personal': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

const categoryTone = {
  Rapat: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Monitoring: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  Sosialisasi: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  Pembahasan: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  Persiapan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Fasilitasi CAT': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
};

const DashboardMainCalendar = ({ events, selectedEvent, setSelectedEvent }) => {
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateTimeLine = () => {
      if (view === 'month') return;

      const todayColumn = document.querySelector('.admin-calendar-shell .rbc-day-slot.rbc-today');
      if (!todayColumn) return;

      let indicator = todayColumn.querySelector('.custom-time-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className =
          'custom-time-indicator pointer-events-none absolute left-0 right-0 z-50 h-[2px] bg-red-500 shadow-sm';
        const dot = document.createElement('div');
        dot.className = 'absolute -left-[5px] -top-[4px] h-[10px] w-[10px] rounded-full bg-red-500';
        indicator.appendChild(dot);
        todayColumn.appendChild(indicator);
        todayColumn.style.position = 'relative';
      }

      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      indicator.style.top = `${(minutesSinceMidnight / (24 * 60)) * 100}%`;
    };

    updateTimeLine();
    const intervalId = window.setInterval(updateTimeLine, 60000);
    return () => window.clearInterval(intervalId);
  }, [date, view]);

  const filteredEvents = events.filter((event) => {
    const keyword = searchQuery.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      event.title.toLowerCase().includes(keyword) ||
      event.location.toLowerCase().includes(keyword);

    return matchesSearch;
  });

  const handleSelectSlot = (slotInfo) => {
    if (slotInfo.action !== 'select' && slotInfo.action !== 'click') return;

    setSelectedEvent(null);
    setSelectedDayEvents({
      date: slotInfo.start,
      events: filteredEvents.filter((event) => moment(event.start).isSame(slotInfo.start, 'day')),
    });
  };

  const handleSelectEvent = (event) => {
    setSelectedDayEvents(null);
    setSelectedEvent(event);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    if (now >= event.start && now <= event.end) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Sedang Berjalan
        </span>
      );
    }
    if (now < event.start) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
          <Clock size={12} />
          Akan Datang
        </span>
      );
    }
    return <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-300">Selesai</span>;
  };

  const downloadICS = (event) => {
    const formatDate = (value) => value.toISOString().replace(/-|:|\.\d+/g, '');
    const fileContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${formatDate(event.start)}\nDTEND:${formatDate(event.end)}\nLOCATION:${event.location}\nDESCRIPTION:${event.type} - ${event.team}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([fileContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateGoogleCalendarUrl = (event) => {
    const start = moment(event.start).format('YYYYMMDDTHHmmss');
    const end = moment(event.end).format('YYYYMMDDTHHmmss');
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`Lokasi: ${event.location}\nNo ST: ${event.stNumber}`);
    return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.type === 'rapat') backgroundColor = '#10b981';
    if (event.type === 'sosialisasi') backgroundColor = '#f59e0b';

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        border: '0px',
        color: '#fff',
        fontSize: '0.8rem',
        fontWeight: '600',
        opacity: 0.96,
        padding: '3px 8px',
      },
    };
  };

  const CustomToolbar = (toolbar) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const pickerRef = useRef(null);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          setShowDatePicker(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="mb-6 flex flex-col items-center justify-between gap-4 xl:flex-row">
        <div className="flex rounded-2xl bg-slate-100 p-1 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <button
            type="button"
            onClick={() => toolbar.onNavigate('TODAY')}
            className="flex items-center gap-2 rounded-[1rem] px-4 py-3 font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            <CalendarDays size={16} />
            <span>Hari Ini</span>
          </button>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('PREV')}
            className="rounded-[1rem] px-4 py-3 transition hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('NEXT')}
            className="rounded-[1rem] px-4 py-3 transition hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker((current) => !current)}
            className="flex items-center gap-2 rounded-[1rem] px-3 py-2 text-2xl font-bold tracking-tight text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-900/70"
          >
            <span>{toolbar.label}</span>
            <ChevronDown size={18} className={showDatePicker ? 'rotate-180 text-blue-500 dark:text-blue-400' : 'text-slate-400'} />
          </button>

          {showDatePicker ? (
            <div className="absolute left-1/2 top-full z-40 mt-3 w-72 -translate-x-1/2 rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear() - 1, toolbar.date.getMonth(), 1))}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{toolbar.date.getFullYear()}</span>
                <button
                  type="button"
                  onClick={() => toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear() + 1, toolbar.date.getMonth(), 1))}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear(), index, 1));
                      setShowDatePicker(false);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      toolbar.date.getMonth() === index
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex rounded-2xl bg-slate-100 p-1 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {['month', 'week', 'day'].map((viewName) => (
            <button
              key={viewName}
              type="button"
              onClick={() => toolbar.onView(viewName)}
              className={`rounded-[1rem] px-5 py-3 font-semibold capitalize transition ${
                toolbar.view === viewName ? 'bg-white text-blue-600 dark:bg-slate-700 dark:text-blue-300' : 'hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {viewName === 'month' ? 'Bulan' : viewName === 'week' ? 'Minggu' : 'Hari'}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CustomEvent = ({ event }) => {
    return (
      <div className="group relative flex h-full w-full items-center">
        <div className="w-full truncate">{event.title}</div>
        <div className="invisible absolute bottom-full left-1/2 z-[100] mb-2 w-max max-w-[250px] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-left text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
          <p className="text-sm font-bold leading-tight whitespace-normal">{event.title}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock size={12} />
            <span>
              {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </span>
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-300">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span className="whitespace-normal leading-tight">{event.location}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-[var(--radius-card)] bg-white shadow-sm ring-1 ring-slate-100 p-6 dark:bg-slate-800/90 dark:ring-slate-800/80 xl:p-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white">Kalender Kegiatan</h3>
        </div>
        <div className="relative w-full lg:w-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari agenda..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:w-80"
          />
        </div>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-4 px-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Kategori:</span>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Kegiatan
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Rapat
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          Sosialisasi
        </div>
      </div>

      <div className="admin-calendar-shell rounded-[var(--radius-card)] bg-slate-50 p-5 dark:bg-slate-900">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .admin-calendar-shell .rbc-toolbar { display: none; }
              .admin-calendar-shell .rbc-header {
                padding: 14px 0;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 0.78rem;
                color: #64748b;
                border-bottom: 1px solid #e2e8f0;
                background: transparent;
              }
              .admin-calendar-shell .rbc-month-view,
              .admin-calendar-shell .rbc-time-view,
              .admin-calendar-shell .rbc-agenda-view,
              .admin-calendar-shell .rbc-month-row,
              .admin-calendar-shell .rbc-day-bg,
              .admin-calendar-shell .rbc-time-content,
              .admin-calendar-shell .rbc-time-header-content,
              .admin-calendar-shell .rbc-timeslot-group {
                border-color: #e2e8f0;
              }
              .admin-calendar-shell .rbc-day-bg,
              .admin-calendar-shell .rbc-month-row,
              .admin-calendar-shell .rbc-time-content,
              .admin-calendar-shell .rbc-time-view,
              .admin-calendar-shell .rbc-time-header-content {
                background: #ffffff;
              }
              .admin-calendar-shell .rbc-off-range-bg { background: #f8fafc; }
              .admin-calendar-shell .rbc-off-range { color: #94a3b8; opacity: 0.9; }
              .admin-calendar-shell .rbc-date-cell,
              .admin-calendar-shell .rbc-button-link,
              .admin-calendar-shell .rbc-label,
              .admin-calendar-shell .rbc-time-content,
              .admin-calendar-shell .rbc-time-header-gutter,
              .admin-calendar-shell .rbc-time-gutter .rbc-timeslot-group {
                color: #0f172a;
              }
              .admin-calendar-shell .rbc-today { background-color: #eff6ff; }
              .admin-calendar-shell .rbc-current-time-indicator { background-color: #ef4444; height: 2px; }
              .admin-calendar-shell .rbc-current-time-indicator::before {
                content: '';
                position: absolute;
                left: -4px;
                top: -4px;
                width: 10px;
                height: 10px;
                border-radius: 9999px;
                background-color: #ef4444;
              }
              .admin-calendar-shell .rbc-event {
                overflow: visible !important;
              }
              .admin-calendar-shell .rbc-event-content,
              .admin-calendar-shell .rbc-month-row,
              .admin-calendar-shell .rbc-row-content {
                overflow: visible !important;
              }
              .dark .admin-calendar-shell .rbc-header {
                color: #93a4bf;
                border-bottom-color: #243045;
              }
              .dark .admin-calendar-shell .rbc-month-view,
              .dark .admin-calendar-shell .rbc-time-view,
              .dark .admin-calendar-shell .rbc-agenda-view,
              .dark .admin-calendar-shell .rbc-month-row,
              .dark .admin-calendar-shell .rbc-day-bg,
              .dark .admin-calendar-shell .rbc-time-content,
              .dark .admin-calendar-shell .rbc-time-header-content,
              .dark .admin-calendar-shell .rbc-timeslot-group {
                border-color: #243045;
              }
              .dark .admin-calendar-shell .rbc-day-bg,
              .dark .admin-calendar-shell .rbc-month-row,
              .dark .admin-calendar-shell .rbc-time-content,
              .dark .admin-calendar-shell .rbc-time-view,
              .dark .admin-calendar-shell .rbc-time-header-content {
                background: #101826;
              }
              .dark .admin-calendar-shell .rbc-off-range-bg { background: #060b15; }
              .dark .admin-calendar-shell .rbc-off-range { color: #334155; }
              .dark .admin-calendar-shell .rbc-date-cell,
              .dark .admin-calendar-shell .rbc-button-link,
              .dark .admin-calendar-shell .rbc-label,
              .dark .admin-calendar-shell .rbc-time-content,
              .dark .admin-calendar-shell .rbc-time-header-gutter,
              .dark .admin-calendar-shell .rbc-time-gutter .rbc-timeslot-group {
                color: #e2e8f0;
              }
              .dark .admin-calendar-shell .rbc-today { background-color: rgba(30, 41, 59, 0.7); }
            `,
          }}
        />

        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 620 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          components={{ toolbar: CustomToolbar, event: CustomEvent }}
          views={['month', 'week', 'day']}
          messages={{
            next: 'Selanjutnya',
            previous: 'Sebelumnya',
            today: 'Hari Ini',
            month: 'Bulan',
            week: 'Minggu',
            day: 'Hari',
          }}
        />
      </div>

      {selectedEvent ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Detail Agenda</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 mt-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                
                {/* Pembuat Agenda */}
                <div className="flex flex-col border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pembuat Agenda</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    {selectedEvent.creatorName || '-'} {selectedEvent.creatorNip ? `(NIP: ${selectedEvent.creatorNip})` : ''}
                  </span>
                </div>

                  {/* Unit Pemrakarsa */}
                <div className="flex flex-col border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Unit Pemrakarsa</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    {selectedEvent.team || '-'}
                  </span>
                </div>

                <div className="flex flex-col border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Judul Agenda</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    {selectedEvent.title}
                  </span>
                </div>
                
                {/* Deskripsi */}
                <div className="flex flex-col border-b border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Deskripsi</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-pre-line">
                    {selectedEvent.description || '-'}
                  </span>
                </div>

                {/* Kategori */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', categoryTone[selectedEvent.category] || categoryTone['Rapat'])}>
                    {selectedEvent.category || 'Rapat'}
                  </span>
                </div>

                {/* Status Publikasi */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status Publikasi</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', publishTone['unit'])}>
                    {selectedEvent.status || 'Publish Unit'}
                  </span>
                </div>

                {/* Waktu Pelaksanaan */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Waktu Pelaksanaan</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span>{selectedEvent.date || moment(selectedEvent.start).format('dddd, DD MMM YYYY')}, {selectedEvent.time || `${moment(selectedEvent.start).format('HH:mm')} - ${moment(selectedEvent.end).format('HH:mm')} WIB`}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lokasi</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedEvent.isOnline ? <Video size={16} className="text-blue-500" /> : <MapPin size={16} className="text-blue-500" />}
                    <span>{selectedEvent.location || '-'}</span>
                  </div>
                </div>

                {/* Info Online */}
                {selectedEvent.isOnline && (
                  <>
                    {selectedEvent.onlineUrl && (
                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tautan Meeting</span>
                        <a href={selectedEvent.onlineUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                          Join URL
                        </a>
                      </div>
                    )}
                    {selectedEvent.onlineMeetingId && (
                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Meeting ID</span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedEvent.onlineMeetingId}
                        </span>
                      </div>
                    )}
                    {selectedEvent.onlinePassword && (
                      <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Passcode</span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedEvent.onlinePassword}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* No Surat Tugas */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Surat Tugas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedEvent.stNumber && selectedEvent.stNumber !== '0' ? selectedEvent.stNumber : '-'}
                  </span>
                </div>

                {/* No Nota Dinas */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Nota Dinas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedEvent.ndNumber && selectedEvent.ndNumber !== '0' ? selectedEvent.ndNumber : '-'}
                  </span>
                </div>

                {/* Partisipan / Petugas */}
                {selectedEvent.category === 'Fasilitasi CAT' ? (
                  <div className="flex flex-col py-4 gap-2 border-b-0">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Petugas</span>
                    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Jabatan</th>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">NIP</th>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Nama Petugas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {selectedEvent.participants?.length > 0 ? (
                            selectedEvent.participants.map((p, idx) => (
                              <tr key={idx} className="bg-white dark:bg-slate-900">
                                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{p.positionName || '-'}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{p.nip || '-'}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{p.label}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="bg-white dark:bg-slate-900">
                              <td colSpan="3" className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">Tidak ada petugas</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2 border-b-0">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Partisipan</span>
                    <div className="flex flex-wrap gap-2 sm:w-2/3 sm:justify-end">
                      {selectedEvent.isAllEmployees ? (
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                          Semua Pegawai
                        </span>
                      ) : (
                        selectedEvent.participants?.length > 0 ? (
                          selectedEvent.participants.map((participant) => (
                            <span
                              key={participant.value || participant.label || participant}
                              className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {participant.label || participant}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Tidak ada spesifik</span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedDayEvents ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-lg overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Agenda {moment(selectedDayEvents.date).format('DD MMMM YYYY')}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {selectedDayEvents.events.length === 0 ? (
                <div className="py-2">
                  <EmptyState 
                    title="Tidak ada event saat ini" 
                    description="Belum ada agenda yang dijadwalkan pada hari ini." 
                    className="py-10"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setSelectedDayEvents(null);
                        setSelectedEvent(event);
                      }}
                      className="w-full rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-blue-500/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="rounded-md bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                          {event.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                        </span>
                      </div>
                      <h5 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{event.title}</h5>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default DashboardMainCalendar;
