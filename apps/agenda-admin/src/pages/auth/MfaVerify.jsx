import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, Loader2, Sun, Moon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axios';
import Button from '../../components/ui/Button';

const MfaVerify = () => {
    const { verifyMfa } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [setupRequired, setSetupRequired] = useState(location.state?.setupRequired || false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isShake, setIsShake] = useState(false);
    
    const inputRefs = useRef([]);

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

    useEffect(() => {
        // Redirect back to login if no temp token
        if (!localStorage.getItem('mfa_temp_token')) {
            navigate('/login', { replace: true });
        }
        
        if (setupRequired) {
            fetchSetupData();
        }
        
        // Focus first input
        if (inputRefs.current[0] && !setupRequired) {
            inputRefs.current[0].focus();
        }
    }, [setupRequired]);

    const fetchSetupData = async () => {
        try {
            const token = localStorage.getItem('mfa_temp_token');
            const res = await axiosInstance.get('/mfa/setup', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrCode(res.data.qr_code);
            setSecret(res.data.secret);
        } catch (error) {
            toast.error('Gagal memuat data setup MFA');
        }
    };

    const handleChange = (index, value) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;
        
        const newCode = [...code];
        
        // Handle pasting full 6 digits
        if (value.length === 6) {
            for (let i = 0; i < 6; i++) {
                newCode[i] = value[i];
            }
            setCode(newCode);
            inputRefs.current[5]?.focus();
            return;
        }

        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous on backspace if current is empty
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const otpCode = code.join('');
        if (otpCode.length < 6) {
            setIsShake(true);
            setTimeout(() => setIsShake(false), 500);
            return;
        }
        
        setIsLoading(true);
        const result = await verifyMfa(otpCode);
        setIsLoading(false);
        
        if (result.success) {
            toast.success('Verifikasi MFA berhasil');
            const from = location.state?.from?.pathname || '/admin';
            navigate(from, { replace: true });
        } else {
            toast.error(result.message || 'Kode verifikasi tidak valid');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setIsShake(true);
            setTimeout(() => setIsShake(false), 500);
        }
    };

    // Auto submit when 6 digits are filled
    useEffect(() => {
        if (code.every(digit => digit !== '') && code.length === 6 && !isLoading) {
            handleSubmit();
        }
    }, [code]);

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
            <div className="w-full lg:w-5/12 flex flex-col justify-center px-12 sm:px-24 xl:px-32 relative overflow-hidden">
                
                {/* Dekorasi tipis di background form */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 dark:opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>
                
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md mx-auto relative z-10"
                >
                    {/* Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            Verifikasi MFA
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-medium lg:text-base leading-relaxed">
                            {setupRequired 
                                ? 'Silakan pindai kode QR di bawah ini dengan aplikasi authenticator Anda (mis. Google Authenticator) dan masukkan 6 digit kode yang muncul.' 
                                : 'Masukkan 6 digit kode dari aplikasi authenticator Anda untuk memverifikasi login.'}
                        </p>
                    </div>

                    {setupRequired && qrCode && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm"
                        >
                            <div className="bg-white p-2 rounded-xl inline-block border border-slate-200 mb-4">
                                <img src={`data:image/svg+xml;base64,${qrCode}`} alt="MFA QR Code" className="w-32 h-32 lg:w-40 lg:h-40" />
                            </div>
                            <div className="w-full">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Secret Key</span>
                                <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg font-mono text-sm tracking-widest block border border-slate-200 dark:border-slate-700">
                                    {secret}
                                </code>
                            </div>
                        </motion.div>
                    )}

                    {/* Form */}
                    <motion.div animate={isShake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                            <div className="flex justify-between gap-2 sm:gap-3 w-full">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all focus:outline-none"
                                        value={digit}
                                        onChange={e => handleChange(index, e.target.value)}
                                        onKeyDown={e => handleKeyDown(index, e)}
                                        maxLength={6}
                                    />
                                ))}
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="pt-4"
                            >
                                <Button type="submit" className="w-full h-14 py-0 text-base rounded-2xl relative overflow-hidden group cursor-pointer" disabled={isLoading || code.some(d => d === '')}>
                                    {/* Efek kilauan hover pada tombol */}
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                                    
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Memverifikasi...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-3">
                                            Verifikasi & Masuk
                                            <ShieldCheck size={18} className="transition-transform group-hover:scale-110" />
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                            
                            <div className="text-center mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        localStorage.removeItem('mfa_temp_token');
                                        navigate('/login');
                                    }}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Kembali ke Login
                                </button>
                            </div>
                        </form>
                    </motion.div>
                    
                    {/* Footer Form to match Login */}
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

export default MfaVerify;
