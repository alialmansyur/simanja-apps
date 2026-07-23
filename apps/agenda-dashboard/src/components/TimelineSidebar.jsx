import React from 'react';
import { MapPin, Clock, CalendarX } from 'lucide-react';
import moment from 'moment';

const TimelineItem = ({ event, isPast, isCurrent, onClick }) => {
  return (
  <div onClick={onClick} className="relative flex group cursor-pointer">
    {/* Left: Time */}
    <div className="w-16 shrink-0 pt-0.5 text-right pr-4">
      <div className={`text-[11px] font-bold ${isPast ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
        {moment(event.start).format('HH:mm')}
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
        {moment(event.end).format('HH:mm')}
      </div>
    </div>

    {/* Middle: Timeline Line & Dot */}
    <div className="relative flex flex-col items-center">
      {/* Dot */}
      <div className={`z-10 w-3 h-3 mt-1.5 rounded-full border border-white dark:border-slate-900 transition-all duration-300 ${
        isCurrent ? 'bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/50 scale-125' : 
        isPast ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400 group-hover:border-blue-400'
      }`}></div>
      {/* Line */}
      <div className={`absolute top-4 bottom-[-1.5rem] w-px ${isPast ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-300 transition-colors duration-300'} group-last:hidden`}></div>
    </div>

    {/* Right: Content */}
    <div className="flex-1 pl-4 pb-6 group-hover:translate-x-1 transition-transform duration-300">
      <h4 className={`text-sm font-bold leading-tight mb-1.5 ${
        isCurrent ? 'text-blue-600 dark:text-blue-400' :
        isPast ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
      } transition-colors duration-300`}>
        {event.title}
      </h4>
      <div className="flex items-start space-x-1.5 text-xs text-slate-500 dark:text-slate-400 leading-tight">
        <MapPin size={12} className="shrink-0 mt-0.5 opacity-70" />
        <span className="line-clamp-2 leading-relaxed">{event.location}</span>
      </div>
    </div>
  </div>
)};

const TimelineSidebar = ({ events = [], onEventClick }) => {
  const now = new Date();
  const todayEvents = events
    .filter(e => moment(e.start).isSame(now, 'day'))
    .sort((a, b) => a.start - b.start);

  const currentEvent = todayEvents.find(ev => now >= ev.start && now <= ev.end);

  return (
    <div className="w-full xl:w-80 2xl:w-96 bg-slate-50 dark:bg-slate-900/50 border-t xl:border-t-0 xl:border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Agenda Hari Ini</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Anda memiliki {todayEvents.length} agenda dijadwalkan</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {currentEvent && (
          <div 
            onClick={() => onEventClick(currentEvent)}
            className="mb-8 p-6 rounded-2xl bg-blue-600 dark:bg-blue-600 text-white border border-blue-500 cursor-pointer hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-20 transition-all duration-500 pointer-events-none transform rotate-12">
               <Clock size={100} />
            </div>
            <div className="flex items-center space-x-2.5 mb-3 relative z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Sedang Berlangsung</span>
            </div>
            
            <div className="text-4xl font-black mb-2 tracking-tighter relative z-10">
              {moment(currentEvent.start).format('HH:mm')} <span className="text-2xl text-blue-300 font-bold mx-1">-</span> {moment(currentEvent.end).format('HH:mm')}
            </div>
            <div className="font-bold text-lg text-white leading-tight mb-3 relative z-10">
              {currentEvent.title}
            </div>
            <div className="flex items-center text-sm text-blue-100 font-medium relative z-10">
              <MapPin size={14} className="mr-1.5 shrink-0" />
              <span className="truncate">{currentEvent.location}</span>
            </div>
          </div>
        )}

        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4 animate-slide-up mt-8">
            <div className="bg-white dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
              <CalendarX className="text-slate-400 dark:text-slate-500" size={28} />
            </div>
            <h3 className="text-slate-700 dark:text-slate-200 font-bold text-sm">Tidak ada agenda</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">Belum ada kegiatan yang dijadwalkan untuk hari ini.</p>
          </div>
        ) : (
          <div className="relative pt-2">
            {todayEvents.map((ev) => {
              const isPast = now > ev.end;
              const isCurrent = now >= ev.start && now <= ev.end;
              return <TimelineItem key={ev.id} event={ev} isPast={isPast} isCurrent={isCurrent} onClick={() => onEventClick(ev)} />
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineSidebar;
