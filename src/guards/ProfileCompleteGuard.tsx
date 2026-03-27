import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function ProfileCompleteGuard() {
    const { profile, loading, initialized } = useAuthStore();

    if (!initialized || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile || (!profile.profileComplete && profile.userType !== 'super-admin' && profile.userType !== 'admin')) {
        return <Navigate to="/setup-profile" replace />;
    }

    return <Outlet />;
}
