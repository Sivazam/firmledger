import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import TransactionForm from '../../components/transaction/TransactionForm';
import type { TransactionFormData } from '../../utils/validators';
import { TransactionService } from '../../services/transaction.service';
import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { OrganizationService } from '../../services/organization.service';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RecordTransactionPage() {
    const [loading, setLoading] = useState(false);
    const { profile } = useAuthStore();
    const { addTransactionLocal } = useTransactionStore();
    const { parties } = usePartyStore();
    const navigate = useNavigate();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const handleSubmit = async (data: TransactionFormData) => {
        if (!profile?.organizationId) return;
        setLoading(true);
        try {
            const org = await OrganizationService.getOrganization(profile.organizationId);
            if (!org) return;

            const fromPartyName = data.fromPartyId === org.id
                ? org.orgName
                : parties.find(p => p.id === data.fromPartyId)?.name || 'Unknown';

            const toPartyName = data.toPartyId === org.id
                ? org.orgName
                : parties.find(p => p.id === data.toPartyId)?.name || 'Unknown';

            const newTx = await TransactionService.addTransaction(profile.organizationId, {
                ...data,
                date: Timestamp.fromDate(data.date),
                fromPartyName,
                toPartyName,
                createdBy: profile.uid
            });

            addTransactionLocal(newTx);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Transaction Recorded',
                message: `Successfully recorded transaction for ₹${data.amount}.`,
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
                message: 'Failed to record transaction due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth={800} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Typography variant="h5" mb={3}>Record Transaction</Typography>
            <TransactionForm onSubmit={handleSubmit} isLoading={loading} />
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
