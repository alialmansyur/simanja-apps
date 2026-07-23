import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isDashboardRoute = location.pathname === '/admin';

  const userProfile = {
    name: user?.name || 'Admin User',
    role: user?.roles?.[0] || 'Administrator',
    initials: user?.name ? user.name.substring(0, 2).toUpperCase() : 'AU',
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: 'Keluar dari Sistem?',
      text: 'Sesi Anda akan diakhiri dan akan dialihkan ke halaman login.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: isDark ? '#020817' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#0f172a',
      backdrop: 'rgba(15, 23, 42, 0.45)',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
      customClass: {
        popup: 'admin-swal-popup',
        confirmButton: 'admin-swal-confirm',
        cancelButton: 'admin-swal-cancel',
        container: 'admin-swal-container',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          toggleSidebar={toggleSidebar}
          toggleSidebarCollapsed={toggleSidebarCollapsed}
          userProfile={userProfile}
          onLogout={handleLogout}
        />
        
        <main
          className={cn(
            'relative flex-1 overflow-y-auto',
            isDashboardRoute
              ? 'px-0 pb-0 pt-0'
              : 'px-5 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6 md:px-8 md:pb-10 md:pt-7'
          )}
        >
          <div className={cn('mx-auto w-full', isDashboardRoute ? 'max-w-none' : 'max-w-7xl')}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
