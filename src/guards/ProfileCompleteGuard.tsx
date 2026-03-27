import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function ProfileCompleteGuard() {
    const { user, profile, loading, initialized } = useAuthStore();

    // Show loading if we haven't initialized, or if we are actively loading,
    // or if we have a user but are still waiting for their profile record.
    if (!initialized || loading || (user && !profile)) {
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
