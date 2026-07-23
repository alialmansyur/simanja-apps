import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, Sun, Moon, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isShake, setIsShake] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && (document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches))) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
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

  const checkCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  // If already logged in, redirect
  if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin';
      return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username || !formData.password) {
      setError('Username dan password harus diisi');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }

    setIsLoading(true);
    
    const result = await login({ email: formData.username, password: formData.password });
    
    setIsLoading(false);
    if (result?.requires_mfa) {
      navigate('/mfa-verify', { 
          state: { 
              from: location.state?.from,
              setupRequired: result.mfa_setup_required
          } 
      });
    } else if (result?.success) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } else {
      setError('Username atau password salah');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* Tombol Toggle Tema */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 lg:left-6 lg:right-auto z-50 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      {/* Sisi Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 xl:px-24 relative overflow-hidden">
        
        {/* Dekorasi tipis di background form */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 dark:opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium lg:text-base leading-relaxed">
              Silakan masukkan kredensial Anda untuk mengakses panel admin.
            </p>
          </div>
          
          {/* Pesan Error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.div animate={isShake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Masukkan username Anda"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="new-password"
                  icon={User}
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    Lupa password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password Anda"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyUp={checkCapsLock}
                  autoComplete="new-password"
                  icon={Lock}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors focus:outline-none"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                {/* Caps Lock Warning */}
                <AnimatePresence>
                  {capsLockActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute -bottom-6 right-0 flex items-center gap-1.5 text-xs font-medium text-orange-500 dark:text-orange-400"
                    >
                      <Keyboard size={12} />
                      <span>Caps Lock menyala</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <Button type="submit" className="w-full h-14 py-0 text-base rounded-2xl relative overflow-hidden group cursor-pointer" disabled={isLoading}>
                  {/* Efek kilauan hover pada tombol */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                  
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memverifikasi...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Masuk ke Sistem
                      <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
          
          {/* Footer Form */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center"
          >
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              &copy; 2026 Sistem Manajemen Jadwal &amp; Agenda SIDIGI x AAM
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Sisi Kosong Kanan */}
      <div className="hidden lg:flex lg:w-7/12 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Background Decorative */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900 z-0"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-3xl opacity-50 mix-blend-screen transition-all duration-1000 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl opacity-50 mix-blend-screen transition-all duration-1000 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Tambahan elemen abstrak tipis */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none"></div>
      </div>
      
    </div>
  );
};

export default LoginPage;
