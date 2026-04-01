import React from 'react';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { AuthService } from '../../services/auth.service';
import { useNavigate, Navigate } from 'react-router-dom';

export default function PendingApprovalPage() {
    const { profile, loading, setProfile } = useAuthStore();
    const { currentOrganization, fetchOrganization } = useOrganizationStore();
    const navigate = useNavigate();

    const isUserPending = profile?.status === 'pending';
    const isUserDenied = profile?.status === 'denied';
    const isOrgPending = currentOrganization?.status === 'pending';
    const isOrgDenied = currentOrganization?.status === 'denied';

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const handleLogout = async () => {
        await AuthService.logout();
        navigate('/login');
    };

    const handleRefresh = async () => {
        if (profile?.uid) {
            const newProfile = await AuthService.getUserProfile(profile.uid);
            setProfile(newProfile);
        }
        if (profile?.organizationId) {
            await fetchOrganization(profile.organizationId);
        }
    };

    // If suddenly approved while on this page, redirect immediately
    if (currentOrganization?.status === 'approved' && profile?.status === 'approved') {
        return <Navigate to="/" replace />;
    }

    const title = (isOrgDenied || isUserDenied) ? 'Request Denied' : 'Pending Approval';
    let message = 'Your account or organization is currently awaiting administrator approval. Please check back later.';

    if (isOrgDenied) {
        message = 'Your organization approval request was denied by the administrator.';
    } else if (isUserDenied) {
        message = 'Your access request for this organization was denied by the administrator.';
    } else if (isUserPending && currentOrganization?.status === 'approved') {
        message = 'Your individual access request is pending administrator approval.';
    } else if (isOrgPending) {
        message = 'Your organization is currently awaiting administrator approval.';
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h4" gutterBottom>{title}</Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    {message}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="contained" onClick={handleRefresh}>Refresh Status</Button>
                    <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
                </Box>
            </Box>
        </Container>
    );
}

