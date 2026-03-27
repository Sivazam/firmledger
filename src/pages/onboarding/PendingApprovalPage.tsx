import React from 'react';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { AuthService } from '../../services/auth.service';
import { useNavigate, Navigate } from 'react-router-dom';

export default function PendingApprovalPage() {
    const { profile, loading } = useAuthStore();
    const { currentOrganization, fetchOrganization } = useOrganizationStore();
    const navigate = useNavigate();

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

    const handleRefresh = () => {
        if (profile?.organizationId) {
            fetchOrganization(profile.organizationId);
        }
    };

    // If suddenly approved while on this page, redirect immediately
    if (currentOrganization?.status === 'approved') {
        return <Navigate to="/" replace />;
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h4" gutterBottom>
                    {currentOrganization?.status === 'denied' ? 'Request Denied' : 'Pending Approval'}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    {currentOrganization?.status === 'denied'
                        ? 'Your organization approval request was denied by the administrator.'
                        : 'Your organization is currently awaiting administrator approval. Please check back later.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="contained" onClick={handleRefresh}>Refresh Status</Button>
                    <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
                </Box>
            </Box>
        </Container>
    );
}
