import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Divider, Chip, Avatar, Stack, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import type { Organization } from '../../types/organization.types';
import type { UserProfile } from '../../types/user.types';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function FirmDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { fetchOrganizations } = useAdminStore();
    const org = location.state?.org as Organization;
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isBusinessEnabled, setIsBusinessEnabled] = useState(!!org.hasBusinessTransactions);
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error' | 'confirm', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'confirm', onConfirm: () => { }
    });

    useEffect(() => {
        if (org?.ownerId) {
            AuthService.getUserProfile(org.ownerId).then(setOwner).catch(console.error);
        }
    }, [org]);

    // Fetch non-owner members for this org
    useEffect(() => {
        if (!org?.id || !org?.ownerId) return;
        setMembersLoading(true);
        AdminService.getMembersForOrg(org.id, org.ownerId)
            .then(data => {
                data.sort((a, b) => {
                    const order: Record<string, number> = { approved: 0, pending: 1, denied: 2 };
                    return (order[a.status ?? 'approved'] ?? 0) - (order[b.status ?? 'approved'] ?? 0);
                });
                setMembers(data);
            })
            .catch(console.error)
            .finally(() => setMembersLoading(false));
    }, [org]);

    if (!org) {
        return <Typography p={2}>Organization not found.</Typography>;
    }

    const handleOrgStatusChange = async (status: 'approved' | 'denied') => {
        if (!user) return;
        try {
            await AdminService.updateOrganizationStatus(org.id, status, org.ownerId, user.uid, isBusinessEnabled);
            setDialogConfig({
                open: true, variant: 'success', title: 'Status Updated',
                message: `Organization successfully ${status}.`,
                onConfirm: async () => {
                    setDialogConfig((prev: any) => ({ ...prev, open: false }));
                    await fetchOrganizations();
                    navigate('/admin/organizations');
                }
            });
        } catch (err) {
            console.error(err);
            setDialogConfig({
                open: true, variant: 'error', title: 'Update Failed',
                message: 'Failed to update organization status due to a network error.',
                onConfirm: () => setDialogConfig((prev: any) => ({ ...prev, open: false }))
            });
        }
    };

    const handleMemberStatusChange = (member: UserProfile, newStatus: 'approved' | 'denied') => {
        const label = newStatus === 'approved' ? 'approve' : 'revoke access for';
        setDialogConfig({
            open: true,
            variant: newStatus === 'approved' ? 'success' : 'confirm',
            title: newStatus === 'approved' ? 'Approve Member?' : 'Revoke Member Access?',
            message: `Are you sure you want to ${label} ${member.displayName}?`,
            onConfirm: async () => {
                setDialogConfig(prev => ({ ...prev, open: false }));
                setActionLoading(member.uid);
                try {
                    await AdminService.updateUserStatus(member.uid, newStatus);
                    setMembers(prev => prev.map(m =>
                        m.uid === member.uid ? { ...m, status: newStatus } : m
                    ));
                } catch (err) {
                    console.error(err);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const getMemberStatusChip = (status?: string) => {
        switch (status) {
            case 'pending': return <Chip label="Pending" color="warning" size="small" />;
            case 'denied':  return <Chip label="Revoked" color="error" size="small" />;
            default:        return <Chip label="Active" color="success" size="small" />;
        }
    };

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>

            <Paper sx={{ p: 3, borderTop: '4px solid #1E40AF' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">{org.orgName}</Typography>
                    <Chip
                        label={org.status.toUpperCase()}
                        color={org.status === 'approved' ? 'success' : org.status === 'denied' ? 'error' : 'warning'}
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                <Box display="flex" flexDirection="column" gap={1} mb={3}>
                    <Typography><strong>Address:</strong> {org.address}</Typography>
                    <Typography><strong>City:</strong> {org.city}</Typography>
                    <Typography><strong>Pincode:</strong> {org.pincode}</Typography>
                    <Typography><strong>GST Number:</strong> {org.gstNumber || 'N/A'}</Typography>
                </Box>

                {org.logoUrl && (
                    <Box mb={3}>
                        <Typography variant="subtitle2" gutterBottom>Logo:</Typography>
                        <img src={org.logoUrl} alt="Logo" style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain' }} />
                    </Box>
                )}

                {/* Business Transactions Toggle */}
                <Box mb={2}>
                    <FormControlLabel
                        control={
                            <Switch 
                                checked={isBusinessEnabled} 
                                onChange={(e) => setIsBusinessEnabled(e.target.checked)} 
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight="bold">
                                Enable Business Transactions (Sales, Purchase, etc.)
                            </Typography>
                        }
                    />
                </Box>

                {/* Org status actions */}
                <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                    {org.status === 'pending' && <>
                        <Button variant="contained" color="success" onClick={() => handleOrgStatusChange('approved')}>Approve</Button>
                        <Button variant="contained" color="error" onClick={() => handleOrgStatusChange('denied')}>Deny</Button>
                    </>}
                    {org.status === 'approved' && (
                        <Button variant="outlined" color="primary" onClick={() => handleOrgStatusChange('approved')}>Update Features</Button>
                    )}
                    {org.status === 'approved' && (
                        <Button variant="outlined" color="error" onClick={() => handleOrgStatusChange('denied')}>Revoke Approval</Button>
                    )}
                    {org.status === 'denied' && (
                        <Button variant="contained" color="success" onClick={() => handleOrgStatusChange('approved')}>Re-Approve Organization</Button>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Owner details */}
                <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
                    Organization Owner
                </Typography>
                {owner ? (
                    <Box display="flex" gap={2} alignItems="center" mb={3}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {owner.displayName?.[0]?.toUpperCase() ?? '?'}
                        </Avatar>
                        <Box>
                            <Typography fontWeight="bold">{owner.displayName}</Typography>
                            <Typography variant="body2" color="text.secondary">{owner.phone} · {owner.email}</Typography>
                            <Typography variant="caption" color="text.disabled">{owner.address}, {owner.city} - {owner.pincode}</Typography>
                        </Box>
                    </Box>
                ) : (
                    <Typography color="text.secondary" mb={3}>Loading owner details...</Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Staff Members section */}
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Staff Members
                    </Typography>
                    {!membersLoading && (
                        <Chip label={members.length} size="small" variant="outlined" />
                    )}
                </Box>

                {membersLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={28} />
                    </Box>
                ) : members.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                        No invited members for this organization.
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {members.map(member => (
                            <Box
                                key={member.uid}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                gap={2}
                                sx={{
                                    p: 1.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    borderLeft: `4px solid ${
                                        member.status === 'denied' ? '#EF4444' :
                                        member.status === 'pending' ? '#F59E0B' : '#10B981'
                                    }`,
                                    opacity: member.status === 'denied' ? 0.8 : 1,
                                    flexWrap: 'wrap'
                                }}
                            >
                                {/* Member info */}
                                <Box display="flex" gap={1.5} alignItems="center" flexGrow={1} minWidth={0}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
                                        {member.displayName?.[0]?.toUpperCase() ?? '?'}
                                    </Avatar>
                                    <Box minWidth={0}>
                                        <Typography fontWeight="bold" noWrap variant="body2">{member.displayName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{member.phone} · {member.email}</Typography>
                                    </Box>
                                </Box>

                                {/* Status + actions */}
                                <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                                    {getMemberStatusChip(member.status)}
                                    {member.status === 'pending' && (
                                        <>
                                            <Button size="small" variant="contained" color="success"
                                                disabled={actionLoading === member.uid}
                                                onClick={() => handleMemberStatusChange(member, 'approved')}>
                                                Approve
                                            </Button>
                                            <Button size="small" variant="outlined" color="error"
                                                disabled={actionLoading === member.uid}
                                                onClick={() => handleMemberStatusChange(member, 'denied')}>
                                                Deny
                                            </Button>
                                        </>
                                    )}
                                    {member.status === 'approved' && (
                                        <Button size="small" variant="outlined" color="error"
                                            disabled={actionLoading === member.uid}
                                            onClick={() => handleMemberStatusChange(member, 'denied')}>
                                            Revoke
                                        </Button>
                                    )}
                                    {member.status === 'denied' && (
                                        <Button size="small" variant="outlined" color="success"
                                            disabled={actionLoading === member.uid}
                                            onClick={() => handleMemberStatusChange(member, 'approved')}>
                                            Re-Approve
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

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

