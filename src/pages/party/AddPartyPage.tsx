import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import PartyForm from '../../components/party/PartyForm';
import type { PartyFormData } from '../../utils/validators';
import { PartyService } from '../../services/party.service';
import { useAuthStore } from '../../stores/authStore';
import { usePartyStore } from '../../stores/partyStore';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function AddPartyPage() {
    const [loading, setLoading] = useState(false);
    const { profile } = useAuthStore();
    const { parties, addPartyLocal } = usePartyStore();
    const navigate = useNavigate();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const handleSubmit = async (data: PartyFormData) => {
        if (!profile?.organizationId) return;

        const codeToCheck = data.code.toUpperCase();
        if (parties.some(p => p.code === codeToCheck)) {
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
                openingBalance: Math.round((data.openingBalance || 0) * 100),
                code: data.code.toUpperCase()
            };
            const newParty = await PartyService.addParty(profile.organizationId, partyData);
            addPartyLocal(newParty);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Party Saved',
                message: `Successfully added ${partyData.name} to the ledger.`,
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
                title: 'Save Failed',
                message: 'Failed to add party due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth={600} mx="auto">
            <Typography variant="h5" mb={3}>Add New Party</Typography>
            <PartyForm onSubmit={handleSubmit} isLoading={loading} />
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
