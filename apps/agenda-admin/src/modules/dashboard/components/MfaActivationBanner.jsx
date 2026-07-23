import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MfaActivationBanner = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user exists and MFA is not active
        if (user && !user.two_factor_confirmed_at) {
            // Check if it was already dismissed in this session
            const isDismissed = sessionStorage.getItem('mfa_banner_dismissed');
            if (!isDismissed) {
                setIsOpen(true);
            }
        }
    }, [user]);

    const isForceMfa = settings?.force_mfa === true || settings?.force_mfa === '1' || settings?.force_mfa === 'true';

    const handleDismiss = () => {
        if (!isForceMfa) {
            sessionStorage.setItem('mfa_banner_dismissed', 'true');
            setIsOpen(false);
        }
    };

    const handleActivate = () => {
        sessionStorage.setItem('mfa_banner_dismissed', 'true');
        setIsOpen(false);
        navigate('/admin/profile');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Tingkatkan Keamanan Akun Anda
                                </h3>
                            </div>
                            {!isForceMfa && (
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 text-slate-400 transition-colors rounded-lg hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 overflow-y-auto text-slate-600 dark:text-slate-300">
                            <p className="text-sm leading-relaxed">
                                Akun Anda belum menggunakan <strong>Multi-Factor Authentication (MFA)</strong>. Aktifkan MFA untuk memberikan perlindungan tambahan terhadap akses tidak sah. Setelah MFA aktif, setiap proses login akan memerlukan kode verifikasi dari aplikasi Authenticator.
                            </p>

                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                <h4 className="mb-2 font-semibold">Manfaat MFA:</h4>
                                <ul className="space-y-1 text-sm list-disc list-inside">
                                    <li>Melindungi akun dari pencurian password.</li>
                                    <li>Menambah lapisan keamanan saat login.</li>
                                    <li>Mendukung Google Authenticator, Microsoft Authenticator, dan Authy.</li>
                                    <li>Kode OTP berubah setiap 30 detik sehingga lebih aman.</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Cara Mengaktifkan:</h4>
                                <ol className="space-y-1 text-sm list-decimal list-inside text-slate-600 dark:text-slate-400">
                                    <li>Klik tombol <strong>Aktifkan MFA</strong>.</li>
                                    <li>Anda akan diarahkan ke halaman <strong>Profile &gt; Security</strong>.</li>
                                    <li>Scan QR Code menggunakan aplikasi Authenticator.</li>
                                    <li>Masukkan kode OTP untuk verifikasi.</li>
                                    <li>Simpan Recovery Codes di tempat yang aman.</li>
                                </ol>
                            </div>

                            <p className="text-xs italic text-slate-500 dark:text-slate-400">
                                Catatan: Administrator dapat mewajibkan MFA untuk role tertentu. Setelah diaktifkan, MFA akan diminta setiap kali login sesuai kebijakan keamanan aplikasi.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                            {!isForceMfa && (
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Nanti Saja
                                </button>
                            )}
                            <button
                                onClick={handleActivate}
                                className="px-4 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
                            >
                                Aktifkan MFA
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MfaActivationBanner;
