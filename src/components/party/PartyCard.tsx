import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Party } from '../../types/party.types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PartyService } from '../../services/party.service';
import { usePartyStore } from '../../stores/partyStore';
import ConfirmDialog from './../common/ConfirmDialog';

export default function PartyCard({ party }: { party: Party }) {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const { removePartyLocal } = usePartyStore();

    const [isDeleting, setIsDeleting] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error' | 'confirm', onConfirm: () => void, onCancel?: () => void }>({
        open: false, title: '', message: '', variant: 'confirm', onConfirm: () => { }
    });

    const handleDeleteClick = () => {
        setDialogConfig({
            open: true,
            variant: 'confirm',
            title: 'Delete Party?',
            message: `Are you sure you want to delete ${party.name} (${party.code})? This action cannot be undone.`,
            onConfirm: handleConfirmDelete,
            onCancel: () => setDialogConfig(prev => ({ ...prev, open: false }))
        });
    };

    const handleConfirmDelete = async () => {
        if (!profile?.organizationId) return;
        setIsDeleting(true);
        setDialogConfig(prev => ({ ...prev, open: false })); // Close confirm dialog
        try {
            await PartyService.deleteParty(profile.organizationId, party.id);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Success',
                message: 'Party deleted successfully.',
                onConfirm: handleCloseSuccess
            });
        } catch (error) {
            console.error("Failed to delete party:", error);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'Deletion Failed',
                message: 'Failed to delete party. Please try again.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseSuccess = () => {
        setDialogConfig(prev => ({ ...prev, open: false }));
        removePartyLocal(party.id);
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h6" color="primary">{party.name}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {party.code} • {party.town}
                        </Typography>
                        <Typography variant="body2">
                            Phone: {party.phoneNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                            Opening Balance: {party.openingBalance / 100} ({party.balanceType})
                        </Typography>
                    </Box>
                    <Box display="flex">
                        <IconButton onClick={() => navigate(`/parties/edit/${party.id}`)} color="primary">
                            <EditIcon />
                        </IconButton>
                        <IconButton onClick={handleDeleteClick} color="error" disabled={isDeleting}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Box>
            </CardContent>

            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                variant={dialogConfig.variant as any}
                onConfirm={dialogConfig.onConfirm}
                onCancel={dialogConfig.onCancel}
            />
        </Card>
    );
}
