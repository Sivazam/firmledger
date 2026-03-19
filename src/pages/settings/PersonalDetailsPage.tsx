import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function PersonalDetailsPage() {
    const { profile, setProfile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: profile?.displayName || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        city: profile?.city || '',
        pincode: profile?.pincode || ''
    });
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', profile.uid), {
                ...formData,
                updatedAt: serverTimestamp()
            });
            const newProfile = await AuthService.getUserProfile(profile.uid);
            setProfile(newProfile);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Profile Updated',
                message: 'Your personal details have been successfully updated.',
                onConfirm: () => {
                    setDialogConfig(prev => ({ ...prev, open: false }));
                    navigate(-1);
                }
            });
        } catch (e) {
            console.error(e);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Update Failed',
                message: 'Failed to update personal details due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={2} maxWidth={600} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Typography variant="h5" mb={3}>Personal Details</Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Full Name" name="displayName" value={formData.displayName} onChange={handleChange} />
                <TextField label="Phone" name="phone" inputMode="numeric" value={formData.phone} onChange={handleChange} />
                <TextField label="Address" name="address" multiline rows={2} value={formData.address} onChange={handleChange} />
                <TextField label="City" name="city" value={formData.city} onChange={handleChange} />
                <TextField label="Pincode" name="pincode" inputMode="numeric" value={formData.pincode} onChange={handleChange} />

                <Button variant="contained" disabled={loading} onClick={handleSave} size="large">
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

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
