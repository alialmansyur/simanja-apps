import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardKPI, fetchDashboardAnnouncements, fetchDashboardEvents } from '../api/dashboardApi';
import { toast } from 'react-toastify';

export const useDashboard = () => {
  const [kpiData, setKpiData] = useState({ totalAgendas: '0', completedAgendas: '0', upcomingReminders: '0' });
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpiRes, annRes, eventsRes] = await Promise.all([
        fetchDashboardKPI(),
        fetchDashboardAnnouncements(),
        fetchDashboardEvents()
      ]);

      setKpiData(kpiRes);
      setAnnouncementsData(annRes);

      // Parse dates for events so react-big-calendar can understand them
      const parsedEvents = eventsRes.map(event => ({
        ...event,
        start: new Date(`${event.start_date_raw}T${event.start_time_raw || '00:00:00'}`),
        end: new Date(`${event.end_date_raw || event.start_date_raw}T${event.end_time_raw || '23:59:59'}`)
      }));

      setEventsData(parsedEvents);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Gagal memuat data dashboard.');
      toast.error('Gagal memuat data dashboard. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    kpiData,
    announcementsData,
    eventsData,
    isLoading,
    error,
    refetch: loadData
  };
};
