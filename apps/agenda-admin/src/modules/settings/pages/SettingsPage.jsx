import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../api/axios';
import { Save, RefreshCw, AlertCircle, Shield, Settings2, Bell, Smartphone, Monitor } from 'lucide-react';
import DynamicSettingsEngine from './DynamicSettingsEngine';
import Button, { cn } from '../../../components/ui/Button';
import { useSettings } from '../../../contexts/SettingsContext';

const iconMap = {
    'General': Monitor,
    'Security': Shield,
    'Notifications': Bell,
    'Mobile App': Smartphone,
    'Default': Settings2
};

const SettingsPage = () => {
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const { refreshSettings } = useSettings();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/settings');
            const data = response.data.data || [];
            setGroups(data);
            if (data.length > 0) {
                setActiveGroup(data[0].code);
            }
            
            // Initialize form data
            const initialData = {};
            data.forEach(group => {
                group.settings.forEach(setting => {
                    let val = setting.value || setting.default_value;
                    if (setting.type === 'multiselect' || setting.type === 'json') {
                        try { val = JSON.parse(val); } catch(e) {}
                    }
                    initialData[setting.key] = val;
                });
            });
            setFormData(initialData);
        } catch (error) {
            toast.error('Gagal memuat pengaturan.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axiosInstance.post('/settings/bulk-update', formData);
            toast.success('Pengaturan berhasil disimpan.');
            refreshSettings(); // Refresh global settings context
        } catch (error) {
            toast.error('Gagal menyimpan pengaturan.');
        } finally {
            setIsSaving(false);
        }
    };

    const activeGroupData = groups.find(g => g.code === activeGroup);

    return (
        <div className="space-y-6 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
                        Pengaturan Sistem
                    </h1>
                    <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
                        Kelola konfigurasi aplikasi, keamanan, dan pengaturan secara terpusat.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={isLoading}
                        onClick={fetchSettings}
                        className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Muat Ulang
                    </Button>
                    <Button 
                        size="sm" 
                        disabled={isSaving || groups.length === 0}
                        onClick={handleSave}
                        className="cursor-pointer gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        Simpan Perubahan
                    </Button>
                </div>
            </section>

            <section className="flex flex-col gap-6">
                {/* Top Tabs */}
                <div className="w-full flex overflow-x-auto hide-scrollbar gap-2 rounded-[1.25em] border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 items-center">
                    {isLoading && groups.length === 0 ? (
                        <div className="flex gap-2 w-full animate-pulse px-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                            ))}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="py-2 px-4 flex items-center gap-2 text-slate-500">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <p className="text-sm font-medium">Belum ada grup pengaturan.</p>
                        </div>
                    ) : (
                        groups.map(group => {
                            const Icon = iconMap[group.name] || iconMap['Default'];
                            const isActive = activeGroup === group.code;
                            return (
                                <button
                                    key={group.code}
                                    onClick={() => setActiveGroup(group.code)}
                                    className={cn(
                                        'group flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 shrink-0 cursor-pointer hover:scale-[1.03]',
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                    )}
                                >
                                    <Icon size={16} className={cn('transition-transform duration-300 group-hover:-rotate-12', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                                    {group.name}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Tab Content */}
                <div className="w-full rounded-[1.25em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                    {isLoading && groups.length === 0 ? (
                        <div className="flex flex-col p-6 space-y-6 animate-pulse">
                            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
                                <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeGroupData ? (
                        <>
                            <div className="border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeGroupData.name}</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{activeGroupData.description}</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {activeGroupData.settings && activeGroupData.settings.length > 0 ? (
                                    activeGroupData.settings.map(setting => (
                                        <DynamicSettingsEngine 
                                            key={setting.key} 
                                            setting={setting} 
                                            value={formData[setting.key]} 
                                            onChange={(val) => handleSettingChange(setting.key, val)}
                                        />
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Tidak ada pengaturan dalam grup ini.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-slate-500 dark:text-slate-400">
                            <AlertCircle className="w-12 h-12 mb-4 opacity-50 text-amber-500" />
                            <p>Pilih grup pengaturan di menu samping.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default SettingsPage;
