import React from 'react';
import { Megaphone } from 'lucide-react';

const RunningText = ({ messages }) => {
  return (
    <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-600 px-4 py-3 text-blue-50 dark:border-blue-900/60 dark:bg-[#101d4f] dark:text-blue-100 sm:px-6 group cursor-default" title="Arahkan kursor untuk menjeda teks">
      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
        <Megaphone size={18} className="text-blue-100 dark:text-blue-300 animate-pulse" />
      </div>
      <div 
        className="relative w-full overflow-hidden whitespace-nowrap"
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
        }}
      >
        <div className="inline-block animate-[marquee_24s_linear_infinite] group-hover:[animation-play-state:paused] group-hover:opacity-90 transition-opacity duration-300">
          {messages.map((msg, idx) => (
            <span key={idx} className="mx-8 text-sm font-medium text-blue-50/95 dark:text-blue-100/95">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunningText;
