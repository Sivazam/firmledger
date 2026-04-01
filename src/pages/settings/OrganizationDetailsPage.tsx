import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent, Divider } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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
    const [inviteNumber, setInviteNumber] = useState('');
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

    const isOrgOwner = profile?.uid === currentOrganization?.ownerId;

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
        if (!isOrgOwner) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!isOrgOwner || !profile?.organizationId) return;
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

    const handleInvite = () => {
        if (!isOrgOwner) return;
        if (!inviteNumber || inviteNumber.length < 10) {
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Invalid Number',
                message: 'Please enter a valid 10-digit WhatsApp number.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
            return;
        }
        
        const inviteLink = `${window.location.origin}/signup?invite=${profile?.organizationId}`;
        const message = `Hello! You've been invited to join ${formData.orgName || 'our organization'} on Viswa Ledger.\n\nPlease click the link below to sign up and join the organization:\n\n${inviteLink}`;
        const encodedMessage = encodeURIComponent(message);
        
        let formattedNumber = inviteNumber.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = `91${formattedNumber}`; // Default to India country code
        }
        
        window.open(`https://wa.me/${formattedNumber}?text=${encodedMessage}`, '_blank');
        setInviteNumber('');
    };

    return (
        <Box p={2} maxWidth={600} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Typography variant="h5" mb={3}>Organization Details</Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Organization Name" name="orgName" value={formData.orgName} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                <TextField label="Address" name="address" multiline rows={2} value={formData.address} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                <TextField label="City" name="city" value={formData.city} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                <TextField label="Pincode" name="pincode" inputMode="numeric" value={formData.pincode} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />
                <TextField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} slotProps={{ input: { readOnly: !isOrgOwner } }} />

                {isOrgOwner && (
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
                )}

                {isOrgOwner && (
                    <Button variant="contained" disabled={loading} onClick={handleSave} size="large">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </Box>

            {isOrgOwner && (
                <Box mt={6}>
                    <Divider sx={{ mb: 4 }} />
                    <Typography variant="h6" mb={2}>Invite Staff Member</Typography>
                    <Card variant="outlined" sx={{ bgcolor: '#F8FAFC', borderColor: 'divider' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Invite a colleague to access and manage your organization's ledger. They will receive a unique link via WhatsApp to join.
                            </Typography>
                            <Box display="flex" gap={2} alignItems="center" sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField 
                                    variant="outlined" 
                                    size="small" 
                                    label="WhatsApp Number" 
                                    placeholder="10-digit mobile number" 
                                    value={inviteNumber}
                                    onChange={(e) => setInviteNumber(e.target.value)}
                                    sx={{ flexGrow: 1, bgcolor: 'white', width: '100%' }}
                                    inputMode="numeric"
                                />
                                <Button 
                                    variant="contained" 
                                    color="success" 
                                    startIcon={<WhatsAppIcon />}
                                    onClick={handleInvite}
                                    sx={{ whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' } }}
                                >
                                    Send Invite
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}

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
