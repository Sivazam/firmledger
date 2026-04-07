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
import { formatDate, formatINR } from '../../utils/formatters';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { pdf } from '@react-pdf/renderer';
import ReceiptDocument from '../../components/pdf/ReceiptDocument';
import { useOrganizationStore } from '../../stores/organizationStore';
import ShareIcon from '@mui/icons-material/Share';
import type { Transaction } from '../../types/transaction.types';

export default function RecordTransactionPage() {
    const [loading, setLoading] = useState(false);
    const { profile } = useAuthStore();
    const { addTransactionLocal } = useTransactionStore();
    const { parties } = usePartyStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [resetKey, setResetKey] = useState(0);
    const [dialogConfig, setDialogConfig] = useState<{ 
        open: boolean, 
        title: string, 
        message: string, 
        variant: 'success' | 'error', 
        onConfirm: () => void,
        secondaryAction?: any
    }>({
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
                phoneNumber: data.phoneNumber || null,
                referenceNumber: data.referenceNumber || null,
                date: Timestamp.fromDate(data.date),
                fromPartyName,
                toPartyName,
                createdBy: profile.uid,
                createdBy_name: profile.displayName
            });

            addTransactionLocal(newTx);

            let generatedBlob: Blob | null = null;
            try {
                if (currentOrganization) {
                    generatedBlob = await pdf(<ReceiptDocument transaction={newTx} organization={currentOrganization} />).toBlob();
                }
            } catch (err) {
                console.error('Pre-generating PDF failed', err);
            }

            const handleShare = async () => {
                if (!currentOrganization) return;
                try {
                    const blob = generatedBlob || await pdf(<ReceiptDocument transaction={newTx} organization={currentOrganization} />).toBlob();
                    const file = new File([blob], `receipt_${newTx.slNo}.pdf`, { type: 'application/pdf' });
                    
                    if (navigator.share) {
                        await navigator.share({
                            files: [file],
                            title: `Receipt ${newTx.slNo}`,
                            text: `Please find the receipt ${newTx.slNo} attached for your reference.`
                        });
                    } else {
                        // Fallback: download
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `receipt_${newTx.slNo}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }
                } catch (err) {
                    console.error('Sharing failed', err);
                }
            };

            setDialogConfig({
                open: true,
                variant: 'success',
                title: 'Transaction Recorded',
                message: `Successfully recorded transaction ${newTx.slNo} for ${formatINR(data.amount)}.`,
                onConfirm: () => {
                    setDialogConfig(prev => ({ ...prev, open: false }));
                    setResetKey(prev => prev + 1);
                },
                secondaryAction: {
                    label: 'Share Receipt',
                    onClick: handleShare,
                    icon: <ShareIcon />,
                    color: 'primary'
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
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth={800} mx="auto">
            <TransactionForm key={resetKey} onSubmit={handleSubmit} isLoading={loading} />
            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                variant={dialogConfig.variant}
                onConfirm={dialogConfig.onConfirm}
                secondaryAction={dialogConfig.secondaryAction}
            />
        </Box>
    );
}
