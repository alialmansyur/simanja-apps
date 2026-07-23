import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileDown, Mic, MicOff, Save, Check, Type, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link2, 
  Users, Calendar as CalendarIcon, MapPin, Plus, Settings, UploadCloud,
  ChevronLeft, RefreshCw, X, Printer, Loader2, Trash2
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getNotula, updateNotula, addNotulaParticipant, removeNotulaParticipant } from '../../../api/notulaApi';
import agendaService from '../../agenda/services/agendaService';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../utils/sweetalert';
import Button, { cn } from '../../../components/ui/Button';
import MinutesWorkspaceSkeleton from './MinutesWorkspaceSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import PdfSettingsModal from './PdfSettingsModal';
const EDITOR_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'clean']
  ]
};

const NotulaDetailWorkspace = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Voice to text states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  // PDF Modals
  const [isPdfSettingsOpen, setIsPdfSettingsOpen] = useState(false);
  const [pdfSettings, setPdfSettings] = useState({
    useLetterhead: true,
    signature: { location: 'Bandung', date: '', role: 'Notulis', name: '' }
  });
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfState, setPdfState] = useState('idle'); // 'idle' | 'generating' | 'done'
  const [pdfProgress, setPdfProgress] = useState(0);

  // Attachments
  const [attachments, setAttachments] = useState([]); // { id, url, file, name }
  const fileInputRef = useRef(null);
  
  // Participant Modal
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantType, setParticipantType] = useState('internal');
  const [newInternalParticipant, setNewInternalParticipant] = useState(null);
  const [newExternalParticipant, setNewExternalParticipant] = useState({ name: '', nip: '', institution: '' });
  const [employees, setEmployees] = useState([]);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(null);

  // Editor states
  const editorRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, unsaved
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [currentNotula, setCurrentNotula] = useState(null);
  
  // Participants State
  const [attendees, setAttendees] = useState([]);

  const fetchDetail = useCallback(async (showToast = false) => {
    if (showToast) setIsLoading(true);
    try {
      const res = await getNotula(uid);
      const data = res.data;
      setCurrentNotula(data);
      setTitle(data.title || '');
      setContent(data.notes || '');
      if (showToast) toast.success('Data berhasil diperbarui');
      if (data.agenda && data.agenda.participants) {
        const mapped = data.agenda.participants.map(p => ({
            id: p.id,
            name: p.employee?.nama || p.guest_name || `Peserta ${p.id}`,
            role: p.guest_institution || p.guest_nip ? `${p.guest_nip ? p.guest_nip + ' - ' : ''}${p.guest_institution || ''}` : (p.employee?.nip || 'Internal'),
            initials: (p.employee?.nama || p.guest_name || `P ${p.id}`).substring(0, 2).toUpperCase(),
            color: 'bg-blue-500'
        }));
        setAttendees(mapped);
      }
      if (showToast) toast.success('Data berhasil diperbarui');
    } catch (err) {
      if (!showToast) {
        toast.error('Gagal memuat detail notula');
        navigate('/admin/notula');
      } else {
        toast.error('Gagal memperbarui data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [uid, navigate]);

  const fetchEmployees = useCallback(async () => {
    try {
      const emp = await agendaService.getEmployees();
      setEmployees(emp.map(e => ({ value: e.id, label: `${e.name} - ${e.nip || 'N/A'}`, name: e.name })));
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  }, []);

  useEffect(() => {
    fetchDetail();
    fetchEmployees();
  }, [fetchDetail, fetchEmployees]);

  const meetingInfo = {
    title: title || 'Rapat Koordinasi',
    date: currentNotula ? new Date(currentNotula.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    time: (currentNotula && currentNotula.agenda?.start_time) ? currentNotula.agenda.start_time : '',
    room: (currentNotula && currentNotula.agenda?.room?.name) ? currentNotula.agenda.room.name : 'Virtual/Tidak ditentukan'
  };

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setContent(prev => {
            const newHTML = prev + (prev ? ' ' : '') + finalTranscript;
            return newHTML;
          });
          setSaveStatus('unsaved');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto save mechanism
  useEffect(() => {
    if (saveStatus === 'unsaved' && currentNotula) {
      const timer = setTimeout(async () => {
        setSaveStatus('saving');
        try {
           await updateNotula(uid, {
               notes: content,
               title: title
           });
           setSaveStatus('saved');
        } catch (err) {
           setSaveStatus('unsaved');
           toast.error('Gagal menyimpan otomatis');
        }
      }, 1500); // 1.5s debounce
      return () => clearTimeout(timer);
    }
  }, [content, title, saveStatus, currentNotula, uid]);



  const handleEditorChange = (value) => {
    setContent(value);
    setSaveStatus('unsaved');
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('unsaved');
  };

  // Voice to text handlers
  const handleStartRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setIsVoiceModalOpen(false);
      } catch (err) {
        console.error("Could not start speech recognition:", err);
      }
    } else {
      alert("Browser Anda tidak mendukung fitur Voice to Text (Web Speech API). Silakan gunakan Chrome atau Edge terbaru.");
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Participant
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (participantType === 'internal' && !newInternalParticipant) return;
    if (participantType === 'external' && !newExternalParticipant.name) return;
    
    setIsAddingParticipant(true);
    
    try {
        let payload = {};
        if (participantType === 'external') {
            payload.guest_name = newExternalParticipant.name;
            payload.guest_nip = newExternalParticipant.nip;
            payload.guest_institution = newExternalParticipant.institution;
        } else {
            payload.employee_id = newInternalParticipant.value;
        }

        const res = await addNotulaParticipant(uid, payload);
        const added = res.data;
        
        const nameToUse = added.employee ? added.employee.nama : added.guest_name;
        const roleToUse = participantType === 'external' 
            ? `${added.guest_nip ? added.guest_nip + ' - ' : ''}${added.guest_institution || ''}` 
            : (added.employee?.nip || 'Internal');
        
        const initials = nameToUse
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
          
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-purple-500'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        setAttendees([...attendees, { 
          id: added.id,
          name: nameToUse, 
          role: roleToUse, 
          initials, 
          color 
        }]);
        
        setNewInternalParticipant(null);
        setNewExternalParticipant({ name: '', nip: '', institution: '' });
        setIsParticipantModalOpen(false);
        toast.success('Peserta berhasil ditambahkan');
    } catch (error) {
        console.error(error);
        toast.error('Gagal menambahkan peserta');
    } finally {
        setIsAddingParticipant(false);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    const result = await confirmDialog({
      title: 'Hapus Peserta?',
      text: 'Peserta akan dihapus dari notula dan agenda ini.',
      confirmButtonText: 'Ya, Hapus',
    });

    if (!result.isConfirmed) return;
    
    setIsDeletingParticipant(participantId);
    try {
        await removeNotulaParticipant(uid, participantId);
        setAttendees(attendees.filter(a => a.id !== participantId));
        toast.success('Peserta berhasil dihapus');
    } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus peserta');
    } finally {
        setIsDeletingParticipant(null);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.warning('Hanya file gambar (JPG, PNG) yang diperbolehkan.');
    }
    if (attachments.length + imageFiles.length > 4) {
      toast.warning('Maksimal 4 gambar lampiran.');
      return;
    }
    const newAttachments = imageFiles.map(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 2MB.`);
        return null;
      }
      return {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        url: URL.createObjectURL(file)
      };
    }).filter(Boolean);
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      const removed = prev.find(a => a.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return filtered;
    });
  };

  // PDF Generation flow
  const handleOpenPdfModal = () => {
    setIsPdfModalOpen(true);
    setPdfState('idle');
    setPdfProgress(0);
  };

  const handleStartGeneratePdf = () => {
    setPdfState('generating');
    setPdfProgress(0);
    
    const interval = setInterval(() => {
      setPdfProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setPdfState('done');
          return 100;
        }
        return prev + 15; // smooth progress
      });
    }, 200);
  };

  const handlePrintPdf = () => {
    setIsPdfModalOpen(false);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '210mm';
    iframe.style.top = '-9999px';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;

    // Build participants list HTML
    const participantsHtml = attendees.length > 0 
      ? attendees.map((a, i) => `<div>${i + 1}. ${a.name} ${a.role !== 'Internal' ? `(${a.role})` : ''}</div>`).join('')
      : '-';

    // Build attachments HTML
    let attachmentsHtml = '';
    if (attachments && attachments.length > 0) {
      attachmentsHtml = `
        <div style="page-break-before: always;"></div>
        <h2 style="text-transform: uppercase; font-size: 16pt; margin-bottom: 20px;">Lampiran Dokumentasi</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          ${attachments.map(att => `
            <div style="width: 45%; margin-bottom: 20px;">
              <img src="${att.url}" style="width: 100%; height: auto; border: 1px solid #ccc;" />
            </div>
          `).join('')}
        </div>
      `;
    }

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Notula - ${meetingInfo.title}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #000; font-size: 11pt; }
            
            /* Kop Surat Styles */
            .kop-surat { margin-bottom: 20px; }
            .kop-surat img { width: 100%; height: auto; display: block; }
            
            /* Main Content Styles */
            .doc-title { text-align: center; margin-bottom: 20px; }
            .doc-title h1 { font-size: 14pt; font-weight: bold; margin: 0 0 10px 0; }
            .doc-title .agenda-name { font-size: 12pt; text-align: center; margin: 0 auto; max-width: 80%; }
            
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .meta-table td { padding: 4px 0; vertical-align: top; }
            .meta-table .label { width: 120px; }
            .meta-table .colon { width: 20px; text-align: center; }
            
            .content-section { margin-top: 20px; }
            .content-section .label { font-weight: bold; margin-bottom: 10px; }
            .content-body, .content-body * { 
               white-space: pre-wrap !important; 
               word-wrap: break-word !important; 
               word-break: break-word !important; 
               overflow-wrap: anywhere !important; 
               max-width: 100% !important; 
            }
            .content-body { text-align: justify; }
            .content-body img { max-width: 100%; height: auto; object-fit: contain; }
            .content-body .ql-align-center { text-align: center; }
            .content-body .ql-align-right { text-align: right; }
            .content-body .ql-align-justify { text-align: justify; }
            .content-body .ql-indent-1 { padding-left: 3em; }
            .content-body .ql-indent-2 { padding-left: 6em; }
            .content-body .ql-indent-3 { padding-left: 9em; }
            .content-body .ql-indent-4 { padding-left: 12em; }
            .content-body .ql-indent-5 { padding-left: 15em; }
            .content-body .ql-indent-6 { padding-left: 18em; }
            .content-body .ql-indent-7 { padding-left: 21em; }
            .content-body .ql-indent-8 { padding-left: 24em; }
            .content-body table { width: 100%; border-collapse: collapse; table-layout: fixed; word-wrap: break-word; }
            .content-body table td, .content-body table th { border: 1px solid #ccc; padding: 4px; word-wrap: break-word; }
            .content-body p { margin: 0 0 10px 0; white-space: pre-wrap; word-break: break-word; }
            .content-body blockquote { border-left: 4px solid #ccc; margin-bottom: 5px; margin-top: 5px; padding-left: 16px; }
            .content-body pre { background: #f0f0f0; padding: 10px; white-space: pre-wrap; word-wrap: break-word; }
            .content-body ul, .content-body ol { margin-top: 5px; margin-bottom: 5px; padding-left: 20px; }
            .content-body h1, .content-body h2, .content-body h3 { font-size: 12pt; margin: 15px 0 10px 0; }
            
            /* Signature Styles */
            .signature-area { margin-top: 50px; display: flex; justify-content: flex-end; }
            .signature-box { text-align: center; width: 250px; }
            .signature-date { margin-bottom: 5px; }
            .signature-role { margin-bottom: 60px; }
            .signature-name { text-decoration: underline; font-weight: bold; }
          </style>
        </head>
        <body style="word-wrap: break-word;">
          ${pdfSettings.useLetterhead ? `
          <div class="kop-surat">
            <img src="/kop_surat.png" alt="Kop Surat" />
          </div>
          ` : ''}
          
          <div class="doc-title">
            <h1>NOTULA</h1>
            <div class="agenda-name">${meetingInfo.title}</div>
          </div>
          
          <table class="meta-table">
            <tr>
              <td class="label">Hari / Tanggal</td>
              <td class="colon">:</td>
              <td>${meetingInfo.date}</td>
            </tr>
            <tr>
              <td class="label">Pukul</td>
              <td class="colon">:</td>
              <td>${meetingInfo.time}</td>
            </tr>
            <tr>
              <td class="label">Tempat</td>
              <td class="colon">:</td>
              <td>${meetingInfo.room}</td>
            </tr>
            <tr>
              <td class="label">Agenda</td>
              <td class="colon">:</td>
              <td>${meetingInfo.title}</td>
            </tr>
            <tr>
              <td class="label">Peserta</td>
              <td class="colon">:</td>
              <td>${participantsHtml}</td>
            </tr>
            <tr>
              <td class="label">Pelaksanaan</td>
              <td class="colon">:</td>
              <td></td>
            </tr>
          </table>
          
          <div class="content-section">
            <div class="content-body">${content || '-'}</div>
          </div>
          
          <div class="signature-area">
            <div class="signature-box">
              <div class="signature-date">${pdfSettings.signature.location}, ${pdfSettings.signature.date || new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(meetingInfo.date))}</div>
              <div class="signature-role">${pdfSettings.signature.role},</div>
              <div class="signature-name">${pdfSettings.signature.name || '...........................................'}</div>
            </div>
          </div>
          
          ${attachmentsHtml}
        </body>
      </html>
    `);
    doc.close();
    
    // Wait for images to load before printing
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      {/* Header */}
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/notula')}
              className="inline-flex cursor-pointer gap-2 rounded-[1em] border border-slate-200 bg-transparent hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
              Kembali
            </Button>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-[1.35rem]">
            Detail Notula
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            {saveStatus === 'saved' && <><Check size={14} className="text-emerald-500" /> Tersimpan di Draft</>}
            {saveStatus === 'saving' && <><RefreshCw size={14} className="animate-spin text-blue-500" /> Menyimpan...</>}
            {saveStatus === 'unsaved' && <><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Belum tersimpan</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
          {/* Voice Animation Indicator */}
          {isRecording && (
            <div className="mr-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
              <span className="text-sm font-bold text-red-500">Merekam...</span>
            </div>
          )}

          {isRecording ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStopRecording}
              className="cursor-pointer gap-2 rounded-[1em] shadow-sm border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400"
            >
              <MicOff size={16} />
              <span className="hidden sm:inline">Hentikan Rekaman</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsVoiceModalOpen(true)}
              className="cursor-pointer gap-2 rounded-[1em] shadow-sm border border-slate-200 bg-white transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <Mic size={16} />
              <span className="hidden sm:inline">Voice to Text</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsPdfSettingsOpen(true)}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm border border-slate-200 bg-white transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Pengaturan</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDetail(true)}
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenPdfModal}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm border border-blue-600 bg-blue-600 text-white transition-colors hover:bg-blue-700 hover:shadow-none dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">Generate PDF</span>
          </Button>
        </div>
      </section>

      {isLoading ? (
        <MinutesWorkspaceSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Editor Area */}
        <div className="flex min-h-[750px] flex-col rounded-[1.25em] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          
          {/* Editor Header / Title */}
          <div className="border-b border-slate-100 p-6 pb-4 dark:border-slate-800">
            <input 
              type="text" 
              value={title}
              onChange={handleTitleChange}
              className="w-full bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              placeholder="Judul Agenda..."
            />
          </div>

          {/* Editor Body (ReactQuill) */}
          <div className="flex-1 cursor-text flex flex-col" onBlur={() => {
            if (saveStatus === 'unsaved' && currentNotula) {
              setSaveStatus('saving');
              updateNotula(uuid, { notes: content, title: title })
                .then(() => setSaveStatus('saved'))
                .catch(() => {
                  setSaveStatus('unsaved');
                  toast.error('Gagal menyimpan otomatis');
                });
            }
          }}>
            <ReactQuill 
              theme="snow"
              value={content}
              onChange={handleEditorChange}
              modules={EDITOR_MODULES}
              placeholder="Mulai mengetik notula rapat di sini..."
              className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-b-[1.25em] quill-custom"
              style={{ minHeight: '500px' }}
            />
          </div>
          
          {/* Section 3: Lampiran Dokumentasi */}
          <div className="border-t border-slate-100 p-6 md:p-10 dark:border-slate-800">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Lampiran Dokumentasi</h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tambahkan foto kegiatan (Maks 4 foto, @2MB)</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="gap-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={14} />
                Pilih Gambar
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg" 
                multiple
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length === 0 ? (
              <div 
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} className="mb-3 text-slate-400" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Klik untuk unggah gambar</p>
                <p className="mt-1 text-xs text-slate-500">Hanya format JPG atau PNG</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {attachments.map((item) => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-110 group-hover:opacity-80" />
                    <button 
                      onClick={() => removeAttachment(item.id)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-sm transition hover:bg-red-600 group-hover:opacity-100"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-6">
          {/* Info Rapat */}
          <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Informasi Rapat</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarIcon size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{meetingInfo.date}</p>
                  <p className="text-xs text-slate-500">{meetingInfo.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{meetingInfo.room}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Peserta */}
          <div className="rounded-[1.25em] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Peserta ({attendees.length})</h3>
              <button 
                type="button" 
                onClick={() => setIsParticipantModalOpen(true)}
                className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {attendees.length === 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="text-sm text-slate-500"
                  >
                    Belum ada peserta.
                  </motion.p>
                )}
                {attendees.map((attendee) => (
                  <motion.div 
                    key={attendee.id} 
                    layout
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", attendee.color)}>
                        {attendee.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{attendee.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{attendee.role}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      disabled={isDeletingParticipant === attendee.id}
                      onClick={() => handleDeleteParticipant(attendee.id)}
                      className="shrink-0 p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-slate-800 rounded"
                    >
                      {isDeletingParticipant === attendee.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Voice to Text Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/80 animate-modal-overlay">
          <div className="w-full max-w-md overflow-hidden rounded-[1.25em] bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Voice to Text</h2>
              <button 
                onClick={() => setIsVoiceModalOpen(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Mic size={32} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Apakah Anda mengizinkan penggunaan mikrofon untuk mentranskripsikan ucapan Anda ke dalam teks secara otomatis?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <Button 
                variant="secondary"
                onClick={() => setIsVoiceModalOpen(false)}
                className="cursor-pointer rounded-[1em]"
              >
                Batal
              </Button>
              <Button 
                onClick={handleStartRecording}
                className="cursor-pointer rounded-[1em]"
              >
                Izinkan & Mulai
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate PDF Settings Modal */}
      <PdfSettingsModal 
        isOpen={isPdfSettingsOpen}
        onClose={() => setIsPdfSettingsOpen(false)}
        initialSettings={pdfSettings}
        onSave={(settings) => {
          setPdfSettings(settings);
          setIsPdfSettingsOpen(false);
          toast.success("Pengaturan PDF berhasil disimpan");
        }}
        initialDate={currentNotula ? currentNotula.date : null}
      />

      {/* Generate PDF Action Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/80 animate-modal-overlay">
          <div className={cn(
            "flex flex-col overflow-hidden rounded-[1.25em] bg-white shadow-xl ring-1 ring-slate-200 transition-all duration-300 dark:bg-slate-900 dark:ring-slate-800 animate-modal-card",
            pdfState === 'done' ? "w-full max-w-4xl" : "w-full max-w-md"
          )} style={{ maxHeight: '90vh' }}>
            
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {pdfState === 'done' ? 'Pratinjau PDF Notula' : 'Generate PDF'}
              </h2>
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>
            
            {pdfState === 'idle' && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <FileDown size={40} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Siap Membuat Dokumen</h3>
                <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
                  Sistem akan mengompilasi notulensi rapat ini menjadi dokumen resmi berformat PDF.
                </p>
                <Button 
                  onClick={handleStartGeneratePdf}
                  className="cursor-pointer w-full justify-center rounded-[1em] py-3 text-base"
                >
                  Mulai Kompilasi Dokumen
                </Button>
              </div>
            )}

            {pdfState === 'generating' && (
              <div className="p-10 text-center">
                <Loader2 size={40} className="mx-auto mb-5 animate-spin text-blue-600 dark:text-blue-400" />
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Sedang Mengompilasi...</h3>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  Menyiapkan format dokumen dan merender teks.
                </p>
                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-200 ease-out dark:bg-blue-500"
                    style={{ width: `${pdfProgress}%` }}
                  ></div>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-400">{pdfProgress}%</p>
              </div>
            )}

            {pdfState === 'done' && (
              <>
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6 dark:bg-slate-950">
                  {/* Paper Preview */}
                  <div 
                    className="mx-auto min-h-[500px] w-full max-w-[21cm] bg-white p-10 shadow-sm" 
                    style={{ color: '#000', fontFamily: 'Arial, Helvetica, sans-serif' }}
                  >
                    {pdfSettings.useLetterhead && (
                      <div className="mb-6 w-full">
                        <img src="/kop_surat.png" alt="Kop Surat" className="w-full h-auto object-contain" />
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h1 className="text-xl font-bold mb-2">NOTULA</h1>
                      <div className="text-sm">{meetingInfo.title}</div>
                    </div>
                    
                    <table className="mb-6 w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1 font-bold w-32 align-top">Hari / Tanggal</td>
                          <td className="py-1 w-5 text-center align-top">:</td>
                          <td className="py-1 align-top">{meetingInfo.date}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold align-top">Pukul</td>
                          <td className="py-1 text-center align-top">:</td>
                          <td className="py-1 align-top">{meetingInfo.time}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold align-top">Tempat</td>
                          <td className="py-1 text-center align-top">:</td>
                          <td className="py-1 align-top">{meetingInfo.room}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold align-top">Peserta</td>
                          <td className="py-1 text-center align-top">:</td>
                          <td className="py-1 align-top">
                            {attendees.length > 0 ? attendees.map((a, i) => (
                              <div key={a.id}>{i + 1}. {a.name}</div>
                            )) : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="mb-10">
                      <div 
                        className="prose prose-sm max-w-none text-black prose-ul:pl-5 prose-ol:pl-5 break-words whitespace-pre-wrap"
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{ __html: content || '<span class="italic text-slate-400">Belum ada catatan yang ditulis dalam editor.</span>' }}
                      />
                    </div>

                    <div className="flex justify-end text-sm mt-10">
                      <div className="w-64 text-center">
                        <div className="mb-1">{pdfSettings.signature.location}, {pdfSettings.signature.date || new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(meetingInfo.date))}</div>
                        <div className="mb-16">{pdfSettings.signature.role},</div>
                        <div className="font-bold underline">{pdfSettings.signature.name || '...........................................'}</div>
                      </div>
                    </div>

                    {attachments.length > 0 && (
                      <>
                        <div className="border-t border-slate-200 mt-10 pt-10 mb-4">
                          <h2 className="text-lg font-bold uppercase mb-4">Lampiran Dokumentasi</h2>
                          <div className="grid grid-cols-2 gap-4">
                            {attachments.map(att => (
                              <div key={att.id}>
                                <img src={att.url} alt="Lampiran" className="w-full h-auto border border-slate-200" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <Button 
                    variant="secondary"
                    onClick={() => setIsPdfModalOpen(false)}
                    className="cursor-pointer rounded-[1em]"
                  >
                    Tutup
                  </Button>
                  <Button 
                    onClick={handlePrintPdf}
                    className="cursor-pointer gap-2 rounded-[1em] border-blue-600 bg-blue-600 hover:bg-blue-700"
                  >
                    <Printer size={16} />
                    Cetak / Simpan PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {isParticipantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/80 animate-modal-overlay">
          <div className="w-full max-w-md overflow-hidden rounded-[1.25em] bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tambah Peserta</h2>
              <button 
                onClick={() => setIsParticipantModalOpen(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddParticipant} className="p-6">
              
              <div className="mb-6 flex items-center gap-6 rounded-[1em] border border-slate-200 p-4 dark:border-slate-800">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="radio" 
                    name="participantType" 
                    value="internal" 
                    checked={participantType === 'internal'}
                    onChange={(e) => setParticipantType(e.target.value)}
                    className="appearance-none w-4 h-4 rounded-full border-2 border-slate-300 bg-white checked:bg-white checked:border-[5px] checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all dark:border-slate-600 dark:bg-slate-900 dark:checked:border-blue-500 dark:focus:ring-offset-slate-900" 
                  />
                  Internal
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="radio" 
                    name="participantType" 
                    value="external" 
                    checked={participantType === 'external'}
                    onChange={(e) => setParticipantType(e.target.value)}
                    className="appearance-none w-4 h-4 rounded-full border-2 border-slate-300 bg-white checked:bg-white checked:border-[5px] checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all dark:border-slate-600 dark:bg-slate-900 dark:checked:border-blue-500 dark:focus:ring-offset-slate-900" 
                  />
                  Eksternal
                </label>
              </div>

              <AnimatePresence mode="wait">
                {participantType === 'internal' ? (
                  <motion.div 
                    key="internal"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                      Pilih Pegawai
                    </label>
                    <Select
                      isClearable
                      options={employees}
                      value={newInternalParticipant}
                      onChange={(newValue) => setNewInternalParticipant(newValue)}
                      placeholder="Pilih atau cari pegawai..."
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '1em',
                          borderColor: '#e2e8f0',
                          padding: '2px',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#cbd5e1'
                          }
                        }),
                        option: (base) => ({
                          ...base,
                          cursor: 'pointer'
                        })
                      }}
                    />
                  </motion.div>
                ) : (
                <motion.div 
                  key="external"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 mb-6"
                >
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Nama <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newExternalParticipant.name}
                      onChange={(e) => setNewExternalParticipant({...newExternalParticipant, name: e.target.value})}
                      placeholder="Masukkan nama..."
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">NIP <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input
                      type="text"
                      value={newExternalParticipant.nip}
                      onChange={(e) => setNewExternalParticipant({...newExternalParticipant, nip: e.target.value})}
                      placeholder="Masukkan NIP jika ada..."
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Asal Instansi <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input
                      type="text"
                      value={newExternalParticipant.institution}
                      onChange={(e) => setNewExternalParticipant({...newExternalParticipant, institution: e.target.value})}
                      placeholder="Masukkan instansi..."
                      className="w-full rounded-[1em] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setIsParticipantModalOpen(false)}
                  className="cursor-pointer rounded-[1em]"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={(participantType === 'internal' && !newInternalParticipant) || (participantType === 'external' && !newExternalParticipant.name) || isAddingParticipant}
                  className="cursor-pointer rounded-[1em] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingParticipant ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Tambah'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotulaDetailWorkspace;
