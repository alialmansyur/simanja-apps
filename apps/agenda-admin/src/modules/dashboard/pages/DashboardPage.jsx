import React, { useEffect, useState, useMemo } from 'react';
import DashboardKPICards from '../components/DashboardKPICards';
import DashboardMainCalendar from '../components/DashboardMainCalendar';
import DashboardRunningText from '../components/DashboardRunningText';
import DashboardPageSkeleton from '../components/DashboardPageSkeleton';
import DashboardTimelineSidebar from '../components/DashboardTimelineSidebar';
import { useDashboard } from '../hooks/useDashboard';
import { useSettings } from '../../../contexts/SettingsContext';
import { format, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import MfaActivationBanner from '../components/MfaActivationBanner';

const DashboardPage = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { kpiData, announcementsData, eventsData, isLoading, error } = useDashboard();
  const { settings } = useSettings();

  const runningTextMessages = useMemo(() => {
    const messages = [];
    
    if (settings['dashboard.running_text']) {
        messages.push(settings['dashboard.running_text']);
    }

    // Add today's active agendas
    if (eventsData && eventsData.length > 0) {
        const todaysAgendas = eventsData.filter(event => isToday(new Date(event.start)));
        if (todaysAgendas.length > 0) {
            messages.push(`Agenda Hari Ini: ${todaysAgendas.map(a => `${a.title} (${format(new Date(a.start), 'HH:mm', {locale: id})})`).join(', ')}`);
        } else {
            messages.push('Tidak ada agenda yang terjadwal untuk hari ini.');
        }
    }

    return messages.length > 0 ? messages : ['Selamat datang di Aplikasi Agenda.'];
  }, [settings, eventsData]);

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-4 text-center">
        <p className="text-red-500 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-slate-100 dark:bg-slate-950">
      <DashboardRunningText messages={runningTextMessages} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_23rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:py-6">
          <div className="mb-6">
            <DashboardKPICards data={kpiData} />
          </div>

          <DashboardMainCalendar
            events={eventsData}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
          />
        </main>

        <DashboardTimelineSidebar events={eventsData} onEventClick={setSelectedEvent} />
      </div>

      <MfaActivationBanner />
    </div>
  );
};

export default DashboardPage;
