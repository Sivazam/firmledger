import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function FirmManagementPage() {
    const { organizations: orgs, loading, initialized, fetchOrganizations } = useAdminStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>(
        location.state?.statusFilter || 'all'
    );

    useEffect(() => {
        if (!initialized) {
            fetchOrganizations();
        }
    }, [initialized, fetchOrganizations]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'denied': return 'error';
            default: return 'warning';
        }
    };

    const filteredOrgs = orgs.filter(o => {
        if (o.isOwnerAdmin) return false;
        if (statusFilter === 'all') return true;
        return o.status === statusFilter;
    });

    return (
        <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Organization Management</Typography>
                <Button variant="outlined" size="small" onClick={() => fetchOrganizations()} disabled={loading}>
                    Refresh
                </Button>
            </Box>

            <Box mb={3}>
                <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={(e, newLevel) => {
                        if (newLevel !== null) setStatusFilter(newLevel);
                    }}
                    size="small"
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="denied">Denied</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading && !initialized ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (

            <List>
                {filteredOrgs.map(org => (
                    <ListItem
                        key={org.id}
                        sx={{
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.03)',
                            borderLeft: `4px solid ${org.status === 'approved' ? '#10B981' :
                                    org.status === 'denied' ? '#EF4444' : '#F59E0B'
                                }`
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                            <ListItemText
                                primary={<Typography variant="h6" fontWeight="bold" color="text.primary">{org.orgName}</Typography>}
                                secondary={<Typography variant="body2" color="text.secondary">City: {org.city} &bull; GST: {org.gstNumber || 'N/A'}</Typography>}
                            />
                            <Chip
                                label={org.status.toUpperCase()}
                                color={getStatusColor(org.status) as any}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Box>
                        <Box mt={2} width="100%" display="flex" justifyContent="flex-end">
                            <Button variant="outlined" size="small" onClick={() => navigate(`/admin/organizations/${org.id}`, { state: { org } })}>
                                View Details
                            </Button>
                        </Box>
                    </ListItem>
                ))}
            </List>
            )}
            {!loading && initialized && filteredOrgs.length === 0 && (
                <Typography textAlign="center" color="text.secondary" p={4}>No organizations found.</Typography>
            )}
        </Box>
    );
}
