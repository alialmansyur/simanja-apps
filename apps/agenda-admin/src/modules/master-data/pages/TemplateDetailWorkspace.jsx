import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader2, Eye, X, Check, ChevronLeft, RefreshCw } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Button, { cn } from '../../../components/ui/Button';
import TemplateDetailWorkspaceSkeleton from '../components/TemplateDetailWorkspaceSkeleton';

const TemplateDetailWorkspace = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, unsaved
  const [template, setTemplate] = useState(null);

  // Form states
  const [menimbang, setMenimbang] = useState('');
  const [mengingat, setMengingat] = useState('');
  const [memperhatikan, setMemperhatikan] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  
  // Preview Modal States
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfState, setPdfState] = useState('idle'); // idle, generating, done
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8102/api';

  const fetchTemplate = useCallback(async (showToast = false) => {
    if (showToast) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/master-data/template-surat/uuid/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const resData = await response.json();
        const data = resData.data;
        setTemplate(data);
        
        if (data.body) {
          setMenimbang(data.body.menimbang || '');
          setMengingat(data.body.mengingat || '');
          setMemperhatikan(data.body.memperhatikan || '');
          setBodyContent(data.body.body_content || '');
        }
        
        if (showToast) toast.success('Data berhasil diperbarui');
      } else {
        toast.error('Gagal memuat detail template.');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, [uuid, API_URL]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        body: {
          kop_surat: template?.body?.kop_surat || 'kop_surat.png',
          menimbang,
          mengingat,
          memperhatikan,
          body_content: bodyContent
        }
      };
      
      const response = await fetch(`${API_URL}/master-data/template-surat/uuid/${uuid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        toast.success('Template berhasil disimpan.');
      } else {
        setSaveStatus('unsaved');
        toast.error('Gagal menyimpan template.');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus('unsaved');
      toast.error('Terjadi kesalahan koneksi saat menyimpan.');
    }
  };

  const handleOpenPdfModal = () => {
    setIsPdfModalOpen(true);
    setPdfState('idle');
    setPdfProgress(0);
    setPdfUrl(null);
  };

  const handleStartGeneratePdf = () => {
    setPdfState('generating');
    setPdfProgress(10);
    
    // Simulate some loading progress before actually generating
    const interval = setInterval(() => {
      setPdfProgress(prev => {
        if (prev >= 60) {
          clearInterval(interval);
          generatePdf();
          return 70;
        }
        return prev + 15;
      });
    }, 200);
  };

  const generatePdf = async () => {
    // We use a native iframe srcDoc approach which avoids all layout shift bugs from html2canvas
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { 
            font-family: Arial, sans-serif !important; 
            font-size: 12px !important; 
            color: black; 
            line-height: 1.5; 
            padding: 20px; 
            box-sizing: border-box; 
            background: white;
          }
          * { font-family: Arial, sans-serif !important; font-size: 12px !important; }
          h1, h2, h3, h4, h5, h6 { font-weight: bold !important; }
          h2 { font-size: 16px !important; margin: 0; }
          p { margin-bottom: 8px !important; margin-top: 0; }
          .kop { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          .kop p { font-size: 14px !important; }
          .title-area { text-align: center; margin-bottom: 20px; }
          .title-text { font-weight: bold; text-decoration: underline; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px !important; }
          td { vertical-align: top; }
          .menimbang-col { width: 100px; font-weight: bold; }
          .colon-col { width: 20px; }
          .text-justify { text-align: justify; }
          .mt-10 { padding-top: 10px; }
          .signature-area { width: 100%; display: flex; justify-content: flex-end; margin-top: 40px; }
          .signature-box { width: 250px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>BADAN KEPEGAWAIAN NEGARA</h2>
          <p>KANTOR REGIONAL III</p>
        </div>
        
        <div class="title-area">
          <div class="title-text">${template?.category || 'SURAT TUGAS'}</div>
          <div>Nomor: ${template?.format_nomor?.replace('{unit}', 'TU/KR.III').replace('{year}', new Date().getFullYear()) || '-'}</div>
        </div>

        <table>
          <tr>
            <td class="menimbang-col">Menimbang</td>
            <td class="colon-col">:</td>
            <td class="text-justify">${menimbang || '-'}</td>
          </tr>
          <tr>
            <td class="menimbang-col mt-10">Dasar</td>
            <td class="colon-col mt-10">:</td>
            <td class="text-justify mt-10">${mengingat || '-'}</td>
          </tr>
          ${memperhatikan ? `
          <tr>
            <td class="menimbang-col mt-10">Memperhatikan</td>
            <td class="colon-col mt-10">:</td>
            <td class="text-justify mt-10">${memperhatikan}</td>
          </tr>` : ''}
        </table>

        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Menugasi:</div>
        
        <div class="text-justify" style="margin-bottom: 40px;">
          ${bodyContent || '-'}
        </div>

        <div class="signature-area">
          <div class="signature-box">
            <p>Bandung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin-bottom: 80px !important;">Kepala Kantor Regional III BKN</p>
            <p style="font-weight: bold; text-decoration: underline;">WAHYU, S.Kom., M.A.P.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    setPdfUrl(htmlContent);
    setPdfProgress(100);
    setTimeout(() => setPdfState('done'), 400);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4 mx-auto max-w-6xl"
    >
      {/* Header */}
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/master-data/template-surat')}
              className="inline-flex cursor-pointer gap-2 rounded-[1em] border border-slate-200 bg-transparent hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
              Kembali
            </Button>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-[1.35rem]">
            Editor Template: {loading ? 'Memuat...' : template?.name || 'Tidak ditemukan'}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            {saveStatus === 'saved' && <><Check size={14} className="text-emerald-500" /> Tersimpan</>}
            {saveStatus === 'saving' && <><Loader2 size={14} className="animate-spin text-blue-500" /> Menyimpan...</>}
            {saveStatus === 'unsaved' && <><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Belum tersimpan</>}
            <span className="ml-2 text-sm">
              | Kode: {loading ? '...' : template?.code || '-'} | Format: {loading ? '...' : template?.format_nomor || '-'}
            </span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchTemplate(true)}
              className="cursor-pointer gap-2 rounded-[1em] border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenPdfModal}
              className="cursor-pointer gap-2 rounded-[1em] border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview Surat</span>
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={cn(
                "cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors",
                saveStatus === 'saved' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
              )}
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan' : 'Simpan Perubahan'}
            </Button>
          </motion.div>
        </div>
      </section>

      {loading ? (
        <TemplateDetailWorkspaceSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Editor Section - Header */}
          <div className="rounded-[1.5em] border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-4 dark:border-slate-800">Pendahuluan</h2>
            
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Menimbang</label>
              <div className="prose-editor text-slate-800 dark:text-slate-100">
                <ReactQuill 
                  theme="snow" 
                  value={menimbang} 
                  onChange={(v) => { setMenimbang(v); setSaveStatus('unsaved'); }} 
                  modules={quillModules}
                  className="rounded-lg bg-white dark:bg-slate-950 quill-custom"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Mengingat / Dasar</label>
              <div className="prose-editor text-slate-800 dark:text-slate-100">
                <ReactQuill 
                  theme="snow" 
                  value={mengingat} 
                  onChange={(v) => { setMengingat(v); setSaveStatus('unsaved'); }} 
                  modules={quillModules}
                  className="rounded-lg bg-white dark:bg-slate-950 quill-custom"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Memperhatikan (Opsional)</label>
              <div className="prose-editor text-slate-800 dark:text-slate-100">
                <ReactQuill 
                  theme="snow" 
                  value={memperhatikan} 
                  onChange={(v) => { setMemperhatikan(v); setSaveStatus('unsaved'); }} 
                  modules={quillModules}
                  className="rounded-lg bg-white dark:bg-slate-950 quill-custom"
                />
              </div>
            </div>
          </div>

          {/* Editor Section - Body */}
          <div className="rounded-[1.5em] border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-4 dark:border-slate-800">Isi Surat Utama</h2>
            
            <div className="prose-editor text-slate-800 dark:text-slate-100">
              <ReactQuill 
                theme="snow" 
                value={bodyContent} 
                onChange={(v) => { setBodyContent(v); setSaveStatus('unsaved'); }} 
                modules={quillModules}
                className="rounded-lg bg-white dark:bg-slate-950 quill-custom h-[400px] mb-12"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsPdfModalOpen(false)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2em] bg-white shadow-2xl dark:bg-slate-900"
            >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Preview Template</h3>
                  <p className="text-xs font-medium text-slate-500">Pratinjau struktur dokumen dengan data dummy</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 dark:bg-slate-950/50">
              
              {pdfState === 'idle' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-6 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
                    <Eye size={48} className="text-blue-500" />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Generate Preview</h4>
                  <p className="mb-8 max-w-md text-center text-sm text-slate-500">
                    Sistem akan menyusun pratinjau dokumen dengan menggunakan kerangka header dan body yang telah Anda buat.
                  </p>
                  <Button onClick={handleStartGeneratePdf} className="px-8 bg-blue-600 hover:bg-blue-700">
                    Mulai Generate
                  </Button>
                </div>
              )}

              {pdfState === 'generating' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-6 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Menyusun Dokumen...</h4>
                  <p className="mb-8 max-w-md text-center text-sm text-slate-500">
                    Memproses layout dan menggabungkan format teks.
                  </p>
                  <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-200 ease-linear" 
                      style={{ width: `${pdfProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-400">{Math.round(pdfProgress)}% Selesai</p>
                </div>
              )}

              {pdfState === 'done' && pdfUrl && (
                <div className="h-[75vh] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 p-3 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Eye size={16} /> Preview PDF
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const iframe = document.getElementById('pdf-preview-iframe');
                        if (iframe) iframe.contentWindow.print();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1em] h-8 px-4 text-xs"
                    >
                      Download PDF
                    </Button>
                  </div>
                  <iframe 
                    id="pdf-preview-iframe"
                    srcDoc={pdfUrl} 
                    className="w-full flex-1 bg-white" 
                    title="PDF Preview"
                  />
                </div>
              )}
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Quill styles override to fit dark mode better */}
      <style dangerouslySetInnerHTML={{__html: `
        .quill-custom .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f8fafc;
          border-color: #e2e8f0;
          padding: 12px;
        }
        .dark .quill-custom .ql-toolbar {
          background: #0f172a;
          border-color: #1e293b;
        }
        .dark .quill-custom .ql-toolbar button {
          color: #94a3b8;
        }
        .dark .quill-custom .ql-toolbar button:hover,
        .dark .quill-custom .ql-toolbar button.ql-active {
          color: #38bdf8;
        }
        .dark .quill-custom .ql-toolbar .ql-stroke {
          stroke: #94a3b8;
        }
        .dark .quill-custom .ql-toolbar button:hover .ql-stroke,
        .dark .quill-custom .ql-toolbar button.ql-active .ql-stroke {
          stroke: #38bdf8;
        }
        .dark .quill-custom .ql-toolbar .ql-fill {
          fill: #94a3b8;
        }
        .dark .quill-custom .ql-toolbar button:hover .ql-fill,
        .dark .quill-custom .ql-toolbar button.ql-active .ql-fill {
          fill: #38bdf8;
        }
        .quill-custom .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-size: 0.875rem;
          border-color: #e2e8f0;
        }
        .dark .quill-custom .ql-container {
          border-color: #1e293b;
        }
        .quill-custom .ql-editor {
          min-height: 150px;
        }
      `}} />
    </motion.div>
  );
};

export default TemplateDetailWorkspace;
