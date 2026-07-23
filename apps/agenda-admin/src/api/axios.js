import axios from 'axios';
import { toast } from 'react-toastify';
import React from 'react';
import { Lock, ShieldAlert, FileQuestion, AlertCircle, ServerCrash, XCircle, WifiOff } from 'lucide-react';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // withCredentials: true // Only needed if using Sanctum SPA cookie auth. We use Bearer tokens.
});

// Request Interceptor: Attach token automatically
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Terjadi kesalahan sistem';

            if (status === 401) {
                // Auto logout on 401
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                toast.error('Sesi Anda telah berakhir. Silakan login kembali.', { icon: React.createElement(Lock, { size: 20 }) });
                setTimeout(() => {
                    window.location.href = import.meta.env.BASE_URL + 'login';
                }, 2000);
            } else if (status === 403) {
                toast.error('Anda tidak memiliki akses ke resource ini.', { icon: React.createElement(ShieldAlert, { size: 20 }) });
            } else if (status === 404) {
                toast.error(`Data tidak ditemukan. URL: ${error.config.url}`, { icon: React.createElement(FileQuestion, { size: 20 }) });
            } else if (status === 422) {
                toast.error(message, { icon: React.createElement(AlertCircle, { size: 20 }) });
            } else if (status >= 500) {
                toast.error('Terjadi kesalahan pada server.', { icon: React.createElement(ServerCrash, { size: 20 }) });
            } else {
                toast.error(message, { icon: React.createElement(XCircle, { size: 20 }) });
            }
        } else {
            toast.error('Tidak dapat terhubung ke server.', { icon: React.createElement(WifiOff, { size: 20 }) });
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
