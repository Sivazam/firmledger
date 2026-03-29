import React, { useMemo, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Grid, TextField, Menu, MenuItem, Stack } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

export default function BalanceSheetPage() {
    const { parties } = usePartyStore();
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const balances = useMemo(() => {
        const filteredTxs = transactions.filter(tx => {
            const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
            return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
                   txDate.isBefore(dayjs(toDate).add(1, 'day'));
        });

        return parties.map(party => {
            let balance = 0;
            filteredTxs.forEach(tx => {
                if (tx.fromPartyId === party.id) balance += tx.amount;
                if (tx.toPartyId === party.id) balance -= tx.amount;
            });
            return { party, balance };
        }).filter(p => p.balance !== 0)
            .sort((a, b) => b.balance - a.balance);
    }, [parties, transactions]);

    const totalCredit = balances.filter(b => b.balance > 0).reduce((acc, curr) => acc + curr.balance, 0);
    const totalDebit = balances.filter(b => b.balance < 0).reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

    const handleExportPdf = async (isShare: boolean = false) => {
        if (balances.length === 0) return;
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Balance Sheet" 
                subtitle={`${fromDate} to ${toDate}`}
                headers={['Party Name', 'Code', 'Balance', 'Type']}
                rows={balances.map(b => [
                    b.party.name,
                    b.party.code,
                    (Math.abs(b.balance) / 100).toFixed(2),
                    b.balance > 0 ? 'Cr' : 'Dr'
                ])}
                organization={currentOrganization}
            />
        );
        
        const filename = `Balance_Sheet_${new Date().getTime()}.pdf`;
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
    };

    const handleExportExcel = (isShare: boolean = false) => {
        if (balances.length === 0) return;
        const headers = ['Party', 'Code', 'Balance', 'Type'];
        const csvData = balances.map(b => ({
            Party: b.party.name,
            Code: b.party.code,
            Balance: (Math.abs(b.balance) / 100).toFixed(2),
            Type: b.balance > 0 ? 'Cr' : 'Dr'
        }));
        ReportExportService.exportToCSV('Balance_Sheet', csvData, headers, isShare);
    };

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Balance Sheet</Typography>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating || balances.length === 0}
                    >
                        Download
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating || balances.length === 0}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                    <TextField 
                        label="From" 
                        type="date" 
                        fullWidth 
                        size="small" 
                        value={fromDate} 
                        onChange={e => { setFromDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} 
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }} 
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField 
                        label="To" 
                        type="date" 
                        fullWidth 
                        size="small" 
                        value={toDate} 
                        onChange={e => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} 
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }} 
                    />
                </Grid>
            </Grid>

            <Box display="flex" gap={4} mb={3}>
                <Box>
                    <Typography color="text.secondary">Total Payables (Credit)</Typography>
                    <AmountDisplay amount={totalCredit} variant="h6" color="success.main" />
                </Box>
                <Box>
                    <Typography color="text.secondary">Total Receivables (Debit)</Typography>
                    <AmountDisplay amount={totalDebit} variant="h6" color="error.main" />
                </Box>
            </Box>

            <Paper sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Party Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell align="right">Balance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {balances.map((b) => (
                            <TableRow key={b.party.id}>
                                <TableCell>{b.party.name}</TableCell>
                                <TableCell>{b.party.code}</TableCell>
                                <TableCell align="right">
                                    <AmountDisplay
                                        amount={Math.abs(b.balance)}
                                        color={b.balance > 0 ? 'success.main' : 'error.main'}
                                    />
                                    {b.balance > 0 ? ' (Cr)' : ' (Dr)'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {balances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No outstanding balances</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Menu
                anchorEl={downloadAnchor}
                open={Boolean(downloadAnchor)}
                onClose={() => setDownloadAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportExcel(); setDownloadAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPdf(); setDownloadAnchor(null); }}>PDF</MenuItem>
            </Menu>

            <Menu
                anchorEl={shareAnchor}
                open={Boolean(shareAnchor)}
                onClose={() => setShareAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportExcel(true); setShareAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPdf(true); setShareAnchor(null); }}>PDF</MenuItem>
            </Menu>
        </Box>
    );
}
