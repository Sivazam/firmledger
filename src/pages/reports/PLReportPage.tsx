import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, TextField, Menu, MenuItem, Stack } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import { usePartyStore } from '../../stores/partyStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionType } from '../../config/constants';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import type { Party } from '../../types/party.types';

export default function PLReportPage() {
    const { transactions, closingStock, setClosingStock } = useTransactionStore();
    const { parties } = usePartyStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);
    const [closingStockInput, setClosingStockInput] = useState<string>(closingStock ? (closingStock / 100).toString() : '');

    const filtered = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
        return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
               txDate.isBefore(dayjs(toDate).add(1, 'day'));
    });

    // --- 1. RE-CALCULATE TRADING ACCOUNT (for Gross Profit) ---
    const sales = filtered.filter(tx => tx.type === TransactionType.SI).reduce((sum, tx) => sum + tx.amount, 0);
    const salesReturn = filtered.filter(tx => tx.type === TransactionType.SR).reduce((sum, tx) => sum + tx.amount, 0);
    const purchases = filtered.filter(tx => tx.type === TransactionType.PI).reduce((sum, tx) => sum + tx.amount, 0);
    const purchaseReturn = filtered.filter(tx => tx.type === TransactionType.PR).reduce((sum, tx) => sum + tx.amount, 0);

    const netSales = sales - salesReturn;
    const netPurchases = purchases - purchaseReturn;

    const tradingParties = parties.filter(p => p.category === 'Trading');
    const tradingDeval = tradingParties.map((p: Party) => {
        let netChange = 0;
        filtered.forEach(tx => {
            if (tx.toPartyId === p.id) netChange += tx.amount;
            if (tx.fromPartyId === p.id) netChange -= tx.amount;
        });
        return { name: p.name, balance: netChange };
    });
    const totalTradingDebits = tradingDeval.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
    const totalTradingCredits = tradingDeval.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);

    const grossProfit = (netSales + (closingStock || 0) + totalTradingCredits) - (netPurchases + totalTradingDebits);

    // --- 2. CALCULATE P&L ACCOUNT ---
    const plParties = parties.filter(p => p.category === 'P & L');
    const plDeval = plParties.map((p: Party) => {
        let netChange = 0;
        filtered.forEach(tx => {
            if (tx.toPartyId === p.id) netChange += tx.amount;
            if (tx.fromPartyId === p.id) netChange -= tx.amount;
        });
        return { name: p.name, balance: netChange };
    });

    const plDebits = plDeval.filter(p => p.balance > 0);
    const plCredits = plDeval.filter(p => p.balance < 0);

    const totalPLDebits = plDebits.reduce((sum, p) => sum + p.balance, 0);
    const totalPLCredits = plCredits.reduce((sum, p) => sum + Math.abs(p.balance), 0);

    const netProfit = grossProfit + totalPLCredits - totalPLDebits;

    const handleExportPdf = async (isShare: boolean = false) => {
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Profit & Loss Account" 
                subtitle={`${fromDate} to ${toDate}`}
                headers={['Particulars (Dr)', 'Amount (Dr)', 'Particulars (Cr)', 'Amount (Cr)']}
                rows={[
                    ['To Gross Loss b/f', grossProfit < 0 ? (Math.abs(grossProfit) / 100).toFixed(2) : '-', 'By Gross Profit b/f', grossProfit >= 0 ? (grossProfit / 100).toFixed(2) : '-'],
                    ...plDebits.map(p => [`To ${p.name}`, (p.balance / 100).toFixed(2), '', '']),
                    ...plCredits.map(p => ['', '', `By ${p.name}`, (Math.abs(p.balance) / 100).toFixed(2)]),
                    ['Net Profit', netProfit >= 0 ? (netProfit / 100).toFixed(2) : '-', 'Net Loss', netProfit < 0 ? (Math.abs(netProfit) / 100).toFixed(2) : '-']
                ]}
                organization={currentOrganization}
            />
        );
        
        const filename = `Profit_Loss_${new Date().getTime()}.pdf`;
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
        const headers = ['Debit_Particulars', 'Debit_Amount', 'Credit_Particulars', 'Credit_Amount'];
        const csvData = [
            { Debit_Particulars: 'To Gross Loss b/f', Debit_Amount: grossProfit < 0 ? (Math.abs(grossProfit) / 100).toFixed(2) : '-', Credit_Particulars: 'By Gross Profit b/f', Credit_Amount: grossProfit >= 0 ? (grossProfit / 100).toFixed(2) : '-' },
            ...plDebits.map(p => ({ Debit_Particulars: `To ${p.name}`, Debit_Amount: (p.balance / 100).toFixed(2), Credit_Particulars: '', Credit_Amount: '' })),
            ...plCredits.map(p => ({ Debit_Particulars: '', Debit_Amount: '', Credit_Particulars: `By ${p.name}`, Credit_Amount: (Math.abs(p.balance) / 100).toFixed(2) })),
            { Debit_Particulars: 'Net Profit', Debit_Amount: netProfit >= 0 ? (netProfit / 100).toFixed(2) : '-', Credit_Particulars: 'Net Loss', Credit_Amount: netProfit < 0 ? (Math.abs(netProfit) / 100).toFixed(2) : '-' }
        ];
        ReportExportService.exportToCSV('Profit_Loss', csvData, headers, isShare);
    };

    if (closingStock === null) {
        return (
            <Box p={3} maxWidth={400} mx="auto" mt={5}>
                <Typography variant="h5" mb={2}>Closing Stock</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Please enter the closing stock value to generate the P&L report.
                </Typography>
                <TextField
                    fullWidth
                    label="Closing Stock Value (₹)"
                    type="number"
                    sx={{ mb: 2 }}
                    value={closingStockInput}
                    onChange={e => setClosingStockInput(e.target.value)}
                    autoFocus
                />
                <Stack direction="row" spacing={2} mt={3}>
                    <Button variant="outlined" onClick={() => navigate(-1)} fullWidth>Go Back</Button>
                    <Button 
                        variant="contained" 
                        onClick={() => setClosingStock(Math.round(Number(closingStockInput) * 100) || 0)} 
                        fullWidth
                    >
                        View Report
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box p={{ xs: 1, sm: 2 }}>
            <Box display="flex" alignItems="center" mb={1.5} gap={1} flexWrap="wrap">
                <Button size="small" onClick={() => navigate(-1)}>&larr; Back</Button>
                <Button variant="outlined" size="small" onClick={() => setClosingStock(null)}>Change Closing Stock</Button>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Typography variant="h6" fontWeight="bold">Profit & Loss Account</Typography>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Download</Box>
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Share</Box>
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

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'secondary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Dr)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Cr)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>{grossProfit < 0 ? 'To Gross Loss b/f' : ''}</TableCell>
                            <TableCell align="right">{grossProfit < 0 ? (Math.abs(grossProfit) / 100).toFixed(2) : ''}</TableCell>
                            <TableCell>{grossProfit >= 0 ? 'By Gross Profit b/f' : ''}</TableCell>
                            <TableCell align="right">{grossProfit >= 0 ? (grossProfit / 100).toFixed(2) : ''}</TableCell>
                        </TableRow>
                        
                        {/* P&L Category Items */}
                        {plDebits.map((p, i) => (
                            <TableRow key={`dr-${i}`}>
                                <TableCell>To {p.name}</TableCell>
                                <TableCell align="right">{(p.balance / 100).toFixed(2)}</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        ))}
                        {plCredits.map((p, i) => (
                            <TableRow key={`cr-${i}`}>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell>By {p.name}</TableCell>
                                <TableCell align="right">{(Math.abs(p.balance) / 100).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}

                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{netProfit >= 0 ? 'Net Profit' : ''}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {netProfit >= 0 ? (netProfit / 100).toFixed(2) : ''}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{netProfit < 0 ? 'Net Loss' : ''}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                {netProfit < 0 ? (Math.abs(netProfit) / 100).toFixed(2) : ''}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

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
