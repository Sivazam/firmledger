import React, { useEffect, useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionService } from '../../services/transaction.service';
import TransactionCard from '../../components/transaction/TransactionCard';
import TransactionFilters from '../../components/transaction/TransactionFilters';
import FloatingActionButton from '../../components/common/FloatingActionButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { usePDF } from '../../hooks/usePDF';
import { pdf } from '@react-pdf/renderer';
import ReportDocument from '../../components/pdf/ReportDocument';
import { TRANSACTION_TYPE_LABELS } from '../../config/constants';
import type { Transaction } from '../../types/transaction.types';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Button, IconButton, Menu, MenuItem, Divider, Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { formatINR } from '../../utils/formatters';
import { Chip } from '@mui/material';

export default function TransactionsListPage() {
    const { transactions, fetchTransactions, loading, initialized } = useTransactionStore();
    const { profile } = useAuthStore();
    const { currentOrganization, orgMemberCount } = useOrganizationStore();
    const { sharePDF } = usePDF();
    // Show attribution only when the org has more than 1 approved member
    const isMultiUser = orgMemberCount > 1;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [fromDate, setFromDate] = useState(() => sessionStorage.getItem('tx_fromDate') || dayjs.tz().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(() => sessionStorage.getItem('tx_toDate') || dayjs.tz().format('YYYY-MM-DD'));
    const [showReport, setShowReport] = useState(false);
    
    useEffect(() => {
        sessionStorage.setItem('tx_fromDate', fromDate);
        sessionStorage.setItem('tx_toDate', toDate);
    }, [fromDate, toDate]);
    
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    // Delete state
    const { removeTransactionLocal } = useTransactionStore();
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filteredTransactions = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs.tz((tx.date as any).toDate()) : dayjs.tz(tx.date as any);
        const start = dayjs.tz(fromDate).startOf('day');
        const end = dayjs.tz(toDate).endOf('day');
        const isWithinDate = (txDate.isSame(start, 'day') || txDate.isAfter(start)) && 
                             (txDate.isSame(end, 'day') || txDate.isBefore(end));
        
        const matchSearch = tx.slNo.toString().includes(searchTerm) ||
            tx.fromPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.toPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = selectedType ? tx.type === selectedType : true;
        
        return isWithinDate && matchSearch && matchType;
    });

    // First-time swipe guide
    const [showSwipeGuide, setShowSwipeGuide] = useState(false);
    useEffect(() => {
        const seen = localStorage.getItem('swipe_delete_guide_seen');
        if (!seen && filteredTransactions.length > 0) {
            const timer = setTimeout(() => {
                setShowSwipeGuide(true);
                localStorage.setItem('swipe_delete_guide_seen', '1');
            }, 1000); // 1 second delay so they see it after load
            return () => clearTimeout(timer);
        }
    }, [filteredTransactions.length]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || !profile?.organizationId) return;
        setDeleting(true);
        try {
            await TransactionService.deleteTransaction(profile.organizationId, deleteTarget.id);
            removeTransactionLocal(deleteTarget.id);
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };
    
    const navigate = useNavigate();

    useEffect(() => {
        if (profile?.organizationId && !initialized) {
            fetchTransactions(profile.organizationId);
        }
    }, [profile?.organizationId, initialized, fetchTransactions]);

    const handleExportExcel = async (isShare: boolean = false) => {
        if (filteredTransactions.length === 0) return;
        
        const headers = isMultiUser
            ? ['Txn No', 'Date', 'Type', 'From Party', 'To Party', 'Created By', 'Amount', 'Ref No', 'Phone', 'Description']
            : ['Txn No', 'Date', 'Type', 'From Party', 'To Party', 'Amount', 'Ref No', 'Phone', 'Description'];
        const rows = filteredTransactions.map(tx => {
            const date = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()).format('DD/MM/YYYY') : dayjs(tx.date as any).format('DD/MM/YYYY');
            const base = [
                tx.slNo,
                date,
                TRANSACTION_TYPE_LABELS[tx.type] || tx.type,
                tx.fromPartyName,
                tx.toPartyName,
            ];
            if (isMultiUser) base.push(tx.createdBy_name || '-');
            base.push(
                tx.amount / 100, 
                tx.referenceNumber || '-', 
                tx.phoneNumber || '-', 
                tx.description.replace(/,/g, ' ')
            );
            return base;
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `Transactions_${fromDate}_to_${toDate}.csv`;

        const file = new File([blob], filename, { type: 'text/csv' });
        
        if (isShare && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ 
                    files: [file], 
                    title: 'Transactions Export',
                    text: 'Please find the exported transactions document attached.'
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleExportPDF = async (isShare: boolean = false) => {
        if (filteredTransactions.length === 0) return;
        try {
            const dateRange = `${dayjs(fromDate).format('DD/MM/YYYY')} - ${dayjs(toDate).format('DD/MM/YYYY')}`;
            const docText = (
                <ReportDocument 
                    title="Transactions Report" 
                    transactions={filteredTransactions} 
                    organization={currentOrganization}
                    dateRange={dateRange}
                    isMultiUser={isMultiUser}
                />
            );
            const blob = await pdf(docText).toBlob();
            const filename = `Transactions_${fromDate}_to_${toDate}.pdf`;

            if (isShare) {
                await sharePDF(blob, filename);
            } else {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('PDF export failed', err);
        }
    };

    return (
        <Box>
            <TransactionFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                onGenerateReport={() => setShowReport(true)}
                hasTransactions={filteredTransactions.length > 0}
            />

            {showReport && (
                <Box mb={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Button 
                                startIcon={<ArrowBackIcon />} 
                                size="small"
                                onClick={() => setShowReport(false)}
                                sx={{ fontWeight: 'bold' }}
                            >
                                Back
                            </Button>
                            <Typography variant="subtitle1" fontWeight="bold">Report Preview</Typography>
                        </Box>

                        {filteredTransactions.length > 0 && (
                            <Stack direction="row" spacing={1}>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={(e) => setDownloadAnchor(e.currentTarget)}
                                >
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Download</Box>
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    color="secondary"
                                    startIcon={<ShareIcon />}
                                    onClick={(e) => setShareAnchor(e.currentTarget)}
                                >
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Share</Box>
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Box>
            )}

            {loading ? (
                <Typography textAlign="center">Loading transactions...</Typography>
            ) : showReport ? (
                <TableContainer component={Paper} sx={{ mb: 4, overflowX: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>From</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>To</TableCell>
                                {isMultiUser && <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>By</TableCell>}
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="right">Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Note</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTransactions.map((tx) => (
                                <TableRow key={tx.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: 'primary.main' }}>
                                        {tx.slNo}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()).format('DD/MM') : dayjs(tx.date as any).format('DD/MM')}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</TableCell>
                                    <TableCell sx={{ minWidth: 100 }}>{tx.fromPartyName}</TableCell>
                                    <TableCell sx={{ minWidth: 100 }}>{tx.toPartyName}</TableCell>
                                    {isMultiUser && (
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {tx.createdBy_name ? (
                                                <Chip 
                                                    label={tx.createdBy_name} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color={tx.createdBy === currentOrganization?.ownerId ? "primary" : "secondary"}
                                                    sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                                                />
                                            ) : '-'}
                                        </TableCell>
                                    )}
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatINR(tx.amount)}</TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>{tx.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                    <TransactionCard 
                        key={tx.id} 
                        tx={tx} 
                        isMultiUser={isMultiUser} 
                        ownerId={currentOrganization?.ownerId}
                        onDelete={(t) => setDeleteTarget(t)}
                    />
                ))
            ) : (
                <Typography textAlign="center" color="text.secondary" mt={4}>
                    No transactions found.
                </Typography>
            )}

            <Menu
                anchorEl={downloadAnchor}
                open={Boolean(downloadAnchor)}
                onClose={() => setDownloadAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportExcel(); setDownloadAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPDF(); setDownloadAnchor(null); }}>PDF</MenuItem>
            </Menu>

            <Menu
                anchorEl={shareAnchor}
                open={Boolean(shareAnchor)}
                onClose={() => setShareAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportExcel(true); setShareAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPDF(true); setShareAnchor(null); }}>PDF</MenuItem>
            </Menu>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Transaction"
                message={deleteTarget ? `Are you sure you want to permanently delete transaction SL-${deleteTarget.slNo}? This action cannot be undone.` : ''}
                variant="confirm"
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* First-time swipe guide */}
            <Snackbar
                open={showSwipeGuide}
                autoHideDuration={6000}
                onClose={() => setShowSwipeGuide(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: { xs: 80, sm: 24 }, zIndex: 9999 }} // Raise above bottom nav
            >
                <Alert
                    severity="info"
                    variant="filled"
                    onClose={() => setShowSwipeGuide(false)}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    👈 Swipe left on any transaction to delete it
                </Alert>
            </Snackbar>
        </Box>
    );
}
