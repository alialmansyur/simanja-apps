import React, { useMemo } from 'react';
import moment from 'moment';

const YearView = ({ date, events, onView, onNavigate }) => {
  const year = moment(date).year();

  // Create an array of 12 months
  const months = useMemo(() => {
    const m = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = moment(date).month(i).startOf('month');
      const monthEnd = moment(date).month(i).endOf('month');
      const days = [];

      // Add padding for first week
      const startDay = monthStart.day();
      for (let d = 0; d < startDay; d++) {
        days.push(null);
      }

      // Add actual days
      for (let d = 1; d <= monthEnd.date(); d++) {
        const currentDate = moment(monthStart).date(d);
        // Find events for this day
        const dayEvents = events.filter(e => {
          const evStart = moment(e.start).startOf('day');
          const evEnd = moment(e.end).endOf('day');
          return currentDate.isBetween(evStart, evEnd, 'day', '[]');
        });
        days.push({
          date: currentDate.toDate(),
          dayNum: d,
          events: dayEvents,
          isToday: currentDate.isSame(moment(), 'day')
        });
      }
      m.push({
        name: monthStart.format('MMMM'),
        days
      });
    }
    return m;
  }, [date, events]);

  const handleDayClick = (dayDate) => {
    if (onNavigate) {
      onNavigate('DATE', dayDate);
      if (onView) onView('day');
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 overflow-y-auto h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((month, mIdx) => (
          <div key={mIdx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <h3 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-3 capitalize">{month.name}</h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((dayName, i) => (
                <div key={i} className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{dayName}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((day, dIdx) => {
                if (!day) return <div key={`empty-${dIdx}`} className="h-8"></div>;

                const hasEvents = day.events.length > 0;
                const isToday = day.isToday;

                return (
                  <button
                    key={`day-${day.dayNum}`}
                    onClick={() => handleDayClick(day.date)}
                    className={`relative flex items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-700
                      ${isToday ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600' : 'text-slate-700 dark:text-slate-300'}
                    `}
                    title={hasEvents ? `${day.events.length} Agenda` : ''}
                  >
                    {day.dayNum}
                    {hasEvents && (
                      <div className="absolute bottom-1 flex space-x-[2px] justify-center w-full">
                        <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`}></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

YearView.range = (date) => {
  return [moment(date).startOf('year').toDate(), moment(date).endOf('year').toDate()];
};

YearView.navigate = (date, action) => {
  switch (action) {
    case 'PREV':
      return moment(date).subtract(1, 'year').toDate();
    case 'NEXT':
      return moment(date).add(1, 'year').toDate();
    default:
      return date;
  }
};

YearView.title = (date) => {
  return moment(date).format('YYYY');
};

export default YearView;
