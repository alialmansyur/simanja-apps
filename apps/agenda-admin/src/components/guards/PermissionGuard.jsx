import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PermissionGuard = ({ children, requiredRole, requiredPermission, redirect = false }) => {
    const { hasRole, hasPermission } = useAuth();

    let isAllowed = true;

    if (requiredRole && !hasRole(requiredRole)) {
        isAllowed = false;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        isAllowed = false;
    }

    if (!isAllowed) {
        if (redirect) {
            return <Navigate to="/403" replace />; // Redirect to Forbidden page
        }
        return null; // Just hide the component
    }

    return children;
};

export default PermissionGuard;
