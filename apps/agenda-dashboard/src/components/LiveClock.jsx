import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end text-sm">
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {format(time, 'EEEE, d MMMM yyyy', { locale: id })}
      </span>
      <span className="font-medium text-slate-500 dark:text-slate-400">
        {format(time, 'HH:mm:ss')} WIB
      </span>
    </div>
  );
};

export default LiveClock;
