import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

// Create the context
const SettingsContext = createContext();

// Create a custom hook to use the context
export const useSettings = () => {
    return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({});
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchPublicSettings = async () => {
        try {
            const response = await axiosInstance.get(`/settings/public?_t=${new Date().getTime()}`);
            if (response.data.status === 'success') {
                const data = response.data.data;
                setSettings(data);
                
                // Apply global DOM changes
                if (data['app.title']) {
                    document.title = data['app.title'];
                } else if (data['app.name'] || data['app.short_name']) {
                    document.title = data['app.name'] || data['app.short_name'];
                }
                
                if (data['app.favicon']) {
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = `http://localhost:8000/storage/${data['app.favicon']}`;
                }
            }
        } catch (error) {
            console.error('Failed to load public settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    useEffect(() => {
        fetchPublicSettings();
    }, []);

    const refreshSettings = () => {
        fetchPublicSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, isLoadingSettings, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
