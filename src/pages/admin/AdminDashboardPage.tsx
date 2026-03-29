import React, { useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
    const { organizations: orgs, fetchOrganizations, loading, initialized } = useAdminStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!initialized) {
            fetchOrganizations();
        }
    }, [initialized, fetchOrganizations]);

    if (loading && !initialized) return <Typography p={3}>Loading stats...</Typography>;

    const activeOrgs = orgs.filter(o => !o.isOwnerAdmin);
    const pendingCount = activeOrgs.filter(o => o.status === 'pending').length;
    const approvedCount = activeOrgs.filter(o => o.status === 'approved').length;
    const deniedCount = activeOrgs.filter(o => o.status === 'denied').length;

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Viswa Ledger Admin</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #F59E0B', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'pending' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Pending Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{pendingCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #10B981', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'approved' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Approved Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{approvedCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #EF4444', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'denied' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Denied Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{deniedCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
