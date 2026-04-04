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
            <Typography variant="h5" mb={1} fontWeight="900">Viswa Ledger Admin</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                High-level overview of the entire system.
            </Typography>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card 
                        sx={{ 
                            borderRadius: 3,
                            border: '1px solid #E2E8F0',
                            borderLeft: '4px solid #3B82F6',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#F8FAFC' }
                        }} 
                        onClick={() => navigate('/admin/organizations')}
                    >
                        <CardContent sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary" textTransform="uppercase">
                                Total Organizations
                            </Typography>
                            <Typography variant="h4" fontWeight="900" color="primary">
                                {activeOrgs.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card 
                        sx={{ 
                            borderRadius: 3,
                            border: '1px solid #E2E8F0',
                            borderLeft: '4px solid #8B5CF6',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#F8FAFC' }
                        }} 
                        onClick={() => navigate('/admin/users', { state: { statusFilter: 'approved' } })}
                    >
                        <CardContent sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary" textTransform="uppercase">
                                Total Staff Users
                            </Typography>
                            <Typography variant="h4" fontWeight="900" color="secondary">
                                {invUsers.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
