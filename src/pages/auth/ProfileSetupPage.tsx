import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
    const { user, profile, setProfile } = useAuthStore();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

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
                organizationId: null,
                profileComplete: true
            };

            await AuthService.createUserProfile(user.uid, profileData);

            // Update store
            const newProfile = await AuthService.getUserProfile(user.uid);
            setProfile(newProfile);

            // Navigate to org setup
            navigate('/setup-organization');
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
