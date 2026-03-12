import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { OrganizationService } from '../services/organization.service';
import { Box, CircularProgress } from '@mui/material';

export default function ApprovedGuard() {
    const { profile, loading, initialized } = useAuthStore();
    const [isApproved, setIsApproved] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkApproval() {
            if (profile?.organizationId) {
                const org = await OrganizationService.getOrganization(profile.organizationId);
                setIsApproved(org?.status === 'approved');
            } else {
                setIsApproved(false);
            }
        }
        if (initialized && !loading && profile) {
            checkApproval();
        }
    }, [initialized, loading, profile]);

    if (!initialized || loading || isApproved === null) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile?.organizationId) {
        return <Navigate to="/setup-organization" replace />;
    }

    if (!isApproved) {
        return <Navigate to="/pending-approval" replace />;
    }

    return <Outlet />;
}
