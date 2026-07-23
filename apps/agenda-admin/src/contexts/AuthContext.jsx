import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.get('/me');
            setUser(response.data.data);
            setIsAuthenticated(true);
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axiosInstance.post('/login', credentials);
            const data = response.data.data;
            
            if (data.requires_mfa) {
                // Store temporary token for MFA verification
                localStorage.setItem('mfa_temp_token', data.token);
                return { 
                    requires_mfa: true, 
                    mfa_setup_required: data.mfa_setup_required 
                };
            }

            const { token, user } = data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            sessionStorage.removeItem('mfa_banner_dismissed');
            
            setUser(user);
            setIsAuthenticated(true);
            
            return { success: true };
        } catch (error) {
            // Error is already handled by axios response interceptor
            return { success: false };
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/logout');
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('mfa_banner_dismissed');
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
        }
    };

    const verifyMfa = async (code) => {
        try {
            const mfaToken = localStorage.getItem('mfa_temp_token');
            const response = await axiosInstance.post('/mfa/verify', { code }, {
                headers: { Authorization: `Bearer ${mfaToken}` }
            });
            
            const { token, user } = response.data;
            
            localStorage.removeItem('mfa_temp_token');
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            setUser(user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Verification failed' };
        }
    };

    const hasRole = (role) => {
        return user?.roles?.includes(role) ?? false;
    };

    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission) ?? false;
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
        verifyMfa,
        hasRole,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
