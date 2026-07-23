import React, { useState, useEffect, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import RunningText from '../components/RunningText';
import TimelineSidebar from '../components/TimelineSidebar';
import MainCalendar from '../modules/Calendar/MainCalendar';
import SplashLoader from '../components/SplashLoader';
import { DashboardSkeletonMain, DashboardSkeletonSidebar } from '../components/DashboardSkeleton';
import { fetchPublicSettings, fetchPublicKPI, fetchPublicAnnouncements, fetchPublicEvents, API_BASE_URL } from '../services/api';

const DashboardLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [settings, setSettings] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, kpiRes, annRes, eventsRes] = await Promise.all([
        fetchPublicSettings(),
        fetchPublicKPI(),
        fetchPublicAnnouncements(),
        fetchPublicEvents()
      ]);
      
      if (settingsRes?.data) {
        setSettings(settingsRes.data);
        if (settingsRes.data['app.title'] || settingsRes.data['app.name']) {
          document.title = settingsRes.data['app.title'] || settingsRes.data['app.name'];
        }
        if (settingsRes.data['app.favicon']) {
          let favicon = document.querySelector("link[rel~='icon']");
          if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(favicon);
          }
          favicon.href = settingsRes.data['app.favicon'].startsWith('http') 
            ? settingsRes.data['app.favicon'] 
            : `${API_BASE_URL.replace('/api', '')}/storage/${settingsRes.data['app.favicon']}`;
        }
      }
      
      if (kpiRes?.data) setKpiData(kpiRes.data);
      if (annRes?.data) setAnnouncements(annRes.data);
      if (eventsRes?.data) {
        // Convert date strings to Date objects for react-big-calendar
        const parsedEvents = eventsRes.data.map(ev => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end)
        }));
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
      if (isInitialLoad) {
        setTimeout(() => setIsInitialLoad(false), 500); // Add a small delay for the splash animation to finish nicely
      }
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = setInterval(() => {
      loadData();
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    setIsManualRefresh(true);
    loadData().then(() => setIsManualRefresh(false));
  };

  const runningTextMessages = useMemo(() => {
    const messages = [];
    
    if (settings && settings['dashboard.running_text']) {
        messages.push(settings['dashboard.running_text']);
    }

    if (events && events.length > 0) {
        const todaysAgendas = events.filter(event => isToday(new Date(event.start)));
        if (todaysAgendas.length > 0) {
            messages.push(`Agenda Hari Ini: ${todaysAgendas.map(a => `${a.title} (${format(new Date(a.start), 'HH:mm', {locale: id})})`).join(', ')}`);
        } else {
            messages.push('Tidak ada agenda yang terjadwal untuk hari ini.');
        }
    }

    if (announcements && announcements.length > 0) {
        if (typeof announcements[0] === 'string') {
            messages.push(...announcements);
        } else if (announcements[0].title) {
            messages.push(...announcements.map(a => a.title));
        }
    }

    return messages.length > 0 ? messages : ['Selamat datang di Aplikasi Agenda.'];
  }, [settings, events, announcements]);

  return (
    <>
      <AnimatePresence>
        {isInitialLoad && <SplashLoader />}
      </AnimatePresence>
      
      <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Header onRefresh={handleRefresh} isRefreshing={isLoading} settings={settings} lastUpdated={lastUpdated} />
      <RunningText messages={runningTextMessages} />
      
      <div className="flex flex-col xl:flex-row flex-1 overflow-hidden relative">
        {(isLoading && events.length === 0) || isManualRefresh ? (
          <>
            <DashboardSkeletonSidebar />
            <DashboardSkeletonMain />
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col xl:flex-row flex-1 overflow-hidden w-full"
          >
            <TimelineSidebar events={events} onEventClick={setSelectedEvent} />
            <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 scrollbar-hide w-full xl:w-auto">
              <div className="max-w-7xl mx-auto">
                <MainCalendar events={events} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} kpiData={kpiData} />
                
                {/* Footer space */}
                <div className="h-12 mt-8 flex items-center justify-center text-sm text-slate-400">
                  &copy; {new Date().getFullYear()} {settings?.['app.name'] || 'AgendaKu System'}. All rights reserved.
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
};

export default DashboardLayout;
