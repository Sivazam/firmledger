import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { OrganizationService } from '../../services/organization.service';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function OrganizationDetailsPage() {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        orgName: '',
        address: '',
        city: '',
        pincode: '',
        gstNumber: '',
        logoUrl: ''
    });
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    useEffect(() => {
        if (profile?.organizationId) {
            OrganizationService.getOrganization(profile.organizationId).then(org => {
                if (org) {
                    setFormData({
                        orgName: org.orgName,
                        address: org.address,
                        city: org.city,
                        pincode: org.pincode,
                        gstNumber: org.gstNumber || '',
                        logoUrl: org.logoUrl || ''
                    });
                }
            });
        }
    }, [profile?.organizationId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!profile?.organizationId) return;
        setLoading(true);
        try {
            let finalLogoUrl = formData.logoUrl;
            if (logoFile) {
                finalLogoUrl = await OrganizationService.uploadLogo(profile.organizationId, logoFile);
            }

            await updateDoc(doc(db, 'organizations', profile.organizationId), {
                orgName: formData.orgName,
                address: formData.address,
                city: formData.city,
                pincode: formData.pincode,
                gstNumber: formData.gstNumber,
                logoUrl: finalLogoUrl,
                updatedAt: serverTimestamp()
            });
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Organization Updated',
                message: 'Your organization details have been successfully updated.',
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
                message: 'Failed to update organization details due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={2} maxWidth={600} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Typography variant="h5" mb={3}>Organization Details</Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Organization Name" name="orgName" value={formData.orgName} onChange={handleChange} />
                <TextField label="Address" name="address" multiline rows={2} value={formData.address} onChange={handleChange} />
                <TextField label="City" name="city" value={formData.city} onChange={handleChange} />
                <TextField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                <TextField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />

                <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>Update Logo</Typography>
                    <Button variant="outlined" component="label">
                        Choose File
                        <input type="file" hidden accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </Button>
                    {logoFile && <Typography variant="caption" ml={2}>{logoFile.name}</Typography>}
                    {!logoFile && formData.logoUrl && (
                        <Typography variant="caption" ml={2}>Current logo exists</Typography>
                    )}
                </Box>

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
