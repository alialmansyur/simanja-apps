import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import 'moment/locale/id';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ExternalLink, CalendarPlus, Share2, Clock, ChevronLeft, ChevronRight, CalendarDays, Search, ChevronDown, Download, MapPin, Users, X, Filter } from 'lucide-react';

moment.locale('id');
const localizer = momentLocalizer(moment);

// Removed mockEvents


const MainCalendar = ({ events = [], selectedEvent, setSelectedEvent }) => {
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    units: [],
    categories: [],
    statuses: [],
    participantQuery: ''
  });

  const filterOptions = useMemo(() => {
    const units = new Set();
    const categories = new Set();
    const statuses = new Set();

    events.forEach(ev => {
      if (ev.team) units.add(ev.team);
      if (ev.category) categories.add(ev.category);
      if (ev.status) statuses.add(ev.status);
    });

    return {
      units: Array.from(units).sort(),
      categories: Array.from(categories).sort(),
      statuses: Array.from(statuses).sort()
    };
  }, [events]);

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type];
      if (current.includes(value)) {
        return { ...prev, [type]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  };

  // Update Time Indicator Line
  useEffect(() => {
    const updateTimeLine = () => {
      if (view === 'month') return;
      
      const todayColumn = document.querySelector('.rbc-day-slot.rbc-today');
      if (todayColumn) {
        let indicator = todayColumn.querySelector('.custom-time-indicator');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.className = 'custom-time-indicator absolute left-0 right-0 h-[2px] bg-red-500 z-50 pointer-events-none shadow-sm';
          const dot = document.createElement('div');
          dot.className = 'absolute -left-[5px] -top-[4px] w-[10px] h-[10px] rounded-full bg-red-500';
          indicator.appendChild(dot);
          todayColumn.appendChild(indicator);
          todayColumn.style.position = 'relative';
        }
        
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const totalMinutes = 24 * 60; // 00:00 to 23:59
        const topPercent = (minutesSinceMidnight / totalMinutes) * 100;
        indicator.style.top = `${topPercent}%`;
      }
    };

    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60000);
    return () => clearInterval(interval);
  }, [view, date]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchSearch = searchQuery === '' || 
                          event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchUnit = filters.units.length === 0 || filters.units.includes(event.team);
      const matchCategory = filters.categories.length === 0 || filters.categories.includes(event.category);
      const matchStatus = filters.statuses.length === 0 || filters.statuses.includes(event.status);
      
      let matchParticipant = filters.participantQuery.trim() === '';
      if (!matchParticipant && event.participants) {
        if (event.isAllEmployees) {
           matchParticipant = 'Semua Pegawai'.toLowerCase().includes(filters.participantQuery.toLowerCase());
        }
        if (!matchParticipant) {
           for (const p of event.participants) {
             const pName = typeof p === 'string' ? p : p.name;
             if (pName.toLowerCase().includes(filters.participantQuery.toLowerCase())) {
               matchParticipant = true;
               break;
             }
           }
        }
      }

      return matchSearch && matchUnit && matchCategory && matchStatus && matchParticipant;
    });
  }, [events, searchQuery, filters]);

  const handleSelectSlot = (slotInfo) => {
    if (slotInfo.action === 'select' || slotInfo.action === 'click') {
      setSelectedEvent(null); // Ensure event modal is closed
      const dayEvents = filteredEvents.filter(event => 
        moment(event.start).isSame(slotInfo.start, 'day')
      );
      setSelectedDayEvents({
        date: slotInfo.start,
        events: dayEvents
      });
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedDayEvents(null); // Ensure day modal is closed
    setSelectedEvent(event);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedEvent(null);
        setSelectedDayEvents(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getEventStatus = (event) => {
    const now = new Date();
    if (now >= event.start && now <= event.end) {
      return <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>Sedang Berjalan</span>;
    } else if (now < event.start) {
      return <span className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"><Clock size={12} />Akan Datang</span>;
    } else {
      return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">Selesai</span>;
    }
  };

  const downloadICS = (event) => {
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${formatDate(event.start)}\nDTEND:${formatDate(event.end)}\nLOCATION:${event.location}\nDESCRIPTION:${event.type} - ${event.team}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryColors = {
    'Rapat': '#059669', // emerald-600
    'Kegiatan': '#4f46e5', // blue-600
    'Sosialisasi': '#d97706', // amber-600
    'Fasilitasi CAT': '#0284c7', // sky-600
  };

  const getCategoryColor = (category) => categoryColors[category] || '#64748b'; // default slate-500

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: getCategoryColor(event.category),
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.8rem',
        padding: '2px 6px',
        fontWeight: '500'
      }
    };
  };

  const generateGoogleCalendarUrl = (event) => {
    const start = moment(event.start).format('YYYYMMDDTHHmmss');
    const end = moment(event.end).format('YYYYMMDDTHHmmss');
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(`Lokasi: ${event.location || '-'}\nNo ST: ${event.stNumber || '-'}\nTim: ${event.team || '-'}`);
    return `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${start}/${end}&details=${details}`;
  };

  const CustomToolbar = (toolbar) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef(null);

    const goToBack = () => { toolbar.onNavigate('PREV'); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); };
    const goToCurrent = () => { toolbar.onNavigate('TODAY'); };
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
          setShowDatePicker(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-2 gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
          <button onClick={goToCurrent} className="flex items-center space-x-1.5 px-4 py-1.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <CalendarDays size={16} />
            <span className="hidden sm:inline">Hari Ini</span>
          </button>
          <button onClick={goToBack} className="flex items-center space-x-1 px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToNext} className="flex items-center space-x-1 px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Selanjutnya">
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="relative group flex items-center justify-center cursor-pointer px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" ref={datePickerRef}>
          <div onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mr-2">{toolbar.label}</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDatePicker ? 'rotate-180 text-blue-500' : 'group-hover:text-blue-500'}`} />
          </div>
          
          {showDatePicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 w-64 animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => toolbar.onNavigate('PREV', new Date(toolbar.date.getFullYear() - 1, toolbar.date.getMonth(), 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16}/></button>
                <span className="font-bold text-slate-800 dark:text-slate-100">{toolbar.date.getFullYear()}</span>
                <button onClick={() => toolbar.onNavigate('NEXT', new Date(toolbar.date.getFullYear() + 1, toolbar.date.getMonth(), 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={16}/></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((m, idx) => (
                  <button 
                    key={m}
                    onClick={() => {
                      toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear(), idx, 1));
                      setShowDatePicker(false);
                    }}
                    className={`py-2 text-sm rounded-lg transition-colors cursor-pointer ${toolbar.date.getMonth() === idx ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl relative">
          {['month', 'week', 'day'].map((v) => {
            const labels = { month: 'Bulan', week: 'Minggu', day: 'Hari' };
            const isActive = toolbar.view === v;
            return (
              <button
                key={v}
                onClick={() => toolbar.onView(v)}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors z-10 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="view-toggle"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span className="relative z-10">{labels[v]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const CustomEvent = ({ event }) => {
    return (
      <div className="group relative w-full h-full flex items-center">
        <div className="truncate w-full">{event.title}</div>
        
        {/* Hover Tooltip */}
        <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[250px] bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-left rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none border border-slate-700 dark:border-slate-200">
          <p className="font-bold mb-1.5 text-sm whitespace-normal leading-tight">{event.title}</p>
          <div className="flex items-center text-slate-300 dark:text-slate-500 mb-1 text-xs font-medium">
             <Clock size={12} className="mr-1.5 shrink-0" />
             <span>{moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</span>
          </div>
          <div className="flex items-start text-slate-300 dark:text-slate-500 text-xs font-medium">
             <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0" />
             <span className="whitespace-normal leading-tight">{event.location}</span>
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-white"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex-1 flex flex-col min-h-[600px] relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kalender Kegiatan</h3>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border cursor-pointer ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}
          >
            <Filter size={16} />
            <span>Filter</span>
            {(filters.units.length > 0 || filters.categories.length > 0 || filters.statuses.length > 0 || filters.participantQuery !== '') && (
              <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                {filters.units.length + filters.categories.length + filters.statuses.length + (filters.participantQuery ? 1 : 0)}
              </span>
            )}
          </button>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari agenda..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-slide-up origin-top">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">Filter Spesifik</h4>
            <button 
              onClick={() => setFilters({ units: [], categories: [], statuses: [], participantQuery: '' })}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset Semua
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Unit Kerja */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Unit Kerja</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {filterOptions.units.map(unit => (
                  <label key={unit} className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filters.units.includes(unit)}
                      onChange={() => toggleFilter('units', unit)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate">{unit}</span>
                  </label>
                ))}
                {filterOptions.units.length === 0 && <p className="text-xs text-slate-400">Tidak ada data</p>}
              </div>
            </div>
            
            {/* Kategori */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Kategori Agenda</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {filterOptions.categories.map(cat => (
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleFilter('categories', cat)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate">{cat}</span>
                  </label>
                ))}
                {filterOptions.categories.length === 0 && <p className="text-xs text-slate-400">Tidak ada data</p>}
              </div>
            </div>

            {/* Status */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Status</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {filterOptions.statuses.map(status => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filters.statuses.includes(status)}
                      onChange={() => toggleFilter('statuses', status)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate">{status}</span>
                  </label>
                ))}
                {filterOptions.statuses.length === 0 && <p className="text-xs text-slate-400">Tidak ada data</p>}
              </div>
            </div>

            {/* Partisipan */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Cari NIP / Partisipan</h5>
              <div className="relative mt-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Masukkan NIP atau Nama..." 
                  value={filters.participantQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, participantQuery: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 px-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori:</span>
        {filterOptions.categories.map(cat => (
          <div key={cat} className="flex items-center space-x-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: getCategoryColor(cat) }}
            ></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{cat}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden p-5 calendar-container">
        {/* We add a custom wrapper class to target rbc classes via tailwind if needed */}
        <style dangerouslySetInnerHTML={{__html: `
          .calendar-container .rbc-header { padding: 10px 0; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; color: #64748b; border-bottom: 1px solid #e2e8f0; border-top: 0px !important; }
          .calendar-container .rbc-today { background-color: #f8fafc; }
          .dark .calendar-container .rbc-today { background-color: #0f172a; }
          .dark .calendar-container .rbc-header { border-bottom-color: #1e293b; color: #94a3b8; border-left-color: #1e293b; }
          .calendar-container .rbc-month-view, .calendar-container .rbc-time-view, .calendar-container .rbc-agenda-view { border-top: 0px; border-left: 0px; border-right: 0px; border-bottom: 0px; }
          .dark .calendar-container .rbc-month-view, .dark .calendar-container .rbc-month-row, .dark .calendar-container .rbc-day-bg, .dark .calendar-container .rbc-time-view, .dark .calendar-container .rbc-time-header-content, .dark .calendar-container .rbc-time-content, .dark .calendar-container .rbc-timeslot-group, .dark .calendar-container .rbc-agenda-view { border-color: #1e293b; }
          .calendar-container .rbc-event { transition: all 0.2s; overflow: visible !important; }
          .calendar-container .rbc-event-content { overflow: visible !important; }
          .calendar-container .rbc-month-row { overflow: visible !important; }
          .calendar-container .rbc-row-content { z-index: 10; }
          .calendar-container .rbc-event:hover { transform: translateY(-1px); z-index: 50 !important; }
          .calendar-container .rbc-toolbar { display: none; } /* Hide default toolbar if it leaks */
          
          /* Off-range days (previous/next month) */
          .calendar-container .rbc-off-range-bg { background-color: #f8fafc; }
          .calendar-container .rbc-off-range { color: #cbd5e1; }
          .dark .calendar-container .rbc-off-range-bg { background-color: #020617; } /* slate-950 */
          .dark .calendar-container .rbc-off-range { color: #334155; opacity: 0.7; }
          
          /* Live Time Indicator (Red line in Week/Day view) */
          .calendar-container .rbc-current-time-indicator { 
            background-color: #ef4444; 
            height: 2px;
            z-index: 5;
          }
          .calendar-container .rbc-current-time-indicator::before {
            content: '';
            position: absolute;
            left: -4px;
            top: -4px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #ef4444;
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          views={['month', 'week', 'day']}
          messages={{
            next: "Selanjutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari"
          }}
        />
      </div>

      {/* Specific Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
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
                {/* Deskripsi */}
                <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Deskripsi</span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                    {selectedEvent.description || '-'}
                  </div>
                </div>

                {/* Kategori */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori</span>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {selectedEvent.category || 'Rapat'}
                  </span>
                </div>

                {/* Waktu Pelaksanaan */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Waktu Pelaksanaan</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span>{selectedEvent.date || moment(selectedEvent.start).format('dddd, DD MMM YYYY')}, {selectedEvent.time || `${moment(selectedEvent.start).format('HH:mm')} - ${moment(selectedEvent.end).format('HH:mm')} WIB`}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lokasi</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <MapPin size={16} className="text-blue-500" />
                    <span>{selectedEvent.location || '-'}</span>
                  </div>
                </div>

                {/* Tautan Meeting (Jika Online) */}
                {selectedEvent.isOnline && selectedEvent.onlineUrl && (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tautan Meeting</span>
                    <a href={selectedEvent.onlineUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      Link Meeting
                    </a>
                  </div>
                )}

                {/* No Surat Tugas */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Surat Tugas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedEvent.stNumber && selectedEvent.stNumber !== '0' ? selectedEvent.stNumber : '-'}
                  </span>
                </div>

                {/* Tim Kerja */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tim Kerja</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <span>{selectedEvent.team || '-'}</span>
                  </div>
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
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Nama Petugas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {selectedEvent.participants?.length > 0 ? (
                            selectedEvent.participants.map((p, idx) => (
                              <tr key={idx} className="bg-white dark:bg-slate-900">
                                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{p.position || '-'}</td>
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{p.name || p}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="bg-white dark:bg-slate-900">
                              <td colSpan={2} className="px-4 py-3 text-center text-slate-500">Tidak ada petugas</td>
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
                          selectedEvent.participants.map((participant, index) => (
                            <span
                              key={index}
                              className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {participant}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Tidak ada spesifik</span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Actions (for public to save to calendar) */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => downloadICS(selectedEvent)}
                    className="flex-1 flex justify-center items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    <CalendarPlus size={16} />
                    <span>Simpan Jadwal (.ics)</span>
                  </button>
                  <a 
                    href={generateGoogleCalendarUrl(selectedEvent)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex justify-center items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    <ExternalLink size={16} />
                    <span>Google Calendar</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Day Events Modal */}
      <AnimatePresence>
        {selectedDayEvents && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md cursor-pointer"
            onClick={() => setSelectedDayEvents(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                Agenda {moment(selectedDayEvents.date).format('DD MMMM YYYY')}
              </h2>
              <button 
                onClick={() => setSelectedDayEvents(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {selectedDayEvents.events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CalendarPlus className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-slate-700 dark:text-slate-300 font-medium">Tidak ada event saat ini</h3>
                  <p className="text-slate-500 text-sm mt-1">Anda memiliki waktu luang di hari ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.events.map(ev => (
                    <div 
                      key={ev.id} 
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDayEvents(null);
                        setSelectedEvent(ev);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 uppercase">
                          {ev.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {moment(ev.start).format('HH:mm')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{ev.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center">
                        <Share2 size={12} className="mr-1.5" />
                        {ev.location}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainCalendar;
