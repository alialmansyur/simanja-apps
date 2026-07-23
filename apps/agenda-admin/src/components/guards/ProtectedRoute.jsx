import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 border-[3px] border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-blue-600 border-t-transparent z-10"></div>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
                    Memuat Data ...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to the login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
