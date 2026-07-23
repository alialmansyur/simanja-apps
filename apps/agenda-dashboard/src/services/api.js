export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const fetchPublicSettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/public`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching public settings:', error);
        return null;
    }
};

export const fetchPublicKPI = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/public/dashboard/kpi`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching KPI:', error);
        return null;
    }
};

export const fetchPublicAnnouncements = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/public/dashboard/announcements`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return null;
    }
};

export const fetchPublicEvents = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/public/dashboard/events`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return null;
    }
};
