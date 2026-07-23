import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, LoaderCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import Button, { cn } from '../../../components/ui/Button';
import { fetchRolePermissions, toggleRolePermission } from '../api/roles.api';
import { toast } from 'react-toastify';

const moduleLabels = {
  dashboard: 'Dashboard',
  agenda: 'Operasional Agenda',
  calendar: 'Kalender',
  approval: 'Approval',
  reports: 'Laporan',
  users: 'Pengguna',
  roles: 'Role & Permission',
  'master-data': 'Master Data',
  settings: 'Pengaturan',
  'audit-log': 'Audit Log',
  publication: 'Publikasi'
};

const moduleDescriptions = {
  dashboard: 'Melihat ringkasan statistik dan aktivitas',
  agenda: 'Mengelola jadwal dan agenda operasional',
  calendar: 'Tampilan kalender jadwal agenda',
  approval: 'Persetujuan dan validasi agenda',
  reports: 'Melihat dan mengunduh laporan',
  users: 'Manajemen akun pengguna sistem',
  roles: 'Mengatur peran dan hak akses sistem',
  'master-data': 'Mengelola data master referensi',
  settings: 'Konfigurasi umum aplikasi',
  'audit-log': 'Riwayat aktivitas sistem',
  publication: 'Mempublikasikan agenda ke publik'
};

const translateAction = (name) => {
  const action = name.split('_')[0];
  switch (action) {
    case 'view': return 'Lihat Data';
    case 'create': return 'Buat Baru';
    case 'update': return 'Ubah Data';
    case 'delete': return 'Hapus Data';
    case 'approve': return 'Persetujuan (Approve)';
    case 'publish': return 'Publikasi';
    case 'export': return 'Ekspor Data';
    case 'manage': return 'Kelola Penuh';
    default: return name;
  }
};

const sectionCardClassName =
  'rounded-[1.25em] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800/80';

const PermissionCheckbox = ({ checked, saving, onChange }) => (
  <div className="flex items-center justify-center">
    {saving ? (
      <span className="flex h-5 w-5 items-center justify-center">
        <LoaderCircle size={20} strokeWidth={3.5} className="animate-spin text-blue-600 dark:text-blue-400" />
      </span>
    ) : (
      <div
        role="button"
        tabIndex={0}
        onClick={onChange}
        className={cn(
          'flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-[3px] border-[1.5px] transition-all duration-200',
          checked
            ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
            : 'border-slate-300 bg-white hover:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-500'
        )}
      >
        {checked ? <Check size={13} strokeWidth={3} /> : null}
      </div>
    )}
  </div>
);

const PermissionsSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <section>
      <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 sm:w-48" />
      <div className="mt-3 h-4 w-full max-w-2xl rounded bg-slate-200 dark:bg-slate-800" />
    </section>
    <div className={`${sectionCardClassName} overflow-hidden`}>
      <div className="h-64 w-full bg-slate-50 dark:bg-slate-950/40" />
    </div>
  </div>
);

const RolesPermissionsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [rolePermissions, setRolePermissions] = useState({});
  const [savingCells, setSavingCells] = useState(new Set());
  
  // Refined grid template: left column slightly constrained, checkboxes evenly distributed
  const tableGridStyle = {
    display: 'grid',
    gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${roles.length || 3}, minmax(100px, 1fr))`,
    alignItems: 'center',
    gap: '1rem'
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchRolePermissions();
      
      setRoles(data.roles);
      setRolePermissions(data.role_permissions);

      // Transform grouped permissions to menuTree
      const tree = Object.entries(data.permissions_grouped).map(([moduleName, perms]) => ({
        id: moduleName,
        label: moduleLabels[moduleName] || moduleName.toUpperCase(),
        description: moduleDescriptions[moduleName] || 'Hak akses untuk modul ini',
        children: perms.map(p => ({
          id: p.id,
          label: translateAction(p.name),
        }))
      }));
      setMenuTree(tree);
      setExpandedGroups(new Set(tree.map(g => g.id)));
      
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleTogglePermission = async (menuId, role) => {
    const isCurrentlyChecked = rolePermissions[role.id]?.includes(menuId) || false;
    const isSuperAdmin = role.slug === 'super-admin';
    
    if (isSuperAdmin && isCurrentlyChecked) {
      toast.error('Tidak dapat mencabut hak akses dari Super Admin');
      return;
    }

    const cellKey = `${menuId}-${role.id}`;
    setSavingCells((prev) => new Set(prev).add(cellKey));

    try {
      await toggleRolePermission(role.id, menuId, !isCurrentlyChecked);
      
      setRolePermissions(prev => {
        const rolePerms = prev[role.id] || [];
        if (isCurrentlyChecked) {
          return { ...prev, [role.id]: rolePerms.filter(id => id !== menuId) };
        } else {
          return { ...prev, [role.id]: [...rolePerms, menuId] };
        }
      });
      
      toast.success(isCurrentlyChecked ? 'Akses berhasil dicabut!' : 'Akses berhasil diberikan!');
    } catch (error) {
      console.error('Failed to toggle permission:', error);
    } finally {
      setSavingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5 px-1 pt-2 sm:px-2 sm:pt-3 md:px-3 md:pt-4">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 sm:text-xl">
            Role & Permission
          </h1>
          <p className="mt-1.5 max-w-2xl text-base font-medium leading-6 text-slate-500 dark:text-slate-400">
            Kelola hak akses setiap role terhadap menu dan fitur yang tersedia dalam sistem. Tersinkronisasi secara real-time dengan database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="cursor-pointer gap-2 rounded-[1em] shadow-sm transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </section>

      {isLoading ? (
        <PermissionsSkeleton />
      ) : (
        <>

          <section className={`${sectionCardClassName} overflow-hidden`}>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
                Permission Matrix
              </h2>
              <p className="mt-1 text-base font-medium leading-6 text-slate-500 dark:text-slate-400">
                Centang untuk memberikan akses. Perubahan tersimpan otomatis ke database.
              </p>
            </div>

            <div
              className="hidden lg:grid border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800/80 dark:bg-slate-950/60 sm:px-6"
              style={tableGridStyle}
            >
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 pl-10">
                Modul & Hak Akses
              </span>
              {roles.map((role) => (
                <div key={role.id} className="flex justify-center">
                  <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-900/50">
                    {role.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="pb-8">
              {menuTree.map((group, groupIndex) => {
                const isExpanded = expandedGroups.has(group.id);
                const isSingleChild = group.children.length === 1;

                if (isSingleChild) {
                  const singleMenu = group.children[0];
                  return (
                    <div
                      key={group.id}
                      className="border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800/60 dark:bg-slate-900 sm:px-6 lg:grid items-center gap-3 transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/30"
                      style={window.innerWidth >= 1024 ? tableGridStyle : {}}
                    >
                      <div className="flex items-center gap-2.5 lg:pl-10">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                            {group.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                            {group.description}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-5 lg:contents lg:mt-0 lg:pl-0">
                        {roles.map((role) => {
                          const cellKey = `${singleMenu.id}-${role.id}`;
                          const isChecked = rolePermissions[role.id]?.includes(singleMenu.id) || false;
                          return (
                            <div key={role.id} className="flex items-center gap-2 lg:justify-center">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 lg:hidden">
                                {role.name}
                              </span>
                              <PermissionCheckbox
                                checked={isChecked}
                                saving={savingCells.has(cellKey)}
                                onChange={() => handleTogglePermission(singleMenu.id, role)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <React.Fragment key={group.id}>
                    <div className="border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800/60 dark:bg-slate-900 sm:px-6">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="inline-flex cursor-pointer items-center gap-2.5 transition"
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full border transition',
                            isExpanded
                              ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-blue-900'
                          )}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {group.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {group.description}
                          </span>
                        </div>
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {group.children.length}
                        </span>
                      </button>
                    </div>

                    {isExpanded &&
                      group.children.map((menu, idx) => (
                        <div
                          key={menu.id}
                          className={cn(
                            "px-5 py-3.5 sm:px-6 lg:grid items-center gap-3 transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/30",
                            idx % 2 === 0 ? "bg-slate-50/30 dark:bg-slate-950/20" : "bg-white dark:bg-slate-900"
                          )}
                          style={window.innerWidth >= 1024 ? tableGridStyle : {}}
                        >
                          <div className="pl-10 lg:pl-10">
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                              <p className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-300">
                                {menu.label}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-5 pl-10 lg:contents lg:mt-0 lg:pl-0">
                            {roles.map((role) => {
                              const cellKey = `${menu.id}-${role.id}`;
                              const isChecked = rolePermissions[role.id]?.includes(menu.id) || false;
                              return (
                                <div key={role.id} className="flex items-center gap-2 lg:justify-center">
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 lg:hidden">
                                    {role.name}
                                  </span>
                                  <PermissionCheckbox
                                    checked={isChecked}
                                    saving={savingCells.has(cellKey)}
                                    onChange={() => handleTogglePermission(menu.id, role)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RolesPermissionsPage;
