import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../utils/sweetalert';
import {
  Building2,
  ChevronsUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  Eye,
  EyeOff,
  FileDown,
  Filter,
  IdCard,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UsersWorkspaceSkeleton from './UsersWorkspaceSkeleton';
import Button, { cn } from '../../../components/ui/Button';
import DataTablePagination from '../../../components/ui/DataTablePagination';
import EmptyState from '../../../components/ui/EmptyState';
import userService from '../services/userService';
import referenceService from '../services/referenceService';

const statusTone = {
  1: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  0: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const roleTone = {
  Admin: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  Manager: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  PIC: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  Viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Super Admin': 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const createInitialForm = () => ({
  name: '',
  email: '',
  password: '',
  role: '',
  unit_id: '',
  is_active: 1,
});

const UsersManagementWorkspace = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(createInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadReferences = async () => {
    try {
      const [fetchedRoles, fetchedUnits] = await Promise.all([
        referenceService.getRoles(),
        referenceService.getUnits()
      ]);
      setRoles(fetchedRoles || []);
      setUnits(fetchedUnits || []);
    } catch (error) {
      console.error('Failed to load references:', error);
      toast.error('Gagal memuat data dropdown (Role/Unit).');
    }
  };

  const loadUsers = useCallback(async (withSkeleton = false) => {
    if (withSkeleton) setIsLoading(true);
    
    try {
      const params = {
        page: currentPage,
        pageSize,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };

      const response = await userService.getUsers(params);
      setUsers(response.data?.items || []);
      setTotalItems(response.data?.total || 0);
      setTotalPages(response.data?.last_page || 1);
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, roleFilter, statusFilter, sortConfig]);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers(true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [loadUsers]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };



  const handleDelete = async (user) => {
    const result = await confirmDialog({
      title: 'Hapus pengguna ini?',
      text: `${user.name} akan dihapus dari sistem secara permanen.`,
      confirmButtonText: 'Ya, hapus'
    });

    if (result.isConfirmed) {
      try {
        await userService.deleteUser(user.id);
        toast.success('Pengguna berhasil dihapus');
        loadUsers();
      } catch (error) {
        // Error already handled by axios interceptor
      }
    }
  };

  const handleFormChange = (field, value) => {
    setUserForm((current) => ({
      ...current,
      [field]: value,
    }));
    
    if (formErrors[field]) {
      setFormErrors((current) => {
        const newErrors = { ...current };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleFormChange('password', password);
    toast.success('Password otomatis berhasil dibuat.');
  };

  const openCreateModal = () => {
    setUserForm(createInitialForm());
    setEditingUserId(null);
    setShowPassword(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (user) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.roles?.[0] || '',
      unit_id: user.unit_id || '',
      is_active: user.is_active ? 1 : 0,
    });
    setEditingUserId(user.id);
    setShowPassword(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleSubmitUser = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        unit_id: userForm.unit_id || null,
        is_active: parseInt(userForm.is_active),
      };

      if (userForm.password) {
        payload.password = userForm.password;
      }

      if (editingUserId) {
        await userService.updateUser(editingUserId, payload);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await userService.createUser(payload);
        toast.success('Pengguna berhasil ditambahkan');
      }

      setIsFormModalOpen(false);
      loadUsers();
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (user) => {
    let nip = user.nip || user.nik;
    
    // Fallback: Jika data belum ter-refresh dan NIP kosong, coba ambil dari email (18 digit)
    if ((!nip || nip === '-') && user.email) {
      const match = user.email.match(/\d{18}/);
      if (match) {
        nip = match[0];
      }
    }

    if (!nip || nip === '-') {
      toast.error('Gagal reset password: NIP tidak ditemukan pada data pengguna ini.');
      return;
    }

    const result = await confirmDialog({
      title: 'Reset Password?',
      text: `Password untuk ${user.name} akan direset menjadi NIP (${nip}).`,
      confirmButtonText: 'Ya, Reset Password'
    });

    if (result.isConfirmed) {
      try {
        const payload = {
          name: user.name,
          email: user.email,
          role: user.roles?.[0] || '',
          unit_id: user.unit_id || null,
          is_active: user.is_active ? 1 : 0,
          password: nip
        };
        await userService.updateUser(user.id, payload);
        toast.success('Password berhasil direset menjadi NIP.');
      } catch (error) {
        toast.error('Gagal mereset password pengguna.');
      }
    }
  };

  const handleResetMfa = async (user) => {
    // Check if MFA is active (using two_factor_confirmed_at or similar indicator if available, though here we can also just check if the user object has it null)
    // Actually, in UserResource, we return 'two_factor_confirmed_at'. Let's use that to check.
    if (!user.two_factor_confirmed_at) {
      toast.warning('MFA belum diaktifkan pada pengguna ini.');
      return;
    }

    const result = await confirmDialog({
      title: 'Reset MFA?',
      text: `Autentikasi Dua Langkah (MFA) untuk ${user.name} akan dihapus.`,
      confirmButtonText: 'Ya, Reset MFA'
    });

    if (result.isConfirmed) {
      try {
        await userService.resetMfa(user.id);
        toast.success('MFA pengguna berhasil direset.');
        loadUsers();
      } catch (error) {
        toast.error('Gagal mereset MFA pengguna.');
      }
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setRoleFilter('Semua');
    setStatusFilter('Semua');
    setCurrentPage(1);
    setUsers([]);
    setSelectedUserIds([]);
    loadUsers(true);
  };

  const handleManualRefresh = () => {
    setUsers([]);
    setSelectedUserIds([]);
    loadUsers(true);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    
    const result = await confirmDialog({
      title: `Hapus ${selectedUserIds.length} pengguna?`,
      text: 'Pengguna yang dipilih akan dihapus dari sistem secara permanen.',
      confirmButtonText: 'Ya, hapus semua'
    });

    if (result.isConfirmed) {
      try {
        await userService.deleteBulkUsers(selectedUserIds);
        toast.success(`${selectedUserIds.length} pengguna berhasil dihapus`);
        setSelectedUserIds([]);
        loadUsers();
      } catch (error) {
        // Handled globally
      }
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };
      
      const response = await userService.exportUsers(params);
      const data = response.data || [];
      
      if (data.length === 0) {
        toast.info('Tidak ada data untuk di-export.');
        return;
      }

      const headers = ['User ID', 'Nama Lengkap', 'Email', 'Unit Kerja', 'Role', 'Status', 'Dibuat Pada'];
      const csvRows = [headers.join(',')];

      data.forEach(user => {
        const roles = user.roles ? user.roles.join(';') : '';
        const status = user.is_active ? 'Aktif' : 'Nonaktif';
        const row = [
          user.id,
          `"${user.name}"`,
          `"${user.email}"`,
          `"${user.unit || ''}"`,
          `"${roles}"`,
          status,
          user.created_at
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Export_Users_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data berhasil diexport ke CSV.');
    } catch (error) {
      toast.error('Gagal mengekspor data.');
    }
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

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
            Pusat pengelolaan akun admin, manager, PIC, dan viewer.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700"
            onClick={handleExport}
          >
            <FileDown size={16} />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={handleManualRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </section>

      {/* Action Banner */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-[1.25em] border-2 border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <UserRound size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tambah Pengguna Baru</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Daftarkan akun pengguna, admin, manager, atau PIC baru ke dalam sistem.
            </p>
          </div>
        </div>
        <Button 
          onClick={openCreateModal}
          className="cursor-pointer shrink-0 gap-2 rounded-[1em] px-6 py-2.5 shadow-sm"
        >
          <Plus size={16} />
          Tambah Pengguna
        </Button>
      </section>

      <section className="rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Daftar Akun</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {totalItems} akun ditemukan secara keseluruhan.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => setIsFilterVisible((current) => !current)}
                className="admin-toolbar-control inline-flex cursor-pointer items-center gap-2 rounded-[1em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-extrabold tracking-[0.01em] text-blue-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-blue-300 dark:hover:border-blue-900"
              >
                <Filter size={16} />
                Filter Data
                <ChevronDown size={16} className={cn('transition duration-200', isFilterVisible ? 'rotate-180' : '')} />
              </button>

              <div className="admin-toolbar-control flex items-center gap-2 rounded-[1.25em] border border-slate-200 bg-slate-50 px-3 py-2 text-[0.75rem] font-extrabold tracking-[0.01em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <ChevronsLeftRight size={16} className="text-slate-400 dark:text-slate-500" />
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer bg-transparent text-slate-700 outline-none dark:text-slate-200"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_12rem_12rem_auto]">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pencarian
                </span>
                <div className="admin-filter-input-shell admin-filter-field rounded-[1em] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Search size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari nama, email, unit..."
                    className="admin-filter-field w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Role
                </span>
                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="Semua">Semua</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="admin-filter-field w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="Semua">Semua</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </label>

              <div className="flex min-w-0 items-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="admin-filter-field inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[1em] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                >
                  <RotateCcw size={15} />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedUserIds.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-red-50/50 px-5 py-3 dark:border-slate-800 dark:bg-red-950/20">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedUserIds.length} pengguna dipilih
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkDelete}
              className="cursor-pointer gap-2 border-transparent bg-red-600 shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <Trash2 size={16} />
              Hapus Terpilih
            </Button>
          </div>
        )}

        {isLoading ? (
          <UsersWorkspaceSkeleton />
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/40">
              <tr className="text-left">
                <th className="w-12 px-5 py-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="!appearance-none h-[1.125rem] w-[1.125rem] cursor-pointer rounded-[0.25rem] !border-2 !border-slate-300 !bg-white transition-all checked:!bg-blue-600 checked:!border-blue-600 dark:!border-slate-600 dark:!bg-slate-800 dark:checked:!bg-blue-500 dark:checked:!border-blue-500 checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%2016%2016%22%20fill=%22white%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] bg-no-repeat bg-center bg-[length:90%_90%]"
                      onChange={handleSelectAll}
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                    />
                  </div>
                </th>
                <SortableHead label="Pengguna" sortKey="name" />
                <SortableHead label="Unit Kerja" sortKey="unit" />
                <SortableHead label="Role" sortKey="role" />
                <SortableHead label="Status" sortKey="is_active" />
                <th className="px-5 py-3 text-right text-[8px] font-extrabold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-0 py-8">
                    <EmptyState 
                      title="Tidak ada pengguna yang cocok" 
                      description="Ubah kata kunci pencarian atau reset filter untuk melihat data lain." 
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                    <td className="px-5 py-4">
                      <div className="flex h-full items-start pt-[0.1rem]">
                        <input
                          type="checkbox"
                          className="!appearance-none h-[1.125rem] w-[1.125rem] cursor-pointer rounded-[0.25rem] !border-2 !border-slate-300 !bg-white transition-all checked:!bg-blue-600 checked:!border-blue-600 dark:!border-slate-600 dark:!bg-slate-800 dark:checked:!bg-blue-500 dark:checked:!border-blue-500 checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%2016%2016%22%20fill=%22white%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] bg-no-repeat bg-center bg-[length:90%_90%]"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleSelectRow(user.id)}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-[15rem]">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{user.unit || '-'}</td>
                    <td className="px-5 py-4">
                      {user.roles && user.roles.map((r, i) => (
                        <span key={i} className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold mr-1', roleTone[r] || 'bg-slate-100 text-slate-700')}>
                          {r}
                        </span>
                      ))}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[user.is_active ? 1 : 0])}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:text-blue-300"
                          aria-label={`Detail ${user.name}`}
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-900 dark:hover:text-amber-300"
                          aria-label={`Edit ${user.name}`}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[0.9em] border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-300"
                          aria-label={`Hapus ${user.name}`}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Server-side Pagination Footer */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          startItem={startItem}
          endItem={endItem}
          totalItems={totalItems}
        />
        </>
        )}
      </section>

      {/* Detail Modal */}
      {selectedUser ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card w-full max-w-2xl overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Detail Pengguna</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Nama Lengkap</span>
                  <span className="mt-1 text-sm font-bold text-slate-900 dark:text-white sm:mt-0">{selectedUser.name}</span>
                </div>
                
                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Email Address</span>
                  <div className="mt-1 flex items-center gap-2 sm:mt-0">
                    <Mail size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Unit Kerja</span>
                  <div className="mt-1 flex items-center gap-2 sm:mt-0">
                    <Building2 size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.unit || '-'}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Role Akses</span>
                  <div className="mt-1 flex flex-wrap gap-2 sm:mt-0">
                    {selectedUser.roles && selectedUser.roles.map((r, i) => (
                      <span key={i} className={cn('mr-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold', roleTone[r] || 'bg-slate-100 text-slate-700')}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status Akun</span>
                  <div className="mt-1 sm:mt-0">
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusTone[selectedUser.is_active ? 1 : 0])}>
                      {selectedUser.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between px-6 py-4 sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Dibuat Pada</span>
                  <span className="mt-1 text-sm font-bold text-slate-900 dark:text-white sm:mt-0">
                    {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/70">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResetMfa(selectedUser)}
                className="cursor-pointer gap-2 border border-slate-200 dark:border-slate-700"
              >
                Reset MFA
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResetPassword(selectedUser)}
                className="cursor-pointer gap-2 shadow-sm"
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Create / Edit Modal */}
      {isFormModalOpen ? (
        <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
          <div className="animate-modal-card flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {editingUserId ? 'Edit Akun' : 'Tambah Akun'}
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {editingUserId ? 'Ubah Data Pengguna' : 'Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setUserForm(createInitialForm());
                }}
                className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
              <div className="min-h-0 flex-1 overflow-y-auto p-6 scrollbar-hide">
                <fieldset disabled={isSubmitting} className="m-0 border-none p-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Nama Lengkap
                    </span>
                    <input
                      type="text"
                      name="name_prevent_autofill"
                      autoComplete="off"
                      value={userForm.name}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      placeholder="Masukkan nama pengguna"
                      required
                      className={cn(
                        "w-full cursor-pointer rounded-[1em] border bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
                        formErrors.name ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name[0]}</p>}
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Alamat Email
                    </span>
                    <input
                      type="email"
                      name="email_prevent_autofill"
                      autoComplete="new-password"
                      value={userForm.email}
                      onChange={(event) => handleFormChange('email', event.target.value)}
                      placeholder="nama@domain.com"
                      required
                      className={cn(
                        "w-full cursor-pointer rounded-[1em] border bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
                        formErrors.email ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email[0]}</p>}
                  </label>

                  <div className="block md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Kata Sandi {editingUserId ? '(Opsional)' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="cursor-pointer text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Generate Password
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password_prevent_autofill"
                        autoComplete="new-password"
                        value={userForm.password}
                        onChange={(event) => handleFormChange('password', event.target.value)}
                        placeholder={editingUserId ? "Kosongkan jika tidak ingin mengubah password" : "Minimal 6 karakter"}
                        required={!editingUserId}
                        minLength={6}
                        className={cn(
                          "w-full cursor-pointer rounded-[1em] border bg-white px-4 py-3 pr-12 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
                          formErrors.password ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password[0]}</p>}
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Role Akses
                    </span>
                    <select
                      value={userForm.role}
                      onChange={(event) => handleFormChange('role', event.target.value)}
                      required
                      className={cn(
                        "w-full cursor-pointer rounded-[1em] border bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
                        formErrors.role ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    >
                      <option value="" disabled>Pilih Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    {formErrors.role && <p className="mt-1 text-xs text-red-500">{formErrors.role[0]}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Unit Kerja
                    </span>
                    <select
                      value={userForm.unit_id}
                      onChange={(event) => handleFormChange('unit_id', event.target.value)}
                      required
                      className={cn(
                        "w-full cursor-pointer rounded-[1em] border bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
                        formErrors.unit_id ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    >
                      <option value="" disabled>Pilih Unit Kerja</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {formErrors.unit_id && <p className="mt-1 text-xs text-red-500">{formErrors.unit_id[0]}</p>}
                  </label>
                  
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Status Akun
                    </span>
                    <select
                      value={userForm.is_active}
                      onChange={(event) => handleFormChange('is_active', event.target.value)}
                      className="w-full cursor-pointer rounded-[1em] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value={1}>Aktif</option>
                      <option value={0}>Nonaktif</option>
                    </select>
                  </label>
                </div>
                </fieldset>
              </div>
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      setUserForm(createInitialForm());
                    }}
                    disabled={isSubmitting}
                    className="cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="cursor-pointer gap-2">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {editingUserId ? 'Simpan Perubahan' : 'Simpan Pengguna'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersManagementWorkspace;
