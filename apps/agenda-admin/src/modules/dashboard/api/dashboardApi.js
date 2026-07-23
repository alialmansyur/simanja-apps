import axios from '../../../api/axios';

export const fetchDashboardKPI = async () => {
  const response = await axios.get('dashboard/kpi');
  return response.data.data;
};

export const fetchDashboardAnnouncements = async () => {
  const response = await axios.get('dashboard/announcements');
  return response.data.data;
};

export const fetchDashboardEvents = async () => {
  const response = await axios.get('dashboard/events');
  return response.data.data;
};
