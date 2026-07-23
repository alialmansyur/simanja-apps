import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './modules/auth/pages/LoginPage';
import MfaVerifyPage from './pages/auth/MfaVerify';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import AgendaPage from './modules/agenda/pages/AgendaPage';
import AgendaManagePage from './modules/agenda/pages/AgendaManagePage';
import CalendarPage from './modules/calendar/pages/CalendarPage';
import RoomsPage from './modules/ruangan/pages/RoomsPage';
import RoomDetailPage from './modules/ruangan/pages/RoomDetailPage';
import MinutesPage from './modules/notula/pages/MinutesPage';
import NotulaDetailPage from './modules/notula/pages/NotulaDetailPage';
import HistoryPage from './modules/riwayat/pages/HistoryPage';
import UsersPage from './modules/Users/pages/UsersPage';
import RolesPermissionsPage from './modules/Roles/pages/RolesPermissionsPage';
import MasterDataPage from './modules/master-data/pages/MasterDataPage';
import MasterDataManagePage from './modules/master-data/pages/MasterDataManagePage';
import TemplateDetailWorkspace from './modules/master-data/pages/TemplateDetailWorkspace';
import SettingsPage from './modules/settings/pages/SettingsPage';
import AuditLogPage from './modules/audit/pages/AuditLogPage';
import ProfilePage from './modules/profile/pages/ProfilePage';
import ProtectedRoute from './components/guards/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const AppRouter = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mfa-verify" element={<MfaVerifyPage />} />
        
        {/* Protected Routes (Admin) */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="agenda">
            <Route index element={<AgendaPage />} />
            <Route path="manage" element={<Navigate to="/admin/agenda" replace />} />
            <Route path="manage/:uuid" element={
              <ErrorBoundary>
                <AgendaManagePage />
              </ErrorBoundary>
            } />
          </Route>
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="ruangan">
            <Route index element={<RoomsPage />} />
            <Route path=":uuid" element={<RoomDetailPage />} />
          </Route>
          <Route path="notula">
            <Route index element={<MinutesPage />} />
            <Route path="detail/:uid" element={<NotulaDetailPage />} />
          </Route>
          <Route path="riwayat" element={<HistoryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles-permissions" element={<RolesPermissionsPage />} />
          <Route path="master-data">
            <Route index element={<MasterDataPage />} />
            <Route path="template-surat/detail/template/:uuid" element={
              <ErrorBoundary>
                <TemplateDetailWorkspace />
              </ErrorBoundary>
            } />
            <Route path=":uuid" element={<MasterDataManagePage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
