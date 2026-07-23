import React from 'react';
import { Megaphone } from 'lucide-react';

const DashboardRunningText = ({ messages }) => {
  return (
    <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-600 px-4 py-3 text-blue-50 dark:border-blue-900/60 dark:bg-[#101d4f] dark:text-blue-100 sm:px-6">
      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
        <Megaphone size={18} className="text-blue-100 dark:text-blue-300" />
      </div>
      <div className="relative w-full overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-[marquee_24s_linear_infinite] hover:[animation-play-state:paused]">
          {messages.map((message, index) => (
            <span key={index} className="mx-8 text-sm font-medium text-blue-50/95 dark:text-blue-100/95">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardRunningText;
