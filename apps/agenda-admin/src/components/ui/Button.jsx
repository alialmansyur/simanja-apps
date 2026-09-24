import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-[0.95em] font-semibold text-sm tracking-[0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm",
    secondary: "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-slate-100 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-slate-900 dark:hover:text-blue-300",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50 text-slate-600 dark:text-slate-400",
  };

  const sizes = {
    default: "px-5 py-2.5 min-h-[42px]",
    sm: "px-3.5 py-2 min-h-[38px] text-[0.8rem]",
    lg: "px-8 py-3 min-h-[48px] text-base",
    icon: "h-10 w-10 min-h-[40px] p-0",
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
