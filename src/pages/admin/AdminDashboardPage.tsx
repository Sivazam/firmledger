import React, { useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
    const { organizations: orgs, users, fetchOrganizations, fetchUsers, loading, initialized } = useAdminStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!initialized) {
            fetchOrganizations();
            fetchUsers();
        }
    }, [initialized, fetchOrganizations, fetchUsers]);

    if (loading && !initialized) return <Typography p={3}>Loading stats...</Typography>;

    // Filter out organizations owned by the SaaS administrator themselves (test orgs)
    const activeOrgs = orgs.filter(o => o.isOwnerAdmin !== true);
    const pendingOrgCount = activeOrgs.filter(o => o.status === 'pending').length;
    const approvedOrgCount = activeOrgs.filter(o => o.status === 'approved').length;
    const deniedOrgCount = activeOrgs.filter(o => o.status === 'denied').length;

    // Filter out users who are Owners (since their approval is tied to their organization)
    // AND filter out the SaaS admins themselves
    const ownerIds = new Set(activeOrgs.map(o => o.ownerId));
    const invUsers = users.filter(u => 
        !ownerIds.has(u.uid) && 
        u.userType !== 'super-admin' &&
        u.userType !== 'admin' // SaaS admins are already approved/separate
    );
    
    const pendingUserCount = invUsers.filter(u => u.status === 'pending').length;
    const approvedUserCount = invUsers.filter(u => (!u.status || u.status === 'approved')).length;
    const deniedUserCount = invUsers.filter(u => u.status === 'denied').length;

    return (
        <Box p={2}>
            <Typography variant="h5" mb={1}>Viswa Ledger Admin</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Manage organizations and invited staff members.</Typography>

            <Typography variant="h6" mb={2} color="primary">Organizations</Typography>
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #F59E0B', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'pending' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Pending Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{pendingOrgCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #10B981', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'approved' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Approved Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{approvedOrgCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #EF4444', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/organizations', { state: { statusFilter: 'denied' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Denied Organizations</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{deniedOrgCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h6" mb={2} color="secondary">Invited Staff Requests</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #F59E0B', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/users', { state: { statusFilter: 'pending' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Pending Users</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{pendingUserCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #10B981', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/users', { state: { statusFilter: 'approved' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Approved Users</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{approvedUserCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #EF4444', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => navigate('/admin/users', { state: { statusFilter: 'denied' } })}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Denied Users</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{deniedUserCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
