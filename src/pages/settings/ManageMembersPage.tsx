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
            case 'pending':  return <Chip label="Pending Approval" color="warning" size="small" />;
            case 'denied':   return <Chip label="Deactivated" color="error" size="small" />;
            default:         return <Chip label="Active" color="success" size="small" />;
        }
    };

    const isOwner = currentOrganization?.ownerId === profile?.uid;

    return (
        <Box p={2} maxWidth={700} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <GroupIcon color="primary" />
                <Typography variant="h5">Team Members</Typography>
                {!loadingMembers && (
                    <Chip label={`${members.length} member${members.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                )}
            </Box>

            {!isOwner && (
                <Box sx={{ p: 2, mb: 3, bgcolor: '#FEF3C7', borderRadius: 2, border: '1px solid #F59E0B' }}>
                    <Typography variant="body2" color="text.secondary">
                        Only the organization owner can manage team members.
                    </Typography>
                </Box>
            )}

            {loadingMembers ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : members.length === 0 ? (
                <Box textAlign="center" py={8}>
                    <GroupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No members yet</Typography>
                    <Typography variant="body2" color="text.disabled" mt={1}>
                        Invite staff from Organization Details to get started.
                    </Typography>
                    <Button
                        variant="outlined"
                        sx={{ mt: 3 }}
                        onClick={() => navigate('/settings/organization')}
                    >
                        Go to Organization Details
                    </Button>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {members.map(member => (
                        <Card key={member.uid} variant="outlined" sx={{
                            borderLeft: `4px solid ${
                                member.status === 'denied' ? '#EF4444' :
                                member.status === 'pending' ? '#F59E0B' : '#10B981'
                            }`,
                            opacity: member.status === 'denied' ? 0.85 : 1
                        }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                                    {/* Left: avatar + details */}
                                    <Box display="flex" gap={2} alignItems="center" flexGrow={1} minWidth={0}>
                                        <Avatar sx={{ bgcolor: 'primary.main', flexShrink: 0 }}>
                                            {member.displayName?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar>
                                        <Box minWidth={0}>
                                            <Typography fontWeight="bold" noWrap>{member.displayName}</Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>{member.email}</Typography>
                                            <Typography variant="caption" color="text.disabled">{member.phone}</Typography>
                                        </Box>
                                    </Box>

                                    {/* Right: status + action */}
                                    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1} flexShrink={0}>
                                        {getStatusChip(member.status)}
                                        {isOwner && member.status !== 'pending' && (
                                            member.status === 'denied' ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    startIcon={<PersonIcon />}
                                                    disabled={actionLoading === member.uid}
                                                    onClick={() => handleToggleStatus(member, 'approved')}
                                                >
                                                    Reactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<PersonOffIcon />}
                                                    disabled={actionLoading === member.uid}
                                                    onClick={() => handleToggleStatus(member, 'denied')}
                                                >
                                                    Deactivate
                                                </Button>
                                            )
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
                confirmText="Yes, proceed"
                cancelText="Cancel"
            />
        </Box>
    );
}
