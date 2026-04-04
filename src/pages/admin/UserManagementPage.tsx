import React, { useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Chip } from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AdminService } from '../../services/admin.service';

export default function UserManagementPage() {
    const { users, organizations, fetchUsers } = useAdminStore();
    const location = useLocation();
    const navigate = useNavigate();
    const statusFilter = location.state?.statusFilter || 'approved';

    const [dialogConfig, setDialogConfig] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'confirm' | 'error'; onConfirm: () => void; }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Get all organization owners to exclude them (their status is tied to their org)
    const ownerIds = new Set(organizations.map(o => o.ownerId));

    const displayUsers = users.filter(u => {
        // Skip owners (approved via orgs) and SaaS admins
        if (ownerIds.has(u.uid) || u.userType === 'admin' || u.userType === 'super-admin') return false;
        
        if (statusFilter === 'all') return true;
        if (statusFilter === 'approved') return !u.status || u.status === 'approved';
        if (statusFilter === 'denied') return u.status === 'denied';
        return true;
    });

    const getOrgName = (orgId: string | null) => {
        if (!orgId) return 'Unknown Org';
        const org = organizations.find(o => o.id === orgId);
        return org ? org.orgName : 'Unknown Org';
    };

    const handleUpdateStatus = async (uid: string, newStatus: 'approved' | 'denied') => {
        setDialogConfig({
            open: true,
            title: `Confirm ${newStatus === 'approved' ? 'Approval' : 'Denial'}`,
            message: `Are you sure you want to ${newStatus} this user request?`,
            variant: newStatus === 'approved' ? 'success' : 'error',
            onConfirm: async () => {
                setDialogConfig({ ...dialogConfig, open: false });
                setLoadingAction(uid);
                try {
                    await AdminService.updateUserStatus(uid, newStatus);
                    await fetchUsers();
                } catch (e: any) {
                    alert('Error updating user status: ' + e.message);
                } finally {
                    setLoadingAction(null);
                }
            }
        });
    };

    return (
        <Box p={2}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button onClick={() => navigate('/admin/dashboard')}>&larr; Back</Button>
                <Typography variant="h5" textTransform="capitalize" fontWeight="900">
                    {statusFilter === 'approved' ? 'Staff Members' : `${statusFilter} Users`}
                </Typography>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name / Username</TableCell>
                            <TableCell>Email / Phone</TableCell>
                            <TableCell>Target Organization</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    No {statusFilter} users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayUsers.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <Typography fontWeight="bold">{user.displayName}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{user.email}</Typography>
                                        <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={getOrgName(user.organizationId)} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        {user.status === 'pending' && <Chip label="Pending" color="warning" size="small" />}
                                        {(!user.status || user.status === 'approved') && <Chip label="Approved" color="success" size="small" />}
                                        {user.status === 'denied' && <Chip label="Denied" color="error" size="small" />}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" gap={1} justifyContent="flex-end">
                                            {user.status === 'pending' && (
                                                <>
                                                    <Button variant="contained" color="success" size="small"
                                                        disabled={loadingAction === user.uid}
                                                        onClick={() => handleUpdateStatus(user.uid, 'approved')}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button variant="contained" color="error" size="small"
                                                        disabled={loadingAction === user.uid}
                                                        onClick={() => handleUpdateStatus(user.uid, 'denied')}
                                                    >
                                                        Deny
                                                    </Button>
                                                </>
                                            )}
                                            {(!user.status || user.status === 'approved') && (
                                                <Button variant="outlined" color="error" size="small"
                                                    disabled={loadingAction === user.uid}
                                                    onClick={() => handleUpdateStatus(user.uid, 'denied')}
                                                >
                                                    Revoke Access
                                                </Button>
                                            )}
                                            {user.status === 'denied' && (
                                                <Button variant="outlined" color="success" size="small"
                                                    disabled={loadingAction === user.uid}
                                                    onClick={() => handleUpdateStatus(user.uid, 'approved')}
                                                >
                                                    Re-Approve
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                variant={dialogConfig.variant}
                onConfirm={dialogConfig.onConfirm}
            />
        </Box>
    );
}
