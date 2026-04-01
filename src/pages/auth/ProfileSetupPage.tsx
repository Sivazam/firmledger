import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const profileSchema = z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inviteCode = searchParams.get('invite');
    const [invitedOrgName, setInvitedOrgName] = useState<string | null>(null);

    const { user, profile, setProfile, loading } = useAuthStore();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    React.useEffect(() => {
        if (inviteCode) {
            getDoc(doc(db, 'organizations', inviteCode)).then(snap => {
                if (snap.exists()) setInvitedOrgName(snap.data().orgName);
                else setInvitedOrgName('Unknown Organization');
            }).catch(console.error);
        }
    }, [inviteCode]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (profile?.profileComplete) {
        navigate('/', { replace: true });
        return null;
    }

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.displayName || '',
            phone: '',
            address: '',
            city: '',
            pincode: ''
        }
    });

    const onSubmit = async (data: ProfileFormData) => {
        if (!user) return;
        try {
            const profileData = {
                ...data,
                email: user.email || '',
                userType: 'user' as const,
                organizationId: inviteCode || null,
                status: (inviteCode ? 'pending' : 'approved') as 'pending' | 'approved',
                profileComplete: true
            };

            await AuthService.createUserProfile(user.uid, profileData);

            // Update store
            const newProfile = await AuthService.getUserProfile(user.uid);
            setProfile(newProfile);

            if (inviteCode) {
                // Sent to approval screen immediately
                navigate('/pending-approval');
            } else {
                navigate('/setup-organization');
            }
        } catch (error) {
            console.error(error);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Setup Failed',
                message: 'Failed to save your profile details due to a network error. Please try again.',
                onConfirm: () => setDialogConfig((prev: any) => ({ ...prev, open: false }))
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" textAlign="center" mb={1}>Complete Your Profile</Typography>
            <Typography variant="body2" textAlign="center" color="text.secondary" mb={2}>
                Please provide your personal details to continue.
            </Typography>

            {inviteCode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    You have been invited to join <strong>{invitedOrgName || 'this organization'}</strong>. 
                    Completing your profile will send an approval request to the system administrator.
                </Alert>
            )}

            <TextField
                label="Full Name"
                {...register('displayName')}
                error={!!errors.displayName}
                helperText={errors.displayName?.message}
            />
            <TextField
                label="Phone Number"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
            />
            <TextField
                label="Address"
                multiline
                rows={2}
                {...register('address')}
                error={!!errors.address}
                helperText={errors.address?.message}
            />
            <TextField
                label="City"
                {...register('city')}
                error={!!errors.city}
                helperText={errors.city?.message}
            />
            <TextField
                label="Pincode"
                {...register('pincode')}
                error={!!errors.pincode}
                helperText={errors.pincode?.message}
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>

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
