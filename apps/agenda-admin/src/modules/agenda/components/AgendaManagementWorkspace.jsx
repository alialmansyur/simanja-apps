import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { confirmDialog } from '../../../utils/sweetalert';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  Eye,
  FileDown,
  Filter,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Building2,
  Clock,
  X,
  Loader2,
  Video,
  List,
  Download
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import agendaService from '../services/agendaService';
import AgendaManagementWorkspaceSkeleton from './AgendaManagementWorkspaceSkeleton';
import Button, { cn } from '../../../components/ui/Button';
import DataTablePagination from '../../../components/ui/DataTablePagination';
import EmptyState from '../../../components/ui/EmptyState';

const statusTone = {
  Publish: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Batal: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  Selesai: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
};

const publishTone = {
  'public': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'unit': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  'personal': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

const categoryTone = {
  Rapat: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Monitoring: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  Sosialisasi: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  Pembahasan: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  Persiapan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Fasilitasi CAT': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
};

const createInitialForm = () => ({
  title: '',
  category: 'Rapat',
  status: 'Draft',
  publishType: 'public',
  startDate: new Date(),
  endDate: new Date(),
  startTime: new Date(),
  endTime: new Date(),
  isOnline: false,
  roomId: '',
  offlineLocation: '', 
  onlineUrl: '',
  onlineMeetingId: '',
  onlinePassword: '',
  stNumber: '',
    ndNumber: '',
  description: '',
  isAllEmployees: true,
  participants: [],
  eventTypeId: '',
  officers: [{ employeeId: '', positionId: '' }],
});

const formatAgendaDate = (dateValue) => {
  if (!dateValue) return '';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
};

const LOADING_DELAY_MS = 650;

const AgendaManagementWorkspace = () => {
  const { user } = useAuth();
  
    const canManage = (activity) => {
    if (!user) return false;
    if (user.role?.name === "Super Admin" || user.role?.name === "Admin") return true;
    if (String(activity.createdBy) === String(user.id)) return true;
    if (activity.publishType === "personal") return String(activity.createdBy) === String(user.id);
    if (activity.publishType === "unit") return String(activity.refUnitId) === String(user.ref_unit_id);
    if (activity.publishType === "public") return true;
    return false;
  };

  const navigate = useNavigate();
  const { uuid } = useParams();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dateValue', direction: 'desc' });
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(activities.map(a => ({
      Judul: a.title,
      Kategori: a.category,
      Status: a.status,
      Tanggal: a.date,
      Waktu: a.time,
      Lokasi: a.isOnline ? `Online: ${a.onlineUrl}` : a.location
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda");
    XLSX.writeFile(wb, `Agenda_${selectedUnit.shortTitle}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`Daftar Agenda - ${selectedUnit.shortTitle}`, 14, 15);
    
    const tableColumn = ["Judul", "Kategori", "Status", "Tanggal", "Lokasi"];
    const tableRows = activities.map(a => [
      a.title, a.category, a.status, a.date, 
      a.isOnline ? 'Online' : a.location
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Agenda_${selectedUnit.shortTitle}.pdf`);
  };

  const handleStatusChange = async (uuid, newStatus) => {
    const activity = activities.find(a => a.uuid === uuid);
    if (!activity) return;

    const result = await confirmDialog({
      title: 'Ubah Status Agenda?',
      text: `Anda yakin ingin mengubah status agenda "${activity.title}" menjadi "${newStatus}"?`,
      confirmButtonText: 'Ya, ubah'
    });

    if (result.isConfirmed) {
      try {
        await agendaService.updateAgendaStatus(uuid, newStatus);
        setActivities(current => current.map(a => 
          a.uuid === uuid ? { ...a, status: newStatus } : a
        ));
        
        setSelectedActivity(prev => {
          if (prev && prev.uuid === uuid) {
            return { ...prev, status: newStatus };
          }
          return prev;
        });

        toast.success('Status berhasil diubah');
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengubah status');
      }
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [agendaForm, setAgendaForm] = useState(createInitialForm());
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Reference data and submission state
  const [rooms, setRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [officerPositions, setOfficerPositions] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [roomsRes, empRes, evTypeRes, offPosRes, catRes] = await Promise.all([
          agendaService.getRooms(),
          agendaService.getEmployees(),
          agendaService.getEventTypes(),
          agendaService.getOfficerPositions(),
          agendaService.getAgendaCategories()
        ]);
        setRooms(roomsRes || []);
        setEmployees(empRes || []);
        setEventTypes(evTypeRes || []);
        setOfficerPositions(offPosRes || []);
        setCategories(catRes || []);
      } catch (err) {
        console.error('Failed fetching refs', err);
      }
    };
    fetchRefs();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isCreateModalOpen) return;
      try {
        const start_date = agendaForm.startDate ? moment(agendaForm.startDate).format('YYYY-MM-DD') : '';
        const end_date = agendaForm.endDate ? moment(agendaForm.endDate).format('YYYY-MM-DD') : '';
        const start_time = agendaForm.startTime ? moment(agendaForm.startTime).format('HH:mm') : '';
        const end_time = agendaForm.endTime ? moment(agendaForm.endTime).format('HH:mm') : '';
        
        const [empRes, roomRes] = await Promise.all([
          agendaService.getEmployeeAvailability({
            start_date, end_date, start_time, end_time, exclude_agenda_id: editingAgenda ? editingAgenda.id : ''
          }),
          agendaService.getRoomAvailability({
            start_date, end_date, start_time, end_time, exclude_agenda_id: editingAgenda ? editingAgenda.id : ''
          })
        ]);
        setAvailableEmployees(empRes || []);
        setAvailableRooms(roomRes || []);
      } catch (err) {
        console.error('Failed fetching availability', err);
      }
    };
    
    // Add a slight debounce to avoid too many requests
    const delayDebounceFn = setTimeout(() => {
      fetchAvailability();
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [agendaForm.startDate, agendaForm.endDate, agendaForm.startTime, agendaForm.endTime, isCreateModalOpen, editingAgenda]);

  const loadActivities = useCallback(async (withSkeleton = false) => {
    if (withSkeleton) {
      setIsLoading(true);
    }

    try {
      const params = {
        page: currentPage,
        per_page: pageSize,
        search: searchQuery,
        category: categoryFilter,
        start_date: startDateFilter,
        end_date: endDateFilter,
        sort_by: sortConfig.key,
        sort_dir: sortConfig.direction,
      };

      const response = await agendaService.getUnitAgendas(uuid, params);
      setActivities(response.data.items || []);
      setTotalItems(response.data.total || 0);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to load agendas', error);
      toast?.error('Gagal memuat data agenda.');
    } finally {
      setIsLoading(false);
    }
  }, [uuid, currentPage, pageSize, searchQuery, categoryFilter, startDateFilter, endDateFilter, sortConfig]);

  useEffect(() => {
    const fetchUnitInfo = async () => {
      try {
        const res = await agendaService.getUnitById(uuid);
        setSelectedUnit({ ...res, title: res.name, shortTitle: res.code });
      } catch (err) {
        navigate('/admin/agenda', { replace: true });
      }
    };
    fetchUnitInfo();
  }, [uuid, navigate]);

  useEffect(() => {
    if (selectedUnit) {
      const delayDebounceFn = setTimeout(() => {
        loadActivities(true);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [loadActivities, selectedUnit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, startDateFilter, endDateFilter, pageSize]);

  if (!selectedUnit) {
    return (
      <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4 animate-pulse">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="h-[36px] w-[90px] rounded-[0.95em] bg-slate-200 dark:bg-slate-800"></div>
            <div className="mt-4 h-7 w-48 rounded-md bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-[36px] w-[200px] rounded-[0.95em] bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-[36px] w-[140px] rounded-[0.95em] bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-[36px] w-[100px] rounded-[0.95em] bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </section>
        <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <AgendaManagementWorkspaceSkeleton />
        </div>
      </div>
    );
  }



  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedActivities = activities;
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalItems);

  const handleDelete = async (activity) => {
    const result = await confirmDialog({
      title: 'Hapus agenda ini?',
      text: `${activity.title} akan dihapus dari daftar kegiatan ${selectedUnit.shortTitle}.`,
      confirmButtonText: 'Ya, hapus'
    });

    if (result.isConfirmed) {
      try {
        await agendaService.deleteAgenda(activity.uuid);
        setActivities((current) => current.filter((item) => item.uuid !== activity.uuid));
        toast.success('Agenda berhasil dihapus');
      } catch (error) {
        toast.error('Gagal menghapus agenda');
        console.error(error);
      }
    }
  };

  const handleFormChange = (field, value) => {
    setAgendaForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditClick = (activity) => {
    setEditingAgenda(activity.uuid);
    setAgendaForm({
      title: activity.title || '',
      category: activity.category || 'Rapat',
      status: activity.status || 'Draft',
      publishType: activity.publishType || 'public',
      startDate: activity.startDate ? new Date(activity.startDate) : new Date(),
      endDate: activity.endDate ? new Date(activity.endDate) : new Date(),
      startTime: activity.startTime ? new Date(`1970-01-01T${activity.startTime}`) : new Date(),
      endTime: activity.endTime ? new Date(`1970-01-01T${activity.endTime}`) : new Date(),
      isOnline: activity.isOnline || false,
      roomId: activity.roomId ? activity.roomId.toString() : (activity.offlineLocation ? 'lainnya' : ''),
      offlineLocation: activity.offlineLocation || '',
      onlineUrl: activity.onlineUrl || '',
      onlineMeetingId: activity.onlineMeetingId || '',
      onlinePassword: activity.onlinePassword || '',
      stNumber: activity.stNumber || '',
        ndNumber: activity.ndNumber || '',
      description: activity.description || '',
      isAllEmployees: activity.isAllEmployees ?? true,
      participants: activity.participants ? activity.participants.map(p => p.value ? p.value.toString() : '') : [],
      eventTypeId: activity.eventTypeId ? activity.eventTypeId.toString() : '',
      officers: activity.category === 'Fasilitasi CAT' && activity.participants && activity.participants.length > 0 
        ? activity.participants.map(p => ({
            employeeId: p.value ? p.value.toString() : '',
            positionId: p.positionId ? p.positionId.toString() : ''
          })) 
        : [{ employeeId: '', positionId: '' }],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateAgenda = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        title: agendaForm.title.trim(),
        category: agendaForm.category,
        status: agendaForm.status,
        publishType: agendaForm.publishType,
        startDate: agendaForm.startDate ? moment(agendaForm.startDate).format('YYYY-MM-DD') : null,
        endDate: agendaForm.endDate ? moment(agendaForm.endDate).format('YYYY-MM-DD') : null,
        startTime: agendaForm.startTime ? moment(agendaForm.startTime).format('HH:mm:ss') : null,
        endTime: agendaForm.endTime ? moment(agendaForm.endTime).format('HH:mm:ss') : null,
        isOnline: agendaForm.isOnline,
        roomId: (agendaForm.isOnline || !agendaForm.roomId || agendaForm.roomId === 'lainnya') ? null : parseInt(agendaForm.roomId, 10),
        offlineLocation: agendaForm.roomId === 'lainnya' ? agendaForm.offlineLocation.trim() : null,
        onlineUrl: agendaForm.onlineUrl.trim(),
        onlineMeetingId: agendaForm.onlineMeetingId.trim(),
        onlinePassword: agendaForm.onlinePassword.trim(),
        stNumber: agendaForm.stNumber.trim(),
        description: agendaForm.description.trim(),
        isAllEmployees: agendaForm.isAllEmployees,
        participants: agendaForm.isAllEmployees ? [] : agendaForm.participants.map(id => parseInt(id, 10)),
        eventTypeId: agendaForm.category === 'Fasilitasi CAT' && agendaForm.eventTypeId ? parseInt(agendaForm.eventTypeId, 10) : null,
        officers: agendaForm.category === 'Fasilitasi CAT' 
          ? agendaForm.officers.map(o => ({
              employeeId: parseInt(o.employeeId, 10),
              positionId: parseInt(o.positionId, 10)
            })).filter(o => o.employeeId && o.positionId)
          : null,
      };

      if (editingAgenda) {
        await agendaService.updateAgenda(editingAgenda, payload);
        toast?.success('Agenda berhasil diperbarui!');
      } else {
        await agendaService.createUnitAgenda(uuid, payload);
        toast?.success('Agenda berhasil dijadwalkan!');
      }
      
      setAgendaForm(createInitialForm());
      setEditingAgenda(null);
      setIsCreateModalOpen(false);
      loadActivities(true);
    } catch (error) {
      console.error('Failed to create agenda', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast?.error('Database Error: ' + error.response.data.error);
      } else if (error.response && error.response.status === 422) {
        // Validation errors are usually handled by axios interceptor, but just in case
        toast?.error('Gagal memvalidasi data form.');
      } else {
        toast?.error('Gagal menjadwalkan agenda. Pastikan semua form terisi dengan benar.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setCategoryFilter('Semua');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
    loadActivities(true);
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortableHead = ({ label, sortKey, align = 'left' }) => (
    <th className={cn('px-5 py-3', align === 'right' ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.28em] transition hover:text-slate-700 dark:hover:text-slate-200',
          sortConfig.key === sortKey ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <span>{label}</span>
        <ChevronsUpDown size={14} strokeWidth={1.75} />
      </button>
    </th>
  );

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.resource?.category === 'rapat' || event.resource?.category?.toLowerCase().includes('rapat')) backgroundColor = '#10b981';
    if (event.resource?.category === 'sosialisasi' || event.resource?.category?.toLowerCase().includes('sosialisasi')) backgroundColor = '#f59e0b';

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        border: '0px',
        color: '#fff',
        fontSize: '0.8rem',
        fontWeight: '600',
        opacity: 0.96,
        padding: '3px 8px',
      },
    };
  };

  const CustomEvent = ({ event }) => {
    return (
      <div className="group relative flex h-full w-full items-center">
        <div className="w-full truncate">{event.title}</div>
        <div className="invisible absolute bottom-full left-1/2 z-[100] mb-2 w-max max-w-[250px] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-left text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
          <p className="text-sm font-bold leading-tight whitespace-normal">{event.title}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock size={12} />
            <span>
              {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </span>
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-300">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span className="whitespace-normal leading-tight">{event.location}</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomToolbar = (toolbar) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const pickerRef = useRef(null);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          setShowDatePicker(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="mb-6 flex flex-col items-center justify-between gap-4 xl:flex-row">
        <div className="flex rounded-2xl bg-slate-100 p-1 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <button
            type="button"
            onClick={() => toolbar.onNavigate('TODAY')}
            className="flex cursor-pointer items-center gap-2 rounded-[1rem] px-4 py-3 font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            <CalendarDays size={16} />
            <span>Hari Ini</span>
          </button>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('PREV')}
            className="cursor-pointer rounded-[1rem] px-4 py-3 transition hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('NEXT')}
            className="cursor-pointer rounded-[1rem] px-4 py-3 transition hover:bg-white dark:hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker((current) => !current)}
            className="flex cursor-pointer items-center gap-2 rounded-[1rem] px-3 py-2 text-2xl font-bold tracking-tight text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-900/70"
          >
            <span>{toolbar.label}</span>
            <ChevronDown size={18} className={showDatePicker ? 'rotate-180 text-blue-500 dark:text-blue-400' : 'text-slate-400'} />
          </button>

          {showDatePicker ? (
            <div className="absolute left-1/2 top-full z-40 mt-3 w-72 -translate-x-1/2 rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear() - 1, toolbar.date.getMonth(), 1))}
                  className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{toolbar.date.getFullYear()}</span>
                <button
                  type="button"
                  onClick={() => toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear() + 1, toolbar.date.getMonth(), 1))}
                  className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      toolbar.onNavigate('DATE', new Date(toolbar.date.getFullYear(), index, 1));
                      setShowDatePicker(false);
                    }}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition ${
                      toolbar.date.getMonth() === index
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex rounded-2xl bg-slate-100 p-1 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {['month', 'week', 'day'].map((viewName) => (
            <button
              key={viewName}
              type="button"
              onClick={() => toolbar.onView(viewName)}
              className={`cursor-pointer rounded-[1rem] px-5 py-3 font-semibold capitalize transition ${
                toolbar.view === viewName ? 'bg-white text-blue-600 dark:bg-slate-700 dark:text-blue-300' : 'hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {viewName === 'month' ? 'Bulan' : viewName === 'week' ? 'Minggu' : 'Hari'}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/agenda')}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[0.95em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-extrabold tracking-[0.01em] text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>

          <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            {selectedUnit?.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-base font-medium leading-6 text-slate-500 dark:text-slate-400">
            Kelola daftar agenda, jadwal kegiatan, dan status persetujuan secara spesifik
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700">
            <FileDown size={16} />
            Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700"
            onClick={handleExportExcel}
          >
            <Download size={16} />
            Export Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </section>

      {/* Warning Alert */}
      <div className="flex items-center gap-3 rounded-[0.95em] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
          <span className="text-sm font-extrabold">!</span>
        </div>
        <p className="text-sm font-medium opacity-90">
          <strong className="font-bold">Warning:</strong> Pastikan data yang anda akan input sesuai. Agenda hanya bisa di input di tanggal dan jam yang kosong.
        </p>
      </div>

      {/* Action Banner */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-[0.95em] border-2 border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Jadwalkan Agenda Baru</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Buat data agenda atau jadwal kegiatan baru untuk unit ini ke dalam sistem.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="cursor-pointer shrink-0 gap-2 rounded-[0.95em] px-6 py-2.5 shadow-sm"
        >
          <Plus size={16} />
          Tambah Agenda
        </Button>
      </section>

      <section className="rounded-[0.95em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Daftar Agenda Unit</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {totalItems} agenda ditemukan dari {activities.length} data.
              </p>
            </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFilterVisible((current) => !current)}
                  className="flex h-[42px] cursor-pointer items-center gap-2 rounded-[0.95em] border border-slate-200 bg-slate-50 px-3 text-[0.72rem] font-extrabold tracking-[0.01em] text-blue-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-blue-300 dark:hover:border-blue-900"
              >
                <Filter size={16} />
                Filter Data
                <ChevronDown size={16} className={cn('transition duration-200', isFilterVisible ? 'rotate-180' : '')} />
              </button>

                <div className="admin-toolbar-control flex h-[42px] items-center gap-2 rounded-[0.95em] border border-slate-200 bg-slate-50 px-3 text-[0.75rem] font-extrabold tracking-[0.01em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <ChevronsLeftRight size={16} className="text-slate-400 dark:text-slate-500" />
                  <span>Show</span>
                  <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="cursor-pointer bg-transparent text-slate-700 outline-none dark:text-slate-200"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="relative flex h-[42px] items-center rounded-[0.95em] border border-slate-200 bg-slate-50 p-[3px] dark:border-slate-800 dark:bg-slate-950/60 sm:ml-auto">
                  <div className={cn("absolute inset-y-[3px] w-[calc(50%-3px)] rounded-[0.75em] bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-slate-800", viewMode === 'calendar' ? "left-[50%]" : "left-[3px]")} />
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn("relative z-10 flex h-full w-24 cursor-pointer items-center justify-center gap-2 rounded-[0.75em] text-[0.72rem] font-extrabold tracking-[0.01em] transition-colors whitespace-nowrap", viewMode === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={cn("relative z-10 flex h-full w-24 cursor-pointer items-center justify-center gap-2 rounded-[0.75em] text-[0.72rem] font-extrabold tracking-[0.01em] transition-colors whitespace-nowrap", viewMode === 'calendar' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                  >
                    Kalender
                  </button>
                </div>
              </div>
            </div>
          </div>

        <div
          className={cn(
            'overflow-hidden border-b border-slate-200 bg-slate-50/60 transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-950/30',
            isFilterVisible ? 'max-h-[28rem] opacity-100' : 'max-h-0 border-b-0 opacity-0'
          )}
        >
          <div
            className={cn(
              'px-5 py-4 transition duration-300 ease-out',
              isFilterVisible ? 'translate-y-0' : '-translate-y-2'
            )}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_12rem_12rem_12rem_auto]">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pencarian
                </span>
                <div className="admin-filter-input-shell admin-filter-field rounded-[0.95em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Search size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, No ST..."
                    className="admin-filter-field w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Kategori
                </span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="admin-filter-field w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="Semua">Semua</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Tanggal Mulai
                </span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  className="admin-filter-field w-full rounded-[0.95em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Tanggal Selesai
                </span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  className="admin-filter-field w-full rounded-[0.95em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>

              <div className="flex min-w-0 items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('Semua');
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="admin-filter-field inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[0.95em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                >
                  <RotateCcw size={15} />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <AgendaManagementWorkspaceSkeleton />
        ) : (
          <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="admin-calendar-shell rounded-[0.95em] bg-slate-50 p-5 dark:bg-slate-900 h-[600px] w-full overflow-hidden"
            >
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  .admin-calendar-shell .rbc-toolbar { display: none; }
                  .admin-calendar-shell .rbc-header {
                    padding: 14px 0;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.78rem;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                    background: transparent;
                  }
                  .admin-calendar-shell .rbc-month-view,
                  .admin-calendar-shell .rbc-time-view,
                  .admin-calendar-shell .rbc-agenda-view,
                  .admin-calendar-shell .rbc-month-row,
                  .admin-calendar-shell .rbc-day-bg,
                  .admin-calendar-shell .rbc-time-content,
                  .admin-calendar-shell .rbc-time-header-content,
                  .admin-calendar-shell .rbc-timeslot-group {
                    border-color: #e2e8f0;
                  }
                  .admin-calendar-shell .rbc-day-bg,
                  .admin-calendar-shell .rbc-month-row,
                  .admin-calendar-shell .rbc-time-content,
                  .admin-calendar-shell .rbc-time-view,
                  .admin-calendar-shell .rbc-time-header-content {
                    background: #ffffff;
                  }
                  .admin-calendar-shell .rbc-off-range-bg { background: #f8fafc; }
                  .admin-calendar-shell .rbc-off-range { color: #94a3b8; opacity: 0.9; }
                  .admin-calendar-shell .rbc-date-cell,
                  .admin-calendar-shell .rbc-button-link,
                  .admin-calendar-shell .rbc-label,
                  .admin-calendar-shell .rbc-time-content,
                  .admin-calendar-shell .rbc-time-header-gutter,
                  .admin-calendar-shell .rbc-time-gutter .rbc-timeslot-group {
                    color: #0f172a;
                  }
                  .admin-calendar-shell .rbc-today { background-color: #eff6ff; }
                  .admin-calendar-shell .rbc-current-time-indicator { background-color: #ef4444; height: 2px; }
                  .admin-calendar-shell .rbc-current-time-indicator::before {
                    content: '';
                    position: absolute;
                    left: -4px;
                    top: -4px;
                    width: 10px;
                    height: 10px;
                    border-radius: 9999px;
                    background-color: #ef4444;
                  }
                  .admin-calendar-shell .rbc-event {
                    overflow: visible !important;
                  }
                  .admin-calendar-shell .rbc-event-content,
                  .admin-calendar-shell .rbc-month-row,
                  .admin-calendar-shell .rbc-row-content {
                    overflow: visible !important;
                  }
                  .dark .admin-calendar-shell .rbc-header {
                    color: #93a4bf;
                    border-bottom-color: #243045;
                  }
                  .dark .admin-calendar-shell .rbc-month-view,
                  .dark .admin-calendar-shell .rbc-time-view,
                  .dark .admin-calendar-shell .rbc-agenda-view,
                  .dark .admin-calendar-shell .rbc-month-row,
                  .dark .admin-calendar-shell .rbc-day-bg,
                  .dark .admin-calendar-shell .rbc-time-content,
                  .dark .admin-calendar-shell .rbc-time-header-content,
                  .dark .admin-calendar-shell .rbc-timeslot-group {
                    border-color: #243045;
                  }
                  .dark .admin-calendar-shell .rbc-day-bg,
                  .dark .admin-calendar-shell .rbc-month-row,
                  .dark .admin-calendar-shell .rbc-time-content,
                  .dark .admin-calendar-shell .rbc-time-view,
                  .dark .admin-calendar-shell .rbc-time-header-content {
                    background: #101826;
                  }
                  .dark .admin-calendar-shell .rbc-off-range-bg { background: #060b15; }
                  .dark .admin-calendar-shell .rbc-off-range { color: #334155; }
                  .dark .admin-calendar-shell .rbc-date-cell,
                  .dark .admin-calendar-shell .rbc-button-link,
                  .dark .admin-calendar-shell .rbc-label,
                  .dark .admin-calendar-shell .rbc-time-content,
                  .dark .admin-calendar-shell .rbc-time-header-gutter,
                  .dark .admin-calendar-shell .rbc-time-gutter .rbc-timeslot-group {
                    color: #e2e8f0;
                  }
                  .dark .admin-calendar-shell .rbc-today { background-color: rgba(30, 41, 59, 0.7); }
                `,
              }}
            />
            <Calendar
              localizer={momentLocalizer(moment)}
              events={activities.map(a => {
                const safeStartDate = (a.startDate || a.start_date || a.dateValue || new Date().toISOString().split('T')[0]).trim();
                const safeEndDate = (a.endDate || a.end_date || safeStartDate).trim();
                const safeStartTime = (a.startTime || a.start_time || '00:00:00').trim();
                const safeEndTime = (a.endTime || a.end_time || '23:59:59').trim();
                
                // Construct ISO strings
                const startString = `${safeStartDate}T${safeStartTime}`;
                const endString = `${safeEndDate}T${safeEndTime}`;
                
                let start = new Date(startString);
                let end = new Date(endString);
                
                // Ultimate fallback if parsing still fails
                if (isNaN(start.getTime())) {
                  start = new Date(safeStartDate); // Try parsing just the date
                  if (isNaN(start.getTime())) start = new Date();
                }
                
                if (isNaN(end.getTime())) {
                  end = new Date(safeEndDate);
                  if (isNaN(end.getTime())) end = start;
                }
                
                return { 
                  title: a.title || 'Tanpa Judul', 
                  start, 
                  end, 
                  resource: a,
                  location: a.room || a.location || '-'
                };
              })}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', width: '100%' }}
              view={calendarView}
              onView={setCalendarView}
              date={calendarDate}
              onNavigate={setCalendarDate}
              onSelectEvent={event => setSelectedActivity(event.resource)}
              eventPropGetter={eventStyleGetter}
              components={{ toolbar: CustomToolbar, event: CustomEvent }}
              messages={{
                next: "Selanjutnya",
                previous: "Sebelumnya",
                today: "Hari Ini",
                month: "Bulan",
                week: "Minggu",
                day: "Hari"
              }}
            />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto"
            >
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/40">
                <tr className="text-left">
                  <SortableHead label="Agenda & Kategori" sortKey="title" />
                  <SortableHead label="Jadwal" sortKey="start_date" />
                  <SortableHead label="Status" sortKey="status_name" />
                  <SortableHead label="Lokasi" sortKey="room_name" />
                  <th className="px-5 py-3 text-right text-[8px] font-extrabold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-0 py-8">
                    <EmptyState 
                      title="Tidak ada agenda yang cocok" 
                      description="Ubah kata kunci pencarian atau reset filter untuk melihat data lain." 
                    />
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((activity) => (
                  <tr key={activity.uuid} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                    <td className="px-5 py-4">
                      <div className="min-w-[15rem]">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">{activity.title}</p>
                        {activity.stNumber && activity.stNumber !== '0' && (
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{activity.stNumber}</p>
                        )}
                        <div className="mt-2.5">
                          <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', categoryTone[activity.category])}>
                            {activity.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[11rem] text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <p>{activity.date}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{activity.time}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select 
                        value={activity.status} 
                        onChange={(e) => handleStatusChange(activity.uuid, e.target.value)}
                        className={cn('cursor-pointer rounded-[0.95em] border border-slate-200 pl-3 pr-8 py-1.5 text-xs font-bold outline-none transition appearance-none bg-[url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E\')] bg-[length:1em_1em] bg-[right_0.5rem_center] bg-no-repeat', statusTone[activity.status] || statusTone['Draft'])}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Publish">Publish</option>
                        <option value="Batal">Batal</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {activity.isOnline ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Video size={14} />
                          <span>Online (Zoom/Meet)</span>
                        </div>
                      ) : (
                        activity.location
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(activity)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                          aria-label={`Detail ${activity.title}`}
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {canManage(activity) && (
<button
                          type="button"
                          onClick={() => handleEditClick(activity)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-900 dark:hover:text-amber-300"
                          aria-label={`Edit ${activity.title}`}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
)}
                        {canManage(activity) && (
<button
                          type="button"
                          onClick={() => handleDelete(activity)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-300"
                          aria-label={`Hapus ${activity.title}`}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        <DataTablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startItem={startItem}
          endItem={endItem}
          totalItems={totalItems}
        />
      </section>

      {selectedActivity ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Detail Agenda</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedActivity.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 mt-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {/* Deskripsi */}
                <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Deskripsi</span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white sm:w-2/3 sm:text-right">
                    {selectedActivity.description || '-'}
                  </div>
                </div>

                {/* Kategori */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', categoryTone[selectedActivity.category])}>
                    {selectedActivity.category}
                  </span>
                </div>

                {/* Jenis Kegiatan (Event Type) */}
                {selectedActivity.category === 'Fasilitasi CAT' && (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Jenis Kegiatan</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {eventTypes.find(et => et.id.toString() === selectedActivity.eventTypeId?.toString())?.name || '-'}
                    </span>
                  </div>
                )}

                {/* Status Agenda */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status Agenda</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedActivity.status] || statusTone['Draft'])}>
                    {selectedActivity.status}
                  </span>
                </div>

                {/* Tipe Publikasi */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipe Publikasi</span>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', publishTone[selectedActivity.publishType] || publishTone['public'])}>
                    {selectedActivity.publishType === 'public' ? 'Publik' : selectedActivity.publishType === 'unit' ? 'Unit' : 'Personal'}
                  </span>
                </div>

                {/* Waktu Pelaksanaan */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Waktu Pelaksanaan</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span>{selectedActivity.date}, {selectedActivity.time}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lokasi</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedActivity.isOnline ? <Video size={16} className="text-blue-500" /> : <MapPin size={16} className="text-blue-500" />}
                    <span>{selectedActivity.location}</span>
                  </div>
                </div>

                {/* Tautan Meeting (Jika Online) */}
                {selectedActivity.isOnline && (
                  <>
                    {selectedActivity.onlineUrl && (
                      <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tautan Meeting</span>
                        <a href={selectedActivity.onlineUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                          Join URL
                        </a>
                      </div>
                    )}
                    {selectedActivity.onlineMeetingId && (
                      <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Meeting ID</span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedActivity.onlineMeetingId}
                        </span>
                      </div>
                    )}
                    {selectedActivity.onlinePassword && (
                      <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Passcode</span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedActivity.onlinePassword}
                        </span>
                      </div>
                    )}
                  </>
                )}

                
                {/* Pembuat Agenda */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pembuat Agenda</span>
                  <div className="flex flex-col items-end text-sm font-semibold text-slate-900 dark:text-white">
                    <span>{selectedActivity.creatorName || '-'}</span>
                    {selectedActivity.creatorNip && <span className="text-xs text-slate-500 font-normal">NIP: {selectedActivity.creatorNip}</span>}
                  </div>
                </div>

                {/* Tim Kerja */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tim Kerja</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Building2 size={16} className="text-blue-500" />
                    <span>{selectedActivity.team}</span>
                  </div>
                </div>

                {/* No Surat Tugas */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Surat Tugas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedActivity.stNumber && selectedActivity.stNumber !== '0' ? selectedActivity.stNumber : '-'}
                  </span>
                </div>

                {/* No Nota Dinas */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Nota Dinas</span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {selectedActivity.ndNumber && selectedActivity.ndNumber !== '0' ? selectedActivity.ndNumber : '-'}
                  </span>
                </div>

                {/* Partisipan / Petugas */}
                {selectedActivity.category === 'Fasilitasi CAT' ? (
                  <div className="flex flex-col py-4 gap-2 border-b-0">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Petugas</span>
                    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Jabatan</th>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">NIP</th>
                            <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">Nama Petugas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {selectedActivity.participants?.length > 0 ? (
                            selectedActivity.participants.map((p, idx) => {
                              const posName = officerPositions.find(op => op.id.toString() === p.positionId?.toString())?.name || '-';
                              return (
                                <tr key={idx} className="bg-white dark:bg-slate-900">
                                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{posName}</td>
                                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{p.nip || '-'}</td>
                                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{p.label}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="bg-white dark:bg-slate-900">
                              <td colSpan={3} className="px-4 py-3 text-center text-slate-500">Tidak ada petugas</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col py-4 sm:flex-row sm:items-start sm:justify-between gap-2 border-b-0">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">Partisipan</span>
                    <div className="flex flex-wrap gap-2 sm:w-2/3 sm:justify-end">
                      {selectedActivity.isAllEmployees ? (
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                          Semua Pegawai
                        </span>
                      ) : (
                        selectedActivity.participants?.length > 0 ? (
                          selectedActivity.participants.map((participant) => (
                            <span
                              key={participant.value}
                              className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {participant.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Tidak ada spesifik</span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange(selectedActivity.uuid, 'Batal')} className="w-28 cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-none dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">Batal Agenda</Button>
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange(selectedActivity.uuid, 'Selesai')} className="w-28 cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-none dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">Selesai Agenda</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {editingAgenda ? 'Edit Agenda' : 'Tambah Agenda'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedUnit.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if(!isSubmitting){
                    setIsCreateModalOpen(false);
                    setAgendaForm(createInitialForm());
                    setEditingAgenda(null);
                  }
                }}
                disabled={isSubmitting}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAgenda} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Judul Agenda
                    </span>
                    <input
                      type="text"
                      value={agendaForm.title}
                      onChange={(event) => handleFormChange('title', event.target.value)}
                      placeholder="Masukkan judul agenda"
                      required
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Deskripsi Kegiatan
                    </span>
                    <textarea
                      value={agendaForm.description}
                      onChange={(event) => handleFormChange('description', event.target.value)}
                      placeholder="Tulis detail kegiatan yang akan dilakukan..."
                      rows={4}
                      disabled={isSubmitting}
                      className="w-full resize-none rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Kategori
                    </span>
                    <select
                      value={agendaForm.category}
                      onChange={(event) => handleFormChange('category', event.target.value)}
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </label>

                  {agendaForm.category === 'Fasilitasi CAT' && (
                    <label className="block animate-in fade-in slide-in-from-top-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Jenis Kegiatan
                      </span>
                      <select
                        value={agendaForm.eventTypeId}
                        onChange={(event) => handleFormChange('eventTypeId', event.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">-- Pilih Jenis Kegiatan --</option>
                        {eventTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="grid gap-5 md:grid-cols-2 md:col-span-2">
<label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Status Agenda
                    </span>
                    <select
                      value={agendaForm.status}
                      onChange={(event) => handleFormChange('status', event.target.value)}
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Publish">Publish</option>
                      <option value="Batal">Batal</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </label>

                  <label className="block ">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Tipe Publikasi
                    </span>
                    <select
                      value={agendaForm.publishType}
                      onChange={(event) => handleFormChange('publishType', event.target.value)}
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="public">Publik (Semua Pengguna)</option>
                      <option value="unit">Unit (Satu Unit Kerja)</option>
                      <option value="personal">Personal (Hanya Saya)</option>
                    </select>
                  </label>
                  </div>

                  {/* Waktu Section */}
                  <div className="col-span-1 md:col-span-2 rounded-[0.95em] border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <h4 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Waktu Pelaksanaan</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tanggal Mulai
                        </span>
                        <div className="admin-datepicker-wrapper">
                          <DatePicker
                            selected={agendaForm.startDate}
                            onChange={(date) => handleFormChange('startDate', date)}
                            dateFormat="dd/MM/yyyy"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tanggal Selesai
                        </span>
                        <div className="admin-datepicker-wrapper">
                          <DatePicker
                            selected={agendaForm.endDate}
                            minDate={agendaForm.startDate}
                            onChange={(date) => handleFormChange('endDate', date)}
                            dateFormat="dd/MM/yyyy"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Jam Mulai
                        </span>
                        <div className="admin-datepicker-wrapper">
                          <DatePicker
                            selected={agendaForm.startTime}
                            onChange={(time) => handleFormChange('startTime', time)}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Jam"
                            dateFormat="HH:mm"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Jam Selesai
                        </span>
                        <div className="admin-datepicker-wrapper">
                          <DatePicker
                            selected={agendaForm.endTime}
                            onChange={(time) => handleFormChange('endTime', time)}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Jam"
                            dateFormat="HH:mm"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Lokasi Section */}
                  <div className="col-span-1 md:col-span-2 rounded-[0.95em] border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Lokasi Kegiatan</h4>
                      <div className="relative flex rounded-full bg-slate-200/60 p-0.5 dark:bg-slate-800/60">
                        <div className={cn("absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-slate-700", agendaForm.isOnline ? "left-[50%]" : "left-1")} />
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleFormChange('isOnline', false)}
                          className={cn('relative z-10 w-24 rounded-full py-0.5 text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer', !agendaForm.isOnline ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                        >
                          Offline
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleFormChange('isOnline', true)}
                          className={cn('relative z-10 w-24 rounded-full py-0.5 text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer', agendaForm.isOnline ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                        >
                          Online
                        </button>
                      </div>
                    </div>

                    {!agendaForm.isOnline ? (
                      <div className="grid gap-4">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Pilih Ruangan
                          </span>
                          <div className="admin-filter-select">
                            <Select
                              options={[
                                ...(availableRooms.length > 0 ? availableRooms : rooms).map(room => {
                                  const isUnavailable = !room.is_available && room.is_available !== undefined;
                                  return {
                                    value: room.id.toString(),
                                    label: room.name,
                                    isDisabled: isUnavailable,
                                    conflict: isUnavailable ? room.conflict_description : null
                                  };
                                }),
                                { value: 'lainnya', label: 'Lainnya...', isDisabled: false }
                              ]}
                              value={[
                                ...(availableRooms.length > 0 ? availableRooms : rooms).map(room => ({
                                  value: room.id.toString(),
                                  label: room.name,
                                  isDisabled: !room.is_available && room.is_available !== undefined,
                                  conflict: room.conflict_description
                                })),
                                { value: 'lainnya', label: 'Lainnya...' }
                              ].find(opt => opt.value === agendaForm.roomId) || null}
                              onChange={(selectedOption) => handleFormChange('roomId', selectedOption ? selectedOption.value : '')}
                              isOptionDisabled={(option) => option.isDisabled}
                              formatOptionLabel={(option) => (
                                <div className={cn(option.isDisabled ? 'text-red-500' : '')}>
                                  <div>{option.label}</div>
                                  {option.isDisabled && <div className="text-[10px] italic text-red-500/80">{option.conflict}</div>}
                                </div>
                              )}
                              placeholder="-- Pilih Ruangan --"
                              isDisabled={isSubmitting}
                              classNamePrefix="admin-react-select"
                              noOptionsMessage={() => "Tidak ada data ruangan"}
                            />
                          </div>
                        </label>
                        {agendaForm.roomId === 'lainnya' && (
                          <label className="block animate-in fade-in slide-in-from-top-2">
                            <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Detail Tempat Lainnya
                            </span>
                            <input
                              type="text"
                              value={agendaForm.offlineLocation}
                              onChange={(event) => handleFormChange('offlineLocation', event.target.value)}
                              placeholder="Masukkan nama lokasi/tempat"
                              required
                              disabled={isSubmitting}
                              className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            URL Zoom / Meeting
                          </span>
                          <input
                            type="url"
                            value={agendaForm.onlineUrl}
                            onChange={(event) => handleFormChange('onlineUrl', event.target.value)}
                            placeholder="https://zoom.us/j/..."
                            required
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Meeting ID
                          </span>
                          <input
                            type="text"
                            value={agendaForm.onlineMeetingId}
                            onChange={(event) => handleFormChange('onlineMeetingId', event.target.value)}
                            placeholder="123 456 7890"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Password / Passcode
                          </span>
                          <input
                            type="text"
                            value={agendaForm.onlinePassword}
                            onChange={(event) => handleFormChange('onlinePassword', event.target.value)}
                            placeholder="Passcode"
                            disabled={isSubmitting}
                            className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 md:col-span-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No Surat Tugas
                    </span>
                    <input
                      type="text"
                      value={agendaForm.stNumber}
                      onChange={(event) => handleFormChange('stNumber', event.target.value)}
                      placeholder="Contoh: ST/AGD/2026/006"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No ND
                    </span>
                    <input
                      type="text"
                      value={agendaForm.ndNumber}
                      onChange={(event) => handleFormChange('ndNumber', event.target.value)}
                      placeholder="Contoh: ND/AGD/2026/001"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                  </div>

                  {/* Partisipan Section */}
                  {agendaForm.category === 'Fasilitasi CAT' ? (
                    <div className="col-span-1 md:col-span-2 rounded-[0.95em] border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                      <h4 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Petugas</h4>
                      <div className="space-y-4">
                        {agendaForm.officers.map((officer, index) => (
                          <div key={index} className="flex gap-4 items-start">
                            <div className="w-1/3">
                              <select
                                value={officer.positionId}
                                onChange={(e) => {
                                  const newOfficers = [...agendaForm.officers];
                                  newOfficers[index].positionId = e.target.value;
                                  handleFormChange('officers', newOfficers);
                                }}
                                disabled={isSubmitting}
                                className="admin-fixed-height w-full cursor-pointer rounded-[0.95em] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                >
                                <option value="">-- Jabatan --</option>
                                {officerPositions.map(pos => (
                                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 admin-filter-select">
                              <Select
                                value={
                                  availableEmployees.find(emp => emp.id.toString() === officer.employeeId?.toString()) 
                                    ? { 
                                        value: availableEmployees.find(emp => emp.id.toString() === officer.employeeId?.toString()).id, 
                                        label: `${availableEmployees.find(emp => emp.id.toString() === officer.employeeId?.toString()).name}` 
                                      } 
                                    : null
                                }
                                onChange={(selected) => {
                                  const newOfficers = [...agendaForm.officers];
                                  newOfficers[index].employeeId = selected ? selected.value.toString() : '';
                                  handleFormChange('officers', newOfficers);
                                }}
                                options={(availableEmployees.length > 0 ? availableEmployees : employees).map(emp => {
                                  const isSelectedInOtherRow = agendaForm.officers.some((o, i) => i !== index && o.employeeId === emp.id.toString());
                                  const isUnavailable = !emp.is_available && emp.is_available !== undefined;
                                  return {
                                    value: emp.id,
                                    label: `${emp.name}`,
                                    isDisabled: isUnavailable || isSelectedInOtherRow,
                                    conflict: isUnavailable ? emp.conflict_description : (isSelectedInOtherRow ? 'Sudah dipilih' : null)
                                  };
                                })}
                                isOptionDisabled={(option) => option.isDisabled}
                                formatOptionLabel={(option) => (
                                  <div className={cn(option.isDisabled ? 'text-red-500' : '')}>
                                    <div>{option.label}</div>
                                    {option.isDisabled && <div className="text-[10px] italic text-red-500/80">{option.conflict}</div>}
                                  </div>
                                )}
                                placeholder="Cari NIP / Nama..."
                                isDisabled={isSubmitting}
                                classNamePrefix="admin-react-select"
                                noOptionsMessage={() => "Tidak ada data pegawai"}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newOfficers = agendaForm.officers.filter((_, i) => i !== index);
                                handleFormChange('officers', newOfficers);
                              }}
                              disabled={isSubmitting || agendaForm.officers.length === 1}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => {
                            handleFormChange('officers', [...agendaForm.officers, { employeeId: '', positionId: '' }]);
                          }}
                          variant="secondary"
                          size="sm"
                          disabled={isSubmitting}
                          className="mt-2 text-xs"
                        >
                          <Plus size={14} className="mr-1" /> Tambah Petugas
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-1 md:col-span-2 rounded-[0.95em] border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Partisipan</h4>
                        <div className="relative flex rounded-full bg-slate-200/60 p-0.5 dark:bg-slate-800/60">
                          <div className={cn("absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-slate-700", !agendaForm.isAllEmployees ? "left-[50%]" : "left-1")} />
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleFormChange('isAllEmployees', true)}
                            className={cn('relative z-10 w-24 rounded-full py-0.5 text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer', agendaForm.isAllEmployees ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                          >
                            Semua
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleFormChange('isAllEmployees', false)}
                            className={cn('relative z-10 w-28 rounded-full py-0.5 text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer', !agendaForm.isAllEmployees ? 'text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}
                          >
                            Tertentu
                          </button>
                        </div>
                      </div>
                      
                      {!agendaForm.isAllEmployees && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Pilih pegawai yang wajib hadir:</p>
                          <div className="admin-filter-select">
                            <Select
                              isMulti
                              options={(availableEmployees.length > 0 ? availableEmployees : employees).map(emp => {
                                  const isUnavailable = !emp.is_available && emp.is_available !== undefined;
                                  return {
                                    value: emp.id,
                                    label: `${emp.name}`,
                                    isDisabled: isUnavailable,
                                    conflict: isUnavailable ? emp.conflict_description : null
                                  };
                                })}
                              value={(availableEmployees.length > 0 ? availableEmployees : employees)
                                .filter(emp => agendaForm.participants.includes(emp.id.toString()) || agendaForm.participants.includes(parseInt(emp.id, 10)))
                                .map(emp => ({ 
                                  value: emp.id, 
                                  label: `${emp.name}`,
                                  isDisabled: !emp.is_available && emp.is_available !== undefined,
                                  conflict: emp.conflict_description 
                                }))}
                              onChange={(selectedOptions) => {
                                handleFormChange('participants', selectedOptions ? selectedOptions.map(opt => opt.value.toString()) : []);
                              }}
                              isOptionDisabled={(option) => option.isDisabled}
                              formatOptionLabel={(option) => (
                                <div className={cn(option.isDisabled ? 'text-red-500' : '')}>
                                  <div>{option.label}</div>
                                  {option.isDisabled && <div className="text-[10px] italic text-red-500/80">{option.conflict}</div>}
                                </div>
                              )}
                              placeholder="Cari & Pilih Pegawai..."
                              isDisabled={isSubmitting}
                              classNamePrefix="admin-react-select"
                              noOptionsMessage={() => "Tidak ada data pegawai"}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setAgendaForm(createInitialForm());
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="cursor-pointer gap-2 bg-blue-600 shadow-none hover:bg-blue-700 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AgendaManagementWorkspace;
