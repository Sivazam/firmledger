import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { Box, CircularProgress } from '@mui/material';

export default function ApprovedGuard() {
    const { profile, loading: authLoading, initialized: authInit } = useAuthStore();
    const { currentOrganization, loading: orgLoading, initialized: orgInit } = useOrganizationStore();
    const location = useLocation();

    if (!authInit || authLoading || (profile && !orgInit)) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;

    if (profile.userType === 'super-admin') return <Outlet />;

    if (!profile.organizationId) {
        return <Navigate to="/setup-organization" replace />;
    }

    if (currentOrganization?.status !== 'approved') {
        return <Navigate to="/pending-approval" replace />;
    }

    return <Outlet />;
}
