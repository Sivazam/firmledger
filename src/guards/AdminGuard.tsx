import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function AdminGuard() {
    const { profile, loading, initialized, isAdminMode } = useAuthStore();

    if (!initialized || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (profile?.userType !== 'admin' || !isAdminMode) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
