import React from 'react';
import { motion } from 'framer-motion';

const SplashLoader = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 border-[3px] border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-blue-600 border-t-transparent z-10"></div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
        Memuat Data ...
      </p>
    </motion.div>
  );
};

export default SplashLoader;
