import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { User, Shield, ShieldCheck, Activity, Save, RefreshCw, Upload, Trash2, Camera, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { profileService } from '../services/profileService';
import { useAuth } from '../../../contexts/AuthContext';

const iconMap = {
    'Profil': User,
    'Keamanan': Shield,
    'MFA': ShieldCheck,
    'Aktivitas': Activity
};

const ProfilePage = () => {
    const { user, login } = useAuth(); // we use login from useAuth to update context if needed or we just re-fetch
    const [activeTab, setActiveTab] = useState('Profil');
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    // Profile form
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const getPasswordStrength = (password) => {
        if (!password) return { label: 'Belum diisi', color: 'bg-slate-200', icon: Shield, textColor: 'text-slate-400' };
        
        let score = 0;
        if (password.length > 7) score += 1;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^a-zA-Z\d]/.test(password)) score += 1;

        if (score < 2) return { label: 'Lemah', color: 'bg-red-500', icon: ShieldAlert, textColor: 'text-red-600 dark:text-red-400' };
        if (score < 4) return { label: 'Sedang', color: 'bg-amber-500', icon: Shield, textColor: 'text-amber-600 dark:text-amber-400' };
        return { label: 'Kuat', color: 'bg-emerald-500', icon: ShieldCheck, textColor: 'text-emerald-600 dark:text-emerald-400' };
    };

    const strength = getPasswordStrength(passwordForm.password);

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

        const generatedPassword = `${word}${mix}`;
        setPasswordForm(prev => ({ ...prev, password: generatedPassword, password_confirmation: generatedPassword }));
    };

    // MFA state
    const [mfaData, setMfaData] = useState(null);
    const [mfaCode, setMfaCode] = useState('');
    const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
    const [isSettingUpMfaUI, setIsSettingUpMfaUI] = useState(false);
    const [isDisablingMfa, setIsDisablingMfa] = useState(false);

    // Activity state
    const [activities, setActivities] = useState([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'Aktivitas' && activities.length === 0) {
            fetchActivity();
        } else if (activeTab === 'MFA' && !mfaData && !profileData?.two_factor_confirmed_at && isSettingUpMfaUI) {
            setupMfa();
        }
    }, [activeTab, isSettingUpMfaUI]);

    const handleToggleMFA = async (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setIsSettingUpMfaUI(true);
            if (!mfaData) setupMfa();
        } else {
            e.preventDefault();
            const isDark = document.documentElement.classList.contains('dark');
            Swal.fire({
                title: 'Nonaktifkan MFA?',
                text: 'Apakah Anda yakin ingin menonaktifkan keamanan berlapis ini?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Nonaktifkan',
                cancelButtonText: 'Batal',
                reverseButtons: true,
                background: isDark ? '#020817' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#0f172a',
                backdrop: 'rgba(15, 23, 42, 0.45)',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
                customClass: {
                    popup: 'admin-swal-popup',
                    confirmButton: 'admin-swal-confirm bg-red-500 hover:bg-red-600 text-white',
                    cancelButton: 'admin-swal-cancel text-slate-800 dark:text-slate-200',
                    container: 'admin-swal-container',
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    setIsDisablingMfa(true);
                    try {
                        await profileService.disableMfa();
                        toast.success('MFA berhasil dinonaktifkan.');
                        setIsSettingUpMfaUI(false);
                        setMfaData(null);
                        setMfaCode('');
                        fetchProfile();
                    } catch (error) {
                        toast.error('Gagal menonaktifkan MFA.');
                    } finally {
                        setIsDisablingMfa(false);
                    }
                }
            });
        }
    };

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const data = await profileService.getProfile();
            setProfileData(data.data);
            setFormData({
                name: data.data.name || '',
                email: data.data.email || '',
                phone: data.data.phone || '',
                address: data.data.address || '',
            });
        } catch (error) {
            toast.error('Gagal memuat profil.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivity = async () => {
        setIsLoadingActivity(true);
        try {
            const data = await profileService.getActivity();
            setActivities(data.data.data || []);
        } catch (error) {
            toast.error('Gagal memuat aktivitas.');
        } finally {
            setIsLoadingActivity(false);
        }
    };

    const setupMfa = async () => {
        try {
            const data = await profileService.setupMfa();
            setMfaData(data.data);
        } catch (error) {
            toast.error('Gagal setup MFA.');
        }
    };

    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const submitProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const res = await profileService.updateProfile(formData);
            toast.success('Profil berhasil diperbarui.');
            setProfileData(res.data);
            // Optionally update user context here if needed
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.password_confirmation) {
            toast.error('Konfirmasi password tidak cocok.');
            return;
        }
        setIsSavingPassword(true);
        try {
            await profileService.changePassword(passwordForm);
            toast.success('Password berhasil diubah. Sesi di perangkat lain telah diakhiri.');
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengubah password.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const verifyMfa = async (e) => {
        e.preventDefault();
        setIsSettingUpMfa(true);
        try {
            await profileService.verifyMfa({ code: mfaCode });
            toast.success('MFA berhasil diaktifkan.');
            setIsSettingUpMfaUI(false);
            fetchProfile(); // re-fetch to get updated MFA status
        } catch (error) {
            toast.error(error.response?.data?.message || 'Kode MFA tidak valid.');
        } finally {
            setIsSettingUpMfa(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await profileService.uploadAvatar(file);
            toast.success('Foto profil berhasil diunggah.');
            setProfileData(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
        } catch (error) {
            toast.error('Gagal mengunggah foto profil.');
        }
    };

    const handleAvatarRemove = async () => {
        if (!window.confirm('Yakin ingin menghapus foto profil?')) return;
        try {
            await profileService.removeAvatar();
            toast.success('Foto profil berhasil dihapus.');
            setProfileData(prev => ({ ...prev, avatar_url: null }));
        } catch (error) {
            toast.error('Gagal menghapus foto profil.');
        }
    };

    const tabs = ['Profil', 'Keamanan', 'MFA', 'Aktivitas'];

    if (isLoading && !profileData) {
        return (
            <div className="space-y-6 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4 max-w-5xl mx-auto animate-pulse">
                <div className="relative overflow-hidden rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
                    <div className="h-32 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="px-6 sm:px-10 pb-8 relative">
                        <div className="flex flex-col sm:flex-row gap-6 -mt-12 sm:-mt-16 relative">
                            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-white bg-slate-300 dark:border-slate-900 mx-auto sm:mx-0 shrink-0"></div>
                            <div className="text-center sm:text-left flex-1 mt-2 sm:mt-16 sm:pt-2 space-y-3">
                                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto sm:mx-0"></div>
                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mx-auto sm:mx-0"></div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 rounded-[1.25em] bg-white p-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                    ))}
                </div>
                <div className="rounded-[1.25em] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80 min-h-[300px]">
                    <div className="space-y-6">
                        <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4 max-w-5xl mx-auto">
            {/* Top Card: General Info */}
            <div className="relative overflow-hidden rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-6 sm:px-10 pb-8 relative">
                    <div className="flex flex-col sm:flex-row gap-6 -mt-12 sm:-mt-16 relative">
                        <div className="relative group shrink-0 mx-auto sm:mx-0">
                            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-white bg-slate-200 dark:border-slate-900 overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-lg">
                                {profileData?.avatar_url ? (
                                    <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                            <label className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg opacity-0 group-hover:opacity-100 focus-within:opacity-100 border-2 border-white dark:border-slate-900">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div className="text-center sm:text-left flex-1 mt-2 sm:mt-16 sm:pt-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profileData?.name}</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{profileData?.email}</p>
                            
                            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                                    <Shield size={14} className="text-blue-500" />
                                    Role: {profileData?.roles?.[0] || 'N/A'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30">
                                    <Activity size={14} className="text-purple-500" />
                                    Unit: {profileData?.unit || 'N/A'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/30">
                                    <User size={14} className="text-emerald-500" />
                                    NIP: {profileData?.nik || 'N/A'}
                                </span>
                            </div>
                        </div>
                        {profileData?.avatar_url && (
                            <div className="sm:mt-16 sm:pt-2 flex justify-center sm:justify-end">
                                <Button variant="danger" size="sm" onClick={handleAvatarRemove} className="rounded-full px-4">
                                    <Trash2 size={16} className="mr-2" /> Hapus Foto
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Tabs */}
            <div className="flex flex-col gap-6">
                <div className="w-full flex overflow-x-auto hide-scrollbar gap-2 rounded-[1.25em] bg-white p-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80 items-center">
                    {tabs.map(tab => {
                        const Icon = iconMap[tab];
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'group flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 shrink-0 cursor-pointer hover:scale-[1.03]',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                )}
                            >
                                <Icon size={16} className={cn('transition-transform duration-300 group-hover:-rotate-12', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="w-full rounded-[1.25em] bg-white dark:bg-slate-900 overflow-hidden shadow-sm ring-1 ring-slate-100 dark:ring-slate-800/80">
                    {activeTab === 'Profil' && (
                        <div>
                            <div className="border-b border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ubah Data Profil</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Perbarui informasi kontak dan biodata Anda.</p>
                            </div>
                            <form onSubmit={submitProfile} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                                        <Input placeholder="Masukkan nama lengkap" name="name" value={formData.name || ''} onChange={handleProfileChange} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                                        <Input placeholder="Masukkan alamat email" type="email" name="email" value={formData.email || ''} onChange={handleProfileChange} required disabled />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">NIP</label>
                                        <Input placeholder="NIP Pegawai" name="nik" value={profileData?.nik || ''} disabled />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">No. HP</label>
                                        <Input placeholder="Contoh: 081234567890" name="phone" value={formData.phone || ''} onChange={handleProfileChange} />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                                        <Input placeholder="Masukkan alamat domisili" name="address" value={formData.address || ''} onChange={handleProfileChange} />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSavingProfile}>
                                        {isSavingProfile ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                        Simpan Profil
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'Keamanan' && (
                        <div>
                            <div className="border-b border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ubah Kata Sandi</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ganti kata sandi Anda secara berkala untuk menjaga keamanan akun.</p>
                            </div>
                            <form onSubmit={submitPassword} className="p-6 space-y-6">
                                <div className="space-y-6 max-w-md">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            Kata Sandi Lama
                                        </span>
                                        <div className="relative">
                                            <input
                                                type={showPassword.current ? "text" : "password"}
                                                name="current_password"
                                                value={passwordForm.current_password}
                                                onChange={handlePasswordChange}
                                                required
                                                className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => toggleShowPassword('current')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                                name="password"
                                                value={passwordForm.password}
                                                onChange={handlePasswordChange}
                                                required
                                                className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => toggleShowPassword('new')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between px-1">
                                            <div className="flex w-full items-center gap-1.5 pr-4">
                                                <div className={cn("h-1.5 flex-1 rounded-full", passwordForm.password.length > 0 ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                                                <div className={cn("h-1.5 flex-1 rounded-full", strength.label === 'Sedang' || strength.label === 'Kuat' ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                                                <div className={cn("h-1.5 flex-1 rounded-full", strength.label === 'Kuat' ? strength.color : "bg-slate-200 dark:bg-slate-800")} />
                                            </div>
                                            <div className={cn("flex items-center gap-1 text-xs font-bold whitespace-nowrap", strength.textColor)}>
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
                                                name="password_confirmation"
                                                value={passwordForm.password_confirmation}
                                                onChange={handlePasswordChange}
                                                required
                                                className="w-full cursor-text rounded-[1em] border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => toggleShowPassword('confirm')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </label>
                                </div>
                                <div className="flex justify-start">
                                    <Button 
                                        type="submit" 
                                        disabled={isSavingPassword || !passwordForm.password || passwordForm.password !== passwordForm.password_confirmation}
                                        className="cursor-pointer gap-2 rounded-[1em] px-6 py-2.5 shadow-sm border-blue-600 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    >
                                        {isSavingPassword ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                                        Simpan Kata Sandi
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'MFA' && (
                        <div>
                            <div className="border-b border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Factor Authentication (MFA)</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tingkatkan keamanan dengan mengaktifkan autentikasi dua faktor menggunakan Google Authenticator.</p>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8 p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Status MFA</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {profileData?.two_factor_confirmed_at ? 'Aktif - Akun Anda terlindungi.' : 'Nonaktif - Aktifkan untuk keamanan ekstra.'}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={!!profileData?.two_factor_confirmed_at || isSettingUpMfaUI}
                                            onChange={handleToggleMFA}
                                            disabled={isDisablingMfa}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {profileData?.two_factor_confirmed_at ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-900/20 text-center">
                                        <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">MFA Aktif</h3>
                                        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Akun Anda sudah dilindungi dengan Multi-Factor Authentication.</p>
                                    </div>
                                ) : isSettingUpMfaUI ? (
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex-1 space-y-4">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">1. Pindai QR Code</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Buka aplikasi Google Authenticator di perangkat Anda dan pindai kode QR di bawah ini.</p>
                                            
                                            {mfaData?.qr_code ? (
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block">
                                                    <img src={`data:image/svg+xml;base64,${mfaData.qr_code}`} alt="MFA QR Code" className="w-40 h-40" />
                                                </div>
                                            ) : (
                                                <div className="h-40 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center animate-pulse">
                                                    <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                                                </div>
                                            )}

                                            <div className="mt-4">
                                                <p className="text-xs font-semibold text-slate-500 mb-1">Secret Key (Jika tidak bisa scan):</p>
                                                <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-800 dark:text-slate-200 select-all border border-slate-200 dark:border-slate-700 block max-w-fit">
                                                    {mfaData?.secret || 'Memuat...'}
                                                </code>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8 space-y-4">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">2. Verifikasi Kode</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Masukkan 6 digit kode dari aplikasi untuk mengaktifkan MFA.</p>
                                            
                                            <form onSubmit={verifyMfa} className="space-y-4 mt-4">
                                                <Input 
                                                    placeholder="Contoh: 123456" 
                                                    value={mfaCode} 
                                                    onChange={(e) => setMfaCode(e.target.value)} 
                                                    maxLength={6} 
                                                    required 
                                                    className="tracking-widest font-mono text-center text-lg"
                                                />
                                                <Button type="submit" disabled={isSettingUpMfa || mfaCode.length < 6} className="w-full">
                                                    {isSettingUpMfa ? <RefreshCw size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
                                                    Verifikasi & Aktifkan
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                                                <Shield className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">MFA Belum Diaktifkan</h3>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                        Akun Anda belum menggunakan <strong>Multi-Factor Authentication (MFA)</strong>. Aktifkan MFA untuk perlindungan tambahan dari akses tidak sah.
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
                                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">Langkah-langkah Aktivasi:</h4>
                                                    <ol className="list-decimal list-outside ml-4 text-sm space-y-2 text-slate-600 dark:text-slate-400">
                                                        <li>Klik tombol <span className="font-medium text-slate-700 dark:text-slate-300">toggle di pojok kanan atas</span> untuk memulai proses aktivasi.</li>
                                                        <li>Pindai <strong>QR Code</strong> yang muncul menggunakan aplikasi Authenticator (seperti Google Authenticator, Microsoft Authenticator, atau Authy).</li>
                                                        <li>Masukkan <strong>6-digit Kode OTP</strong> dari aplikasi tersebut untuk verifikasi penyambungan.</li>
                                                        <li>Simpan <strong>Recovery Codes</strong> yang diberikan di tempat yang aman.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Aktivitas' && (
                        <div>
                            <div className="border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Log Aktivitas</h2>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Riwayat aktivitas dan sesi login akun Anda.</p>
                                </div>
                                <Button variant="secondary" size="sm" onClick={fetchActivity} disabled={isLoadingActivity}>
                                    <RefreshCw size={16} className={isLoadingActivity ? "animate-spin" : ""} />
                                </Button>
                            </div>
                            <div className="p-0">
                                {isLoadingActivity && activities.length === 0 ? (
                                    <div className="flex justify-center p-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : activities.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold">Waktu</th>
                                                    <th className="px-6 py-4 font-semibold">Modul</th>
                                                    <th className="px-6 py-4 font-semibold">Aktivitas</th>
                                                    <th className="px-6 py-4 font-semibold">IP / Device</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                {activities.slice(0, 10).map((act) => (
                                                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {new Date(act.created_at).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                            {act.module}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                {act.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs text-slate-500">{act.ip_address}</div>
                                                            <div className="text-[10px] text-slate-400 max-w-[200px] truncate" title={act.user_agent}>{act.user_agent}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center p-8 text-slate-500">
                                        Belum ada aktivitas tercatat.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
