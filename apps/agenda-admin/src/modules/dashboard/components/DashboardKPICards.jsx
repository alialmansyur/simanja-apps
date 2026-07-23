import React from 'react';
import { CalendarCheck, CalendarDays, Clock } from 'lucide-react';

const DashboardKPICards = ({ data = {} }) => {
  const cards = [
    {
      title: 'Total Agenda Bulan Ini',
      value: data.totalAgendas || '0',
      icon: CalendarDays,
      iconClass: 'bg-blue-100 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/12 dark:text-blue-300 dark:ring-blue-400/10',
    },
    {
      title: 'Agenda Diselesaikan',
      value: data.completedAgendas || '0',
      icon: CalendarCheck,
      iconClass: 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/10',
    },
    {
      title: 'Reminder Mendatang',
      value: data.upcomingReminders || '0',
      icon: Clock,
      iconClass: 'bg-amber-100 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-400/10',
    },
  ];

  return (
    <div className="grid w-full gap-4 md:grid-cols-3">
      {cards.map(({ title, value, icon: Icon, iconClass }) => (
        <div
          key={title}
          className="rounded-[var(--radius-card)] bg-white shadow-sm ring-1 ring-slate-100 px-5 py-4 dark:bg-slate-900/90 dark:ring-slate-800/80"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="max-w-[10rem] text-sm leading-5 text-slate-500 dark:text-slate-300/95">{title}</p>
              <p className="mt-4 text-[2.35rem] leading-none font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
            </div>
            <div className={`rounded-[1rem] p-2.5 ${iconClass}`}>
              <Icon size={18} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardKPICards;
