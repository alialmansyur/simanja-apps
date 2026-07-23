import React, { useState, useEffect } from 'react';
import { X, FileDown, UploadCloud, Trash2, CheckCircle2 } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import { toast } from 'react-toastify';

const PdfSettingsModal = ({ isOpen, onClose, onSave, initialDate, initialSettings }) => {
  const [useLetterhead, setUseLetterhead] = useState(initialSettings?.useLetterhead ?? true);
  
  // Tanda Tangan
  const [signLocation, setSignLocation] = useState(initialSettings?.signature?.location || 'Bandung');
  const [signDate, setSignDate] = useState(initialSettings?.signature?.date || '');
  const [signRole, setSignRole] = useState(initialSettings?.signature?.role || 'Notulis');
  const [signName, setSignName] = useState(initialSettings?.signature?.name || '');

  useEffect(() => {
    if (isOpen) {
      // Set default date if empty
      if (!signDate) {
        const d = initialDate ? new Date(initialDate) : new Date();
        const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        setSignDate(formatter.format(d));
      }
      
      // Load user from local storage for default name if available
      try {
        const userData = localStorage.getItem('user');
        if (userData && !signName) {
          const parsed = JSON.parse(userData);
          if (parsed.name) setSignName(parsed.name);
        }
      } catch(e) {}
    }
  }, [isOpen, initialDate, signDate, signName]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({
      useLetterhead,
      signature: {
        location: signLocation,
        date: signDate,
        role: signRole,
        name: signName
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity dark:bg-slate-950/80" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[1.5em] bg-white shadow-2xl dark:bg-slate-900 sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pengaturan Cetak PDF</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Konfigurasi format dokumen sebelum dicetak</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Section 1: Kop Surat */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Format Dokumen</h3>
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-blue-600 bg-blue-600 text-white">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={useLetterhead}
                  onChange={(e) => setUseLetterhead(e.target.checked)}
                />
                {useLetterhead && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Gunakan Kop Surat Resmi</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Menambahkan logo instansi dan alamat pada bagian atas dokumen PDF.</p>
              </div>
            </label>
          </section>

          {/* Section 2: Tanda Tangan */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Area Tanda Tangan</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Tempat</label>
                <input 
                  type="text" 
                  value={signLocation}
                  onChange={e => setSignLocation(e.target.value)}
                  placeholder="Cth: Bandung"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-900/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Tanggal</label>
                <input 
                  type="text" 
                  value={signDate}
                  onChange={e => setSignDate(e.target.value)}
                  placeholder="Cth: 31 Maret 2026"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-900/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Jabatan Penandatangan</label>
                <input 
                  type="text" 
                  value={signRole}
                  onChange={e => setSignRole(e.target.value)}
                  placeholder="Cth: Notulis"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-900/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Nama Penandatangan</label>
                <input 
                  type="text" 
                  value={signName}
                  onChange={e => setSignName(e.target.value)}
                  placeholder="Cth: Rezky Annissha"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-900/50"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <Button variant="secondary" onClick={onClose} className="px-5">
            Batal
          </Button>
          <Button onClick={handleSubmit} className="gap-2 px-5 bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-sm text-white dark:bg-blue-600 dark:border-blue-500 dark:hover:bg-blue-500">
            <CheckCircle2 size={16} />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PdfSettingsModal;
