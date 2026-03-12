import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { AdminService } from '../../services/admin.service';
import type { Organization } from '../../types/organization.types';

export default function AdminDashboardPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await AdminService.getAllOrganizations();
                setOrgs(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <Typography p={3}>Loading stats...</Typography>;

    const pendingCount = orgs.filter(o => o.status === 'pending').length;
    const approvedCount = orgs.filter(o => o.status === 'approved').length;
    const deniedCount = orgs.filter(o => o.status === 'denied').length;

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Admin Dashboard</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #F59E0B' }}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Pending Firms</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{pendingCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #10B981' }}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Approved Firms</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{approvedCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #EF4444' }}>
                        <CardContent>
                            <Typography color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Denied Firms</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">{deniedCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
