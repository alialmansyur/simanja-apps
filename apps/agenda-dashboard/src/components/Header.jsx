import React, { useState, useEffect } from 'react';
import LiveClock from './LiveClock';
import { Sun, Moon, Maximize, Minimize, RefreshCw, Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onRefresh, isRefreshing, settings, lastUpdated }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // Check initial system/localStorage preference
    if (document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm h-16 flex items-center justify-between px-6 z-20 relative">
      <div className="flex items-center space-x-4">
        {settings?.['app.logo'] ? (
           <motion.img
             whileHover={{ scale: 1.04 }}
             src={settings['app.logo'].startsWith('http') ? settings['app.logo'] : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${settings['app.logo']}`}
             alt="Logo"
             className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.25em] object-contain bg-white"
           />
        ) : (
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.25em] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-xs font-bold text-white uppercase"
          >
            {(settings?.['app.short_name'] || 'SM').substring(0, 2)}
          </motion.div>
        )}
        <h1 className="text-2xl font-extrabold text-blue-700 dark:text-blue-500 tracking-tight">
          SIMANJA
        </h1>
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <div className="hidden sm:block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{settings?.['app.company'] || settings?.['instansi.nama'] || 'Kantor Regional III BKN'}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden md:block">
          <LiveClock />
        </div>
        
        <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-700 pl-4">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRefresh}
            className={`flex h-10 w-10 items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 cursor-pointer ${isRefreshing ? 'animate-spin pointer-events-none' : ''}`}
            title={`Refresh Data ${lastUpdated ? `(Terakhir: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : ''}`}
          >
            <RefreshCw size={17} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.04, rotate: isDarkMode ? -10 : 10 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 cursor-pointer"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowShortcuts(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 cursor-pointer"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={17} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowShortcuts(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100">
                  <Keyboard size={20} className="text-blue-500" />
                  <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
                </div>
                <button 
                  onClick={() => setShowShortcuts(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Pencarian Agenda</span>
                  <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">/</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Tampilan Bulan</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">M</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Tampilan Minggu</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">W</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Tampilan Hari</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">D</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Kembali ke Hari Ini</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">T</kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Tutup Modal / Popup</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">Esc</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
