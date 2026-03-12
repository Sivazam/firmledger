import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { SuperAdminService } from '../../services/superAdmin.service';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile, UserType } from '../../types/user.types';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function SuperAdminDashboardPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const { profile } = useAuthStore();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });
    const [roleEditConfig, setRoleEditConfig] = useState<{ open: boolean, uid: string, currentRole: UserType | '', name: string }>({
        open: false, uid: '', currentRole: '', name: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await SuperAdminService.getAllUsers();
            setUsers(data);
        } catch (error: any) {
            console.error('Failed to fetch users:', error);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Fetch Error',
                message: 'Could not load users. You might not have permission.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (uid: string, newRole: UserType) => {
        setUpdating(uid);
        try {
            await SuperAdminService.updateUserRole(uid, newRole);
            setUsers(users.map(u => u.uid === uid ? { ...u, userType: newRole } : u));
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Role Updated',
                message: 'User role has been successfully updated.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } catch (error: any) {
            console.error('Failed to update role:', error);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update user role. Please check your connection.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={2} sx={{ maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h5" fontWeight="bold" mb={1}>Super Admin Console</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Manage user permissions and system roles.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Admins have full access to firm features and multi-organization management. Users are restricted to their own organizations.
            </Alert>

            <Paper sx={{ width: '100%', mb: 4 }}>
                <List disablePadding>
                    {users.map((user, index) => (
                        <React.Fragment key={user.uid}>
                            <ListItem
                                sx={{
                                    py: 2,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    gap: 2
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body1" fontWeight="600">{user.displayName}</Typography>
                                            <Chip
                                                label={user.userType.toUpperCase()}
                                                size="small"
                                                color={user.userType === 'admin' ? 'primary' : user.userType === 'super-admin' ? 'secondary' : 'default'}
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={user.email}
                                />
                                <Box
                                    sx={{
                                        alignSelf: { xs: 'flex-end', sm: 'center' },
                                        mt: { xs: -1, sm: 0 }
                                    }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={updating === user.uid || user.uid === profile?.uid}
                                        onClick={() => {
                                            setRoleEditConfig({
                                                open: true,
                                                uid: user.uid,
                                                currentRole: user.userType,
                                                name: user.displayName
                                            });
                                        }}
                                    >
                                        Edit Role
                                    </Button>
                                </Box>
                            </ListItem>
                            {index < users.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={roleEditConfig.open}
                onClose={() => setRoleEditConfig(prev => ({ ...prev, open: false }))}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Update Role: {roleEditConfig.name}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <Button
                            variant={roleEditConfig.currentRole === 'user' ? 'contained' : 'outlined'}
                            onClick={() => {
                                handleRoleChange(roleEditConfig.uid, 'user');
                                setRoleEditConfig(prev => ({ ...prev, open: false }));
                            }}
                        >
                            Standard User
                        </Button>
                        <Button
                            variant={roleEditConfig.currentRole === 'admin' ? 'contained' : 'outlined'}
                            onClick={() => {
                                handleRoleChange(roleEditConfig.uid, 'admin');
                                setRoleEditConfig(prev => ({ ...prev, open: false }));
                            }}
                        >
                            Admin
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                            * Standard users can only manage their own organization. Admins can manage all firms system-wide.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleEditConfig(prev => ({ ...prev, open: false }))}>Cancel</Button>
                </DialogActions>
            </Dialog>

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
