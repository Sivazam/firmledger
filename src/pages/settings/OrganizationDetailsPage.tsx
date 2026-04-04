import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Divider, Stack } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { OrganizationService } from '../../services/organization.service';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function OrganizationDetailsPage() {
    const { profile } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        orgName: '',
        address: '',
        city: '',
        pincode: '',
        gstNumber: '',
        logoUrl: '',
        ownerName: '',
        phone: ''
    });

    const [dialogConfig, setDialogConfig] = useState<{ 
        open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void 
    }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const isOrgOwner = profile?.uid === currentOrganization?.ownerId;

    useEffect(() => {
        if (profile?.organizationId) {
            OrganizationService.getOrganization(profile.organizationId).then(org => {
                if (org) {
                    setFormData(prev => ({
                        ...prev,
                        orgName: org.orgName,
                        address: org.address,
                        city: org.city,
                        pincode: org.pincode,
                        gstNumber: org.gstNumber || '',
                        logoUrl: org.logoUrl || '',
                        ownerName: profile?.displayName || '',
                        phone: profile?.phone || ''
                    }));
                }
            });
        }
    }, [profile?.organizationId, profile?.displayName, profile?.phone]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isOrgOwner) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!isOrgOwner || !profile?.organizationId || !profile?.uid) return;
        setLoading(true);
        try {
            let finalLogoUrl = formData.logoUrl;
            if (logoFile) {
                finalLogoUrl = await OrganizationService.uploadLogo(profile.organizationId, logoFile);
            }

            // 1. Update Organization
            await updateDoc(doc(db, 'organizations', profile.organizationId), {
                orgName: formData.orgName,
                address: formData.address,
                city: formData.city,
                pincode: formData.pincode,
                gstNumber: formData.gstNumber,
                logoUrl: finalLogoUrl,
                updatedAt: serverTimestamp()
            });

            // 2. Update Owner Profile (Phone and Name)
            await updateDoc(doc(db, 'users', profile.uid), {
                displayName: formData.ownerName,
                phone: formData.phone,
                updatedAt: serverTimestamp()
            });

            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Details Updated',
                message: 'Organization and Owner contact details have been successfully updated.',
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
                message: 'An error occurred while saving details.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={2} maxWidth={650} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            
            <Typography variant="h5" fontWeight="800" mb={3}>Organization & Profile</Typography>

            <Box display="flex" flexDirection="column" gap={3}>
                {/* Firm Section */}
                <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" mb={2} color="primary">Firm Details</Typography>
                        <Stack spacing={2.5}>
                            <TextField label="Organization Name" name="orgName" fullWidth size="small" value={formData.orgName} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                            <TextField label="Address" name="address" fullWidth size="small" multiline rows={2} value={formData.address} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                            <Box display="flex" gap={2}>
                                <TextField label="City" name="city" fullWidth size="small" value={formData.city} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                                <TextField label="Pincode" name="pincode" fullWidth size="small" inputMode="numeric" value={formData.pincode} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                            </Box>
                            <TextField label="GST Number" name="gstNumber" fullWidth size="small" value={formData.gstNumber} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                        </Stack>
                    </CardContent>
                </Card>

                {/* Owner Section */}
                <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" mb={2} color="primary">Owner Contact Details</Typography>
                        <Stack spacing={2.5}>
                            <TextField label="Owner Name" name="ownerName" fullWidth size="small" value={formData.ownerName} disabled={true} helperText="Primary account identity (Read-only)" />
                            <TextField label="Phone / Mobile Number" name="phone" fullWidth size="small" value={formData.phone} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} helperText="Shared on reports and invoices" />
                        </Stack>
                    </CardContent>
                </Card>

                {isOrgOwner && (
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600" mb={1.5}>Firm Logo</Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Button variant="outlined" component="label" sx={{ fontWeight: 'bold' }}>
                                Choose File
                                <input type="file" hidden accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                            </Button>
                            {logoFile ? (
                                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>{logoFile.name}</Typography>
                            ) : formData.logoUrl ? (
                                <Typography variant="caption" color="text.disabled">Current logo uploaded</Typography>
                            ) : null}
                        </Box>
                    </Box>
                )}

                {isOrgOwner && (
                    <Button 
                        variant="contained" 
                        disabled={loading} 
                        onClick={handleSave} 
                        size="large"
                        sx={{ fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                    >
                        {loading ? 'Saving Changes...' : 'Save All Details'}
                    </Button>
                )}
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
