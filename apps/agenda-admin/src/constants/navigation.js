import {
  LayoutDashboard,
  CalendarRange,
  Presentation,
  FileText,
  History,
  ShieldCheck,
  Users,
  KeyRound,
  Database,
  Settings,
} from 'lucide-react';

export const adminNavigationGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', permission: 'view_dashboard' },
    ],
  },
  {
    label: 'Operasional Agenda',
    items: [
      { icon: CalendarRange, label: 'Agenda', path: '/admin/agenda', permission: 'view_agenda' },
      { icon: Presentation, label: 'Ruangan', path: '/admin/ruangan', permission: 'view_rooms' },
      { icon: FileText, label: 'Notula', path: '/admin/notula', permission: 'view_notula' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { icon: History, label: 'Riwayat', path: '/admin/riwayat', permission: 'view_history' },
      { icon: Users, label: 'Pengguna', path: '/admin/users', permission: 'view_users' },
      { icon: KeyRound, label: 'Role & Permission', path: '/admin/roles-permissions', permission: 'view_roles' },
      { icon: Database, label: 'Master Data', path: '/admin/master-data', permission: 'view_master_data' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { icon: Settings, label: 'Pengaturan', path: '/admin/settings', permission: 'view_settings' },
    ],
  },
];

export const adminNavigationItems = adminNavigationGroups.flatMap((group) => group.items);

export const getAdminPageMeta = (pathname) => {
  const activeItem = adminNavigationItems.find((item) => {
    if (item.path === '/admin') {
      return pathname === '/admin';
    }

    return pathname.startsWith(item.path);
  });

  if (!activeItem) {
    return {
      label: 'Panel Admin',
      groupLabel: 'Admin',
    };
  }

  const group = adminNavigationGroups.find((navigationGroup) =>
    navigationGroup.items.some((item) => item.path === activeItem.path)
  );

  return {
    label: activeItem.label,
    groupLabel: group?.label ?? 'Admin',
    badge: activeItem.badge,
  };
};
