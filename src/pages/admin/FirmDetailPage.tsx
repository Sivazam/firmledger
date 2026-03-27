import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import type { Organization } from '../../types/organization.types';
import type { UserProfile } from '../../types/user.types';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function FirmDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const org = location.state?.org as Organization;
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    useEffect(() => {
        if (org?.ownerId) {
            AuthService.getUserProfile(org.ownerId).then(setOwner).catch(console.error);
        }
    }, [org]);

    if (!org) {
        return <Typography p={2}>Organization not found.</Typography>;
    }

    const handleStatusChange = async (status: 'approved' | 'denied') => {
        if (!user) return;
        try {
            await AdminService.updateOrganizationStatus(org.id, status, user.uid);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Status Updated',
                message: `Organization successfully ${status}.` ,
                onConfirm: () => {
                    setDialogConfig((prev: any) => ({ ...prev, open: false }));
                    navigate('/admin/organizations');
                }
            });
        } catch (err) {
            console.error(err);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Update Failed',
                message: 'Failed to update organization status due to a network error.',
                onConfirm: () => setDialogConfig((prev: any) => ({ ...prev, open: false }))
            });
        }
    };

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>

            <Paper sx={{ p: 3, borderTop: '4px solid #1E40AF' }}>
                <Typography variant="h5" fontWeight="bold" color="text.primary" mb={2}>{org.orgName}</Typography>

                <Box display="flex" flexDirection="column" gap={1} mb={3}>
                    <Typography><strong>Status:</strong> {org.status}</Typography>
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

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2}>Requester Details</Typography>
                {owner ? (
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography><strong>Name:</strong> {owner.displayName}</Typography>
                        <Typography><strong>Mobile:</strong> {owner.phone}</Typography>
                        <Typography><strong>Email:</strong> {owner.email}</Typography>
                        <Typography><strong>Address:</strong> {owner.address}, {owner.city} - {owner.pincode}</Typography>
                    </Box>
                ) : (
                    <Typography color="text.secondary">Loading requester details...</Typography>
                )}

                {org.status === 'pending' && (
                    <Box display="flex" gap={2} mt={4}>
                        <Button variant="contained" color="success" onClick={() => handleStatusChange('approved')}>
                            Approve
                        </Button>
                        <Button variant="contained" color="error" onClick={() => handleStatusChange('denied')}>
                            Deny
                        </Button>
                    </Box>
                )}

                {org.status === 'approved' && (
                    <Box display="flex" gap={2} mt={4}>
                        <Button variant="contained" color="error" onClick={() => handleStatusChange('denied')}>
                            Revoke Approval
                        </Button>
                    </Box>
                )}

                {org.status === 'denied' && (
                    <Box display="flex" gap={2} mt={4}>
                        <Button variant="contained" color="success" onClick={() => handleStatusChange('approved')}>
                            Re-Approve Organization
                        </Button>
                    </Box>
                )}
            </Paper>

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
