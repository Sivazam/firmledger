import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Divider, Avatar, Stack
} from '@mui/material';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { AdminService } from '../../services/admin.service';
import type { UserProfile } from '../../types/user.types';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ManageMembersPage() {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();

    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    const [dialogConfig, setDialogConfig] = useState<{
        open: boolean; title: string; message: string;
        variant: 'success' | 'error' | 'confirm'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', variant: 'confirm', onConfirm: () => {} });

    const fetchMembers = useCallback(async () => {
        if (!profile?.organizationId) return;
        setLoadingMembers(true);
        try {
            const data = await AdminService.getMembersForOrg(
                profile.organizationId,
                profile.uid  // exclude self (owner)
            );
            // Sort: active first, then pending, then deactivated
            data.sort((a, b) => {
                const order: Record<string, number> = { approved: 0, pending: 1, denied: 2 };
                return (order[a.status ?? 'approved'] ?? 0) - (order[b.status ?? 'approved'] ?? 0);
            });
            setMembers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    }, [profile?.organizationId, profile?.uid]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleToggleStatus = (member: UserProfile, newStatus: 'approved' | 'denied') => {
        const isDeactivate = newStatus === 'denied';
        setDialogConfig({
            open: true,
            variant: isDeactivate ? 'confirm' : 'success',
            title: isDeactivate ? 'Deactivate Member?' : 'Reactivate Member?',
            message: isDeactivate
                ? `${member.displayName} will lose access to this organization immediately. You can reactivate them anytime.`
                : `${member.displayName} will regain access to manage this organization.`,
            onConfirm: async () => {
                setDialogConfig(prev => ({ ...prev, open: false }));
                setActionLoading(member.uid);
                try {
                    await AdminService.updateUserStatus(member.uid, newStatus);
                    await fetchMembers();
                } catch (err) {
                    console.error(err);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const getStatusChip = (status?: string) => {
        switch (status) {
            case 'pending':  return <Chip label="Pending Approval" color="warning" size="small" sx={{fontWeight: 700, fontSize: '0.65rem'}} />;
            case 'denied':   return <Chip label="Deactivated" color="error" size="small" sx={{fontWeight: 700, fontSize: '0.65rem'}} />;
            default:         return <Chip label="Active" color="success" size="small" sx={{fontWeight: 700, fontSize: '0.65rem'}} />;
        }
    };

    const isOrgOwner = profile?.uid === currentOrganization?.ownerId;

    return (
        <Box p={2} maxWidth={750} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <GroupIcon color="primary" />
                    <Typography variant="h5" fontWeight="800">Team Members</Typography>
                    {!loadingMembers && (
                        <Chip label={`${members.length} member${members.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                    )}
                </Box>
            </Box>

            {loadingMembers ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : members.length === 0 ? (
                <Box textAlign="center" py={8} bgcolor="white" borderRadius={3} border="1px dashed #E2E8F0">
                    <GroupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No members yet</Typography>
                    <Typography variant="body2" color="text.disabled" mt={1}>
                        Staff members will appear here once created by the system administrator.
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {members.map(member => (
                        <Card key={member.uid} sx={{
                            borderRadius: 3,
                            boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid #E2E8F0',
                            borderLeft: `5px solid ${
                                member.status === 'denied' ? '#EF4444' :
                                member.status === 'pending' ? '#F59E0B' : '#10B981'
                            }`,
                            opacity: member.status === 'denied' ? 0.85 : 1
                        }}>
                            <CardContent sx={{ py: '16px !important' }}>
                                <Box 
                                    display="flex" 
                                    flexDirection={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between" 
                                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                                    gap={2}
                                >
                                    <Box display="flex" gap={2} alignItems="center" flexGrow={1} minWidth={0} width="100%">
                                        <Avatar sx={{ bgcolor: 'secondary.light', flexShrink: 0, fontWeight: 'bold' }}>
                                            {member.displayName?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar>
                                        <Box minWidth={0}>
                                            <Typography fontWeight="800" noWrap fontSize="1rem">{member.displayName}</Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap fontSize="0.85rem">{member.email}</Typography>
                                            {member.phone && <Typography variant="caption" color="text.disabled" fontWeight="600">{member.phone}</Typography>}
                                        </Box>
                                    </Box>

                                    <Box 
                                        display="flex" 
                                        flexDirection={{ xs: 'row-reverse', sm: 'column' }}
                                        alignItems={{ xs: 'center', sm: 'flex-end' }} 
                                        justifyContent="space-between"
                                        gap={1} 
                                        flexShrink={0}
                                        width={{ xs: '100%', sm: 'auto' }}
                                        pt={{ xs: 1, sm: 0 }}
                                        borderTop={{ xs: '1px solid #F1F5F9', sm: 'none' }}
                                    >
                                        {getStatusChip(member.status)}
                                        {isOrgOwner && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                color={member.status === 'denied' ? 'success' : 'error'}
                                                disabled={actionLoading === member.uid}
                                                onClick={() => handleToggleStatus(member, member.status === 'denied' ? 'approved' : 'denied')}
                                                sx={{fontWeight: 700, fontSize: '0.75rem', px: 0}}
                                            >
                                                {member.status === 'denied' ? 'Reactivate' : 'Deactivate'}
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                variant={dialogConfig.variant}
                onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig(prev => ({ ...prev, open: false }))}
                confirmText="Ok"
            />
        </Box>
    );
}
