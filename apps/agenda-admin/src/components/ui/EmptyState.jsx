import React from 'react';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = SearchX, 
  title = "Data tidak ditemukan", 
  description,
  actionLabel,
  onAction,
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center ${className}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/60"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon size={48} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="text-lg font-bold text-slate-700 dark:text-slate-200"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed"
        >
          {description}
        </motion.p>
      )}
      {actionLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mt-6"
        >
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-[1em] bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {actionLabel}
          </button>
        </motion.div>
      )}
    </div>
  );
}
