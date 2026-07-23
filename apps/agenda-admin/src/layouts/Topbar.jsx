import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, User, Menu, Bell, Search, Maximize, Minimize, LogOut, KeyRound, UserCircle, Check, X, Shield, ShieldAlert, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input';
import Button, { cn } from '../components/ui/Button';
import { getAdminPageMeta } from '../constants/navigation';

const Topbar = ({ toggleSidebar, toggleSidebarCollapsed, userProfile, onLogout }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const toggleShowPassword = (field) => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  
  const location = useLocation();
  const navigate = useNavigate();
  const pageMeta = getAdminPageMeta(location.pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && (document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches))) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { label: 'Belum diisi', color: 'bg-slate-200 dark:bg-slate-700', icon: Shield, textColor: 'text-slate-500' };
    let score = 0;
    if (password.length > 7) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;

    if (score < 2) return { label: 'Lemah', color: 'bg-red-500', icon: ShieldAlert, textColor: 'text-red-600 dark:text-red-400' };
    if (score < 4) return { label: 'Sedang', color: 'bg-amber-500', icon: Shield, textColor: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Kuat', color: 'bg-emerald-500', icon: ShieldCheck, textColor: 'text-emerald-600 dark:text-emerald-400' };
  };

  const strength = getPasswordStrength(passwordForm.new);

  const generatePassword = () => {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    const symbols = '!@#$%&*?';
    const numbers = '0123456789';

    let word = '';
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        word += consonants.charAt(Math.floor(Math.random() * consonants.length));
      } else {
        word += vowels.charAt(Math.floor(Math.random() * vowels.length));
      }
    }
    word = word.charAt(0).toUpperCase() + word.slice(1);

    let mix = '';
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 0) {
        mix += symbols.charAt(Math.floor(Math.random() * symbols.length));
      } else {
        mix += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
    }

    const password = `${word}${mix}`;
    setPasswordForm(prev => ({ ...prev, new: password, confirm: password }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Logic for submitting password change goes here
    setIsPasswordModalOpen(false);
    setPasswordForm({ old: '', new: '', confirm: '' });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 md:px-6">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={toggleSidebar}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 lg:hidden"
        >
          <Menu size={20} />
        </motion.button>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04, rotate: -4 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 lg:flex"
              aria-label="Ubah mode sidebar"
            >
              <Menu size={18} />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                {pageMeta.label}
              </h2>
            </motion.div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:block"
            >
              <Input
                type="search"
                placeholder="Cari menu atau halaman..."
                icon={Search}
                className="h-10 w-72 rounded-[1.25em] border-slate-200 bg-white/90 pl-11 text-sm focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
              />
            </motion.div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative hidden h-10 w-10 cursor-pointer items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400 sm:flex"
                aria-label="Notifikasi"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </motion.button>
              
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-[1.25em] border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Notifikasi</h4>
                    <span className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400">Tandai dibaca</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Rapat Evaluasi Bulanan</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Dimulai dalam 30 menit di Ruang Rapat A.</p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">Baru saja</p>
                      </div>
                    </div>
                    <div className="flex gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notula Baru Ditambahkan</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Budi menambahkan notula &quot;Pembahasan IT&quot;.</p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">2 jam yang lalu</p>
                      </div>
                    </div>
                  </div>
                  <button className="mt-2 w-full cursor-pointer rounded-[1em] bg-slate-50 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-slate-800/80">
                    Lihat Semua Notifikasi
                  </button>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.04, rotate: isDarkMode ? -10 : 10 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleDarkMode}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleFullScreen}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[1.25em] border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-blue-400"
              title={isFullScreen ? 'Keluar Fullscreen' : 'Mode Fullscreen'}
            >
              {isFullScreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </motion.button>

            <div className="relative">
              <motion.div 
                whileHover={{ y: -1 }} 
                className="flex cursor-pointer items-center gap-3"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-200">
                    {userProfile.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {userProfile.role}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[1.25em] bg-gradient-to-br from-blue-600 to-blue-500 font-bold text-white">
                  <span className="sm:hidden">
                    <User size={17} />
                  </span>
                  <span className="hidden sm:inline">
                    {userProfile.initials}
                  </span>
                </div>
              </motion.div>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-3 w-56 z-50 rounded-[1.25em] border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <button 
                      onClick={() => { setIsProfileDropdownOpen(false); navigate('/admin/profile'); }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
                    >
                      <UserCircle size={16} />
                      Profil
                    </button>
                    <button 
                      onClick={() => { setIsProfileDropdownOpen(false); setIsPasswordModalOpen(true); }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
                    >
                      <KeyRound size={16} />
                      Ubah Kata Sandi
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button 
                      onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && createPortal(
        <div className="animate-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card flex w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Pengaturan Akun
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Ubah Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Kata Sandi Lama
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword.old ? "text" : "password"}
                      value={passwordForm.old}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                      required
                      className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('old')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword.old ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                    >
                      {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kata Sandi Baru
                    </span>
                    <button 
                      type="button" 
                      onClick={generatePassword}
                      className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <RefreshCw size={14} />
                      Generate By System
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      required
                      className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('new')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword.new ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                    >
                      {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between px-1">
                    <div className="flex w-full items-center gap-1.5 pr-4">
                      <div className={cn("h-1.5 flex-1 rounded-full", passwordForm.new.length > 0 ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                      <div className={cn("h-1.5 flex-1 rounded-full", strength.label === 'Sedang' || strength.label === 'Kuat' ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                      <div className={cn("h-1.5 flex-1 rounded-full", strength.label === 'Kuat' ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs font-bold", strength.textColor)}>
                      <strength.icon size={14} />
                      {strength.label}
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Konfirmasi Kata Sandi Baru
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      required
                      className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('confirm')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword.confirm ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                    >
                      {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(false)} className="cursor-pointer">
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!passwordForm.new || passwordForm.new !== passwordForm.confirm}
                  className="cursor-pointer gap-2 border-blue-600 bg-blue-600 shadow-none hover:bg-blue-700 hover:shadow-none disabled:opacity-50 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Check size={16} />
                  Simpan Kata Sandi
                </Button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </header>
  );
};

export default Topbar;
