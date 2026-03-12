import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { OrganizationService } from '../../services/organization.service';
import { VALIDATION_PATTERNS } from '../../config/constants';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const orgSchema = z.object({
    orgName: z.string().min(2, 'Organization Name is required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().min(6, 'Pincode is required'),
    gstNumber: z.string().regex(VALIDATION_PATTERNS.GST, 'Invalid GST Number').optional().or(z.literal('')),
});

type OrgFormData = z.infer<typeof orgSchema>;

export default function OrganizationSetupPage() {
    const navigate = useNavigate();
    const { user, profile, setProfile } = useAuthStore();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrgFormData>({
        resolver: zodResolver(orgSchema)
    });

    const onSubmit = async (data: OrgFormData) => {
        if (!user || !profile) return;
        try {
            const orgId = user.uid;

            // let logoUrl = null;
            // if (logoFile) {
            //     logoUrl = await OrganizationService.uploadLogo(orgId, logoFile);
            // }

            const orgData = {
                ...data,
                ownerId: user.uid,
                logoUrl: null
            };

            const isAdmin = profile.userType === 'admin';
            await OrganizationService.createOrganization(orgId, orgData, isAdmin);

            setProfile({
                ...profile,
                organizationId: orgId
            });

            setDialogConfig({
                open: true,
                variant: 'success',
                title: isAdmin ? 'Dashboard Unlocked' : 'Organization Setup Complete',
                message: isAdmin ? 'Your firm has been instantly approved. You can now start using the platform.' : 'Your organization has been created and is pending approval from Harte Labs admin. We will notify you once approved.',
                onConfirm: () => {
                    setDialogConfig(prev => ({ ...prev, open: false }));
                    if (isAdmin) {
                        navigate('/dashboard');
                    } else {
                        navigate('/pending-approval');
                    }
                }
            });
        } catch (error) {
            console.error(error);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Setup Failed',
                message: 'Failed to create your organization. Please ensure your connection is stable and try again.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500, mx: 'auto', p: 2 }}>
            <Typography variant="h5" textAlign="center" mb={1}>Setup Your Organization</Typography>

            <TextField
                label="Organization Name"
                {...register('orgName')}
                error={!!errors.orgName}
                helperText={errors.orgName?.message}
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
            <TextField
                label="GST Number (Optional)"
                {...register('gstNumber')}
                error={!!errors.gstNumber}
                helperText={errors.gstNumber?.message}
            />

            {/*
            <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>Upload Logo (Optional)</Typography>
                <Button variant="outlined" component="label">
                    Choose File
                    <input type="file" hidden accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </Button>
                {logoFile && <Typography variant="caption" ml={2}>{logoFile.name}</Typography>}
            </Box>
            */}

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 2 }}
            >
                {isSubmitting ? 'Saving...' : 'Submit'}
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
