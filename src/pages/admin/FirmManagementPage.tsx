import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button } from '@mui/material';
import { AdminService } from '../../services/admin.service';
import type { Organization } from '../../types/organization.types';
import { useNavigate } from 'react-router-dom';

export default function FirmManagementPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFirms();
    }, []);

    const fetchFirms = async () => {
        try {
            const data = await AdminService.getAllOrganizations();
            // sort by created date descending
            data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setOrgs(data);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'denied': return 'error';
            default: return 'warning';
        }
    };

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Organization Management</Typography>

            <List>
                {orgs.filter(o => !o.isOwnerAdmin).map(org => (
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
            {orgs.length === 0 && <Typography textAlign="center">No organizations found.</Typography>}
        </Box>
    );
}
