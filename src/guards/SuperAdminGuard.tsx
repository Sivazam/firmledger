import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

const SuperAdminGuard = () => {
    const { profile, loading } = useAuthStore();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile || profile.userType !== 'super-admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default SuperAdminGuard;
