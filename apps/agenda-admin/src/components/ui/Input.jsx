import React from 'react';
import { cn } from './Button';

const Input = React.forwardRef(({ className, type = "text", error, icon: Icon, rightElement, ...props }, ref) => {
  return (
    <div className="w-full relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-[1.25em] border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-100/50 hover:border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-50 dark:focus:border-blue-400 dark:focus:bg-slate-900",
          Icon && "pl-11",
          rightElement && "pr-12",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 transition-colors duration-300">
          {rightElement}
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium pl-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
