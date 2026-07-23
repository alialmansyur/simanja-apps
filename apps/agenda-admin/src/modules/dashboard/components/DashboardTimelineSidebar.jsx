import React from 'react';
import moment from 'moment';
import { Clock, MapPin } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';

const TimelineItem = ({ event, isPast, isCurrent, onClick }) => {
  const timeLabel = `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`;

  return (
    <div className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-start gap-4">
      <div className="relative flex justify-center self-stretch">
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
        <div
          className={`relative mt-3 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 ${
            isCurrent ? 'bg-blue-500' : isPast ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-400'
          }`}
        />
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`mb-3 w-full rounded-[var(--radius-card)] border px-4 py-3.5 text-left transition hover:-translate-y-0.5 ${
          isCurrent
            ? 'border-blue-200 bg-blue-50/70 dark:border-blue-500/50 dark:bg-slate-800'
            : 'border-slate-200 bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-300">
          <Clock size={12} />
          <span>{timeLabel}</span>
        </div>
        <h4 className={`mt-2 text-base font-bold leading-tight ${isPast ? 'text-slate-400 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {event.title}
        </h4>
        <div className="mt-2 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{event.location}</span>
        </div>
      </button>
    </div>
  );
};

const DashboardTimelineSidebar = ({ events, onEventClick }) => {
  const now = new Date();
  const todayEvents = events
    .filter((event) => moment(event.start).isSame(now, 'day'))
    .sort((left, right) => left.start - right.start);
  const currentEvent = todayEvents.find((event) => now >= event.start && now <= event.end);

  return (
    <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:col-start-2 lg:row-start-1 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-5 py-5 xl:px-6 dark:border-slate-800">
        <h3 className="text-[1.95rem] font-bold tracking-tight text-slate-900 dark:text-white">Agenda Hari Ini</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Anda memiliki {todayEvents.length} agenda dijadwalkan</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 xl:px-6">
        {currentEvent ? (
          <button
            type="button"
            onClick={() => onEventClick(currentEvent)}
            className="relative mb-5 w-full overflow-hidden rounded-[var(--radius-card)] border border-blue-500 bg-blue-600 px-4 py-4 text-left text-white transition hover:bg-blue-500"
          >
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                  </span>
                  Sedang Berlangsung
                </div>
                <span className="rounded-full border border-white/20 bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
                  Highlight
                </span>
              </div>
              <p className="mt-3 text-[1.55rem] font-black tracking-tight">
                {moment(currentEvent.start).format('HH:mm')}
                <span className="mx-2 text-blue-200">-</span>
                {moment(currentEvent.end).format('HH:mm')}
              </p>
              <h4 className="mt-2.5 text-lg font-bold leading-tight">{currentEvent.title}</h4>
              <div className="mt-2.5 flex items-center gap-2 text-sm text-blue-100">
                <MapPin size={14} />
                <span>{currentEvent.location}</span>
              </div>
            </div>
          </button>
        ) : null}

        <div className="space-y-0">
          {todayEvents.map((event) => (
            <TimelineItem
              key={event.id}
              event={event}
              isPast={now > event.end}
              isCurrent={now >= event.start && now <= event.end}
              onClick={() => onEventClick(event)}
            />
          ))}
          {todayEvents.length === 0 ? (
            <EmptyState 
              title="Tidak ada agenda" 
              description="Tidak ada agenda terjadwal hari ini." 
              className="rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60 p-5 py-8"
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default DashboardTimelineSidebar;
