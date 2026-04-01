import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, Typography, List, ListItem, ListItemText, Chip, Button, 
    CircularProgress, ToggleButton, ToggleButtonGroup, Collapse,
    IconButton, Divider, Avatar, Stack
} from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AdminService } from '../../services/admin.service';

export default function FirmManagementPage() {
    const { 
        organizations: orgs, users, loading, initialized, 
        fetchOrganizations, fetchUsers 
    } = useAdminStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>(
        location.state?.statusFilter || 'all'
    );
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [dialogConfig, setDialogConfig] = useState<{ 
        open: boolean, title: string, message: string, 
        variant: 'success' | 'confirm' | 'error', onConfirm: () => void 
    }>({ open: false, title: '', message: '', variant: 'confirm', onConfirm: () => {} });

    useEffect(() => {
        if (!initialized) {
            fetchOrganizations();
            fetchUsers();
        }
    }, [initialized, fetchOrganizations, fetchUsers]);

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

    // Map members to their organizations (excluding the owner)
    const orgMembersMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        orgs.forEach(o => map[o.id] = []);
        users.forEach(u => {
            if (u.organizationId && map[u.organizationId]) {
                const org = orgs.find(o => o.id === u.organizationId);
                if (org && org.ownerId !== u.uid) {
                    map[u.organizationId].push(u);
                }
            }
        });
        return map;
    }, [users, orgs]);

    const handleUpdateMemberStatus = (member: any, newStatus: 'approved' | 'denied') => {
        const isDeactivate = newStatus === 'denied';
        setDialogConfig({
            open: true,
            variant: isDeactivate ? 'confirm' : 'success',
            title: isDeactivate ? 'Revoke User Access?' : 'Approve User?',
            message: `Are you sure you want to ${isDeactivate ? 'revoke access for' : 'approve'} ${member.displayName}?`,
            onConfirm: async () => {
                setDialogConfig(prev => ({ ...prev, open: false }));
                setActionLoading(member.uid);
                try {
                    await AdminService.updateUserStatus(member.uid, newStatus);
                    await fetchUsers(); // Refresh store data
                } catch (err: any) {
                    alert('Error: ' + err.message);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    return (
        <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Organization Management</Typography>
                <Button variant="outlined" size="small" 
                    onClick={() => { fetchOrganizations(); fetchUsers(); }} 
                    disabled={loading}>
                    Refresh
                </Button>
            </Box>

            <Box mb={3} display="flex" gap={1} overflow="auto">
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
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredOrgs.map(org => {
                        const members = orgMembersMap[org.id] || [];
                        const isExpanded = expandedOrg === org.id;

                        return (
                            <ListItem
                                key={org.id}
                                sx={{
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 2,
                                    backgroundColor: '#FFFFFF',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.03)',
                                    p: 0,
                                    overflow: 'hidden',
                                    borderLeft: `5px solid ${org.status === 'approved' ? '#10B981' :
                                            org.status === 'denied' ? '#EF4444' : '#F59E0B'
                                        }`
                                }}
                            >
                                {/* Header Section */}
                                <Box sx={{ p: 2, pb: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box flexGrow={1}>
                                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1.2 }}>
                                            {org.orgName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {org.city} &bull; {org.gstNumber || 'No GST'}
                                        </Typography>
                                        
                                        <Box display="flex" gap={1} mt={1} alignItems="center">
                                            <Chip
                                                label={org.status}
                                                color={getStatusColor(org.status) as any}
                                                size="small"
                                                sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700, textTransform: 'uppercase' }}
                                            />
                                            {members.length > 0 && (
                                                <Chip
                                                    icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />}
                                                    label={`${members.length} Staff`}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                    <IconButton 
                                        onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                                        size="small"
                                        sx={{ bgcolor: '#F1F5F9', ml: 1 }}
                                    >
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>

                                {/* Action Bar */}
                                <Box width="100%" px={2} pb={2} display="flex" gap={1} justifyContent="flex-end">
                                    <Button 
                                        variant="text" 
                                        size="small" 
                                        sx={{ fontSize: '0.75rem' }}
                                        onClick={() => navigate(`/admin/organizations/${org.id}`, { state: { org } })}
                                    >
                                        Deep Details &rarr;
                                    </Button>
                                </Box>

                                {/* Expandable Staff List */}
                                <Collapse in={isExpanded} sx={{ width: '100%' }}>
                                    <Divider />
                                    <Box px={2} py={1.5} bgcolor="#F8FAFC">
                                        <Typography variant="overline" color="text.secondary" fontWeight="bold">
                                            Staff Members
                                        </Typography>
                                        {members.length === 0 ? (
                                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                                                No staff members invited yet.
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1.5} mt={1}>
                                                {members.map(member => (
                                                    <Box key={member.uid} display="flex" gap={1.5} alignItems="center">
                                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                                                            {member.displayName?.[0] || '?'}
                                                        </Avatar>
                                                        <Box flexGrow={1} minWidth={0}>
                                                            <Typography variant="body2" fontWeight="bold" noWrap>
                                                                {member.displayName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                {member.phone}
                                                            </Typography>
                                                        </Box>
                                                        
                                                        {/* Status & Toggle */}
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Chip 
                                                                label={member.status === 'denied' ? 'Revoked' : member.status} 
                                                                size="small" 
                                                                color={member.status === 'approved' ? 'success' : member.status === 'denied' ? 'error' : 'warning'}
                                                                variant="outlined"
                                                                sx={{ height: 18, fontSize: '0.65rem' }}
                                                            />
                                                            <IconButton 
                                                                size="small" 
                                                                color={member.status === 'approved' ? 'error' : 'success'}
                                                                onClick={() => handleUpdateMemberStatus(
                                                                    member, 
                                                                    member.status === 'approved' ? 'denied' : 'approved'
                                                                )}
                                                                disabled={actionLoading === member.uid}
                                                            >
                                                                {member.status === 'approved' ? <PersonOffIcon sx={{fontSize: 16}} /> : <CheckCircleIcon sx={{fontSize: 16}} />}
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                </Collapse>
                            </ListItem>
                        );
                    })}
                </List>
            )}

            {!loading && initialized && filteredOrgs.length === 0 && (
                <Typography textAlign="center" color="text.secondary" p={4}>No organizations found.</Typography>
            )}

            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                variant={dialogConfig.variant}
                onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig(prev => ({ ...prev, open: false }))}
                confirmText="Yes, Proceed"
            />
        </Box>
    );
}

