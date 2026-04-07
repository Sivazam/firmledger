import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import TransactionForm from '../../components/transaction/TransactionForm';
import type { TransactionFormData } from '../../utils/validators';
import { TransactionService } from '../../services/transaction.service';
import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { OrganizationService } from '../../services/organization.service';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function EditTransactionPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const { profile } = useAuthStore();
    const { transactions, updateTransactionLocal } = useTransactionStore();
    const { parties } = usePartyStore();
    const navigate = useNavigate();
    const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const transaction = transactions.find(t => t.id === id);

    if (!transaction) return <Typography>Transaction not found</Typography>;

    const initialData = {
        ...transaction,
        date: dayjs((transaction.date as any)?.toDate?.() || transaction.date).format('YYYY-MM-DD'),
        amount: transaction.amount / 100
    };

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

            const updateData = {
                ...data,
                phoneNumber: data.phoneNumber || null,
                referenceNumber: data.referenceNumber || null,
                date: Timestamp.fromDate(data.date),
                fromPartyName,
                toPartyName,
                // Preserve original creator — edits do NOT change who first recorded the transaction
                createdBy: transaction.createdBy,
                createdBy_name: transaction.createdBy_name,
            };

            await TransactionService.updateTransaction(profile.organizationId, transaction.id, updateData);
            updateTransactionLocal(transaction.id, updateData);
            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Transaction Updated',
                message: `Successfully updated transaction ${transaction.slNo}.`,
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
                message: 'Failed to update transaction due to a network error.',
                onConfirm: () => setDialogConfig(prev => ({ ...prev, open: false }))
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth={800} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Typography variant="h5" mb={3}>Edit Transaction {transaction.slNo}</Typography>
            <TransactionForm initialData={initialData} onSubmit={handleSubmit} isLoading={loading} />
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
