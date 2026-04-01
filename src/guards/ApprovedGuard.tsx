import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { Box, CircularProgress } from '@mui/material';

export default function ApprovedGuard() {
    const { profile, loading: authLoading, initialized: authInit } = useAuthStore();
    const { currentOrganization, loading: orgLoading, initialized: orgInit } = useOrganizationStore();
    const location = useLocation();

    // Only wait for organization init if the user is ALREADY approved at the profile level.
    // If they are pending, organization data won't load (intentional security measure) 
    // and we should proceed to the redirect logic.
    const shouldWaitForOrg = profile && profile.status === 'approved' && !orgInit;

    if (!authInit || authLoading || shouldWaitForOrg) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;

    if (profile.userType === 'super-admin') return <Navigate to="/super-admin" replace />;
    if (profile.userType === 'admin') return <Navigate to="/admin/dashboard" replace />;

    if (!profile.organizationId) {
        return <Navigate to="/setup-organization" replace />;
    }

    if (currentOrganization?.status !== 'approved' || profile.status === 'pending') {
        return <Navigate to="/pending-approval" replace />;
    }

    return <Outlet />;
}
