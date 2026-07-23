import React from 'react';
import Select from 'react-select';
import { Eye, EyeOff } from 'lucide-react';

const DynamicSettingsEngine = ({ setting, value, onChange }) => {
    const [showPassword, setShowPassword] = React.useState(false);

    let options = [];
    if (setting.options) {
        try {
            options = typeof setting.options === 'string' ? JSON.parse(setting.options) : setting.options;
        } catch(e) {}
    }

    const inputClass = "flex h-14 w-full rounded-[1.25em] border-2 border-slate-100 bg-slate-50/50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-100/50 hover:border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-50 dark:focus:border-blue-400 dark:focus:bg-slate-900";

    const renderInput = () => {
        switch (setting.type) {
            case 'switch':
            case 'boolean':
                return (
                    <label className="relative inline-flex items-center cursor-pointer mt-3">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={value == 1 || value == true || value === '1'} 
                            onChange={(e) => onChange(e.target.checked ? '1' : '0')} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                );
            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass}
                    >
                        {options.map((opt, idx) => (
                            <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'multiselect':
                return (
                    <Select
                        isMulti
                        options={options}
                        value={options.filter(opt => (Array.isArray(value) ? value : []).includes(opt.value))}
                        onChange={(selected) => onChange(selected.map(s => s.value))}
                        className="my-react-select-container"
                        classNamePrefix="my-react-select"
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                minHeight: '3.5rem', // h-14
                                borderRadius: '1.25em',
                                borderWidth: '2px',
                                borderColor: state.isFocused ? '#3b82f6' : 'var(--border-color, #f1f5f9)', // blue-500 or slate-100
                                backgroundColor: state.isFocused ? '#ffffff' : 'rgba(248, 250, 252, 0.5)', // bg-white or bg-slate-50/50
                                padding: '0 0.5rem',
                                boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                                '&:hover': {
                                    borderColor: '#e2e8f0', // slate-200
                                    backgroundColor: 'rgba(241, 245, 249, 0.5)' // slate-100/50
                                }
                            })
                        }}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        rows={4}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass.replace('h-14', 'h-auto')}
                    />
                );
            case 'json':
                return (
                    <textarea
                        rows={6}
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass.replace('h-14', 'h-auto font-mono text-xs')}
                    />
                );
            case 'password':
                return (
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className={inputClass}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-500 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                );
            case 'image':
                return (
                    <div>
                        {value && typeof value === 'string' && (
                            <img src={`/storage/${value}`} alt={setting.label} className="h-20 object-contain mb-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    onChange(e.target.files[0]);
                                }
                            }}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-[1.25em] file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 transition-colors cursor-pointer"
                        />
                    </div>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass}
                    />
                );
            case 'text':
            default:
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass}
                    />
                );
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-slate-200 dark:border-slate-700/50 pb-6 last:border-0">
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200">
                    {setting.label}
                </label>
                {setting.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {setting.description}
                    </p>
                )}
            </div>
            <div className="md:col-span-2">
                {renderInput()}
            </div>
        </div>
    );
};

export default DynamicSettingsEngine;
