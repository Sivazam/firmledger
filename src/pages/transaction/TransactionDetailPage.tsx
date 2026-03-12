import React from 'react';
import { Box, Typography, Button, Paper, Divider, Chip, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../../stores/transactionStore';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import { usePDF } from '../../hooks/usePDF';
import ReceiptDocument from '../../components/pdf/ReceiptDocument';
import { useAuthStore } from '../../stores/authStore';
import { OrganizationService } from '../../services/organization.service';
import type { Organization } from '../../types/organization.types';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function TransactionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { transactions } = useTransactionStore();
    const { profile } = useAuthStore();
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [dialogConfig, setDialogConfig] = React.useState<{ open: boolean, title: string, message: string, variant: 'success' | 'error', onConfirm: () => void }>({
        open: false, title: '', message: '', variant: 'success', onConfirm: () => { }
    });

    const tx = transactions.find(t => t.id === id);

    if (!tx) return <Typography p={2}>Transaction not found</Typography>;

    const handleShare = async () => {
        if (!profile?.organizationId) return;
        try {
            const org = await OrganizationService.getOrganization(profile.organizationId);
            if (!org) return;
            const blob = await generatePDFBlob(<ReceiptDocument transaction={tx} organization={org} />);
            await sharePDF(blob, `Voucher-SL-${tx.slNo}.pdf`);
        } catch (err) {
            console.error(err);
            setDialogConfig({
                open: true,
                variant: 'error',
                title: 'PDF Generation Failed',
                message: 'Failed to generate PDF. Please try again later.',
                onConfirm: () => setDialogConfig((prev: any) => ({ ...prev, open: false }))
            });
        }
    };

    return (
        <Box maxWidth={800} mx="auto">
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5">Transaction SL-{tx.slNo}</Typography>
                    <Chip label={tx.type.toUpperCase().replace('_', ' ')} color="primary" />
                </Box>
                <Typography color="text.secondary" mb={3}>{formatDate(tx.date)}</Typography>

                <Divider sx={{ mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={2} mb={4}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">From:</Typography>
                        <Typography fontWeight="bold">{tx.fromPartyName}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">To:</Typography>
                        <Typography fontWeight="bold">{tx.toPartyName}</Typography>
                    </Box>
                    <Box>
                        <Typography color="text.secondary" gutterBottom>Description:</Typography>
                        <Typography>{tx.description}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mt={2} p={2} bgcolor="background.default" borderRadius={1}>
                        <Typography variant="h6">Amount</Typography>
                        <AmountDisplay amount={tx.amount} variant="h6" />
                    </Box>
                </Box>

                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                        fullWidth
                        onClick={handleShare}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate & Share PDF'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        fullWidth
                        onClick={() => navigate(`/transactions/edit/${tx.id}`)}
                    >
                        Edit
                    </Button>
                </Box>
            </Paper>

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
