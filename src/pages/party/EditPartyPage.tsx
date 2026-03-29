import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import PartyForm from '../../components/party/PartyForm';
import type { PartyFormData } from '../../utils/validators';
import { PartyService } from '../../services/party.service';
import { useAuthStore } from '../../stores/authStore';
import { usePartyStore } from '../../stores/partyStore';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function EditPartyPage() {
    const { id } = useParams();
    const { parties, updatePartyLocal } = usePartyStore();
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const party = parties.find(p => p.id === id);

    if (!party) return <Typography>Party not found</Typography>;

    const handleSubmit = async (data: PartyFormData) => {
        if (!profile?.organizationId) return;

        const codeToCheck = data.code.toUpperCase();
        if (parties.some(p => p.id !== party.id && p.code === codeToCheck)) {
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Duplicate Party Code',
                message: `A party with code ${codeToCheck} already exists.`,
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
            return;
        }

        setLoading(true);
        try {
            const partyData = {
                ...data,
                fatherName: data.fatherName || '',
                gstNumber: data.gstNumber || '',
                aadharNumber: data.aadharNumber || '',
                panNumber: data.panNumber || '',
                openingBalance: Math.round(Math.abs(data.openingBalance || 0) * 100),
                code: data.code.toUpperCase()
            };
            await PartyService.updateParty(profile.organizationId, party.id, partyData);
            updatePartyLocal(party.id, partyData);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Party Updated',
                message: `Successfully updated ${partyData.name}'s details.`,
                onConfirm: () => {
                    setDialogConfig(prev => ({ ...prev, open: false }));
                    navigate(-1);
                }
            });
        } catch (err) {
            console.error(err);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Update Failed',
                message: 'Failed to update party due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth={600} mx="auto">
            <Typography variant="h5" mb={3}>Edit Party: {party.code}</Typography>
            <PartyForm initialData={party} onSubmit={handleSubmit} isLoading={loading} />
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
