import React, { useMemo, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Grid, TextField, Menu, MenuItem, Stack, TableContainer } from '@mui/material';
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
import { TransactionType } from '../../config/constants';
import type { Party } from '../../types/party.types';

export default function BalanceSheetPage() {
    const { parties } = usePartyStore();
    const { transactions, closingStock, setClosingStock } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);
    const [closingStockInput, setClosingStockInput] = useState<string>(closingStock ? (closingStock / 100).toString() : '');

    const reportData = useMemo(() => {
        const end = dayjs(toDate).endOf('day');
        const filteredTxs = transactions.filter(tx => {
            const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
            return !txDate.isAfter(end);
        });

        // 1. Calculate Net Profit (sequential: Trading -> P&L)
        // Trading Calculation
        const sales = filteredTxs.filter(tx => tx.type === TransactionType.SI).reduce((sum, tx) => sum + tx.amount, 0);
        const salesReturn = filteredTxs.filter(tx => tx.type === TransactionType.SR).reduce((sum, tx) => sum + tx.amount, 0);
        const purchases = filteredTxs.filter(tx => tx.type === TransactionType.PI).reduce((sum, tx) => sum + tx.amount, 0);
        const purchaseReturn = filteredTxs.filter(tx => tx.type === TransactionType.PR).reduce((sum, tx) => sum + tx.amount, 0);

        const netSales = sales - salesReturn;
        const netPurchases = purchases - purchaseReturn;

        const tradingParties = parties.filter(p => p.category === 'Trading');
        const tradingDeval = tradingParties.map(p => {
            const staticOpening = p.balanceType === 'Debit' ? (p.openingBalance || 0) : -(p.openingBalance || 0);
            let totalDebit = 0; let totalCredit = 0;
            filteredTxs.forEach(tx => {
                if (tx.toPartyId === p.id) totalDebit += tx.amount;
                if (tx.fromPartyId === p.id) totalCredit += tx.amount;
            });
            return { balance: staticOpening + totalDebit - totalCredit };
        });
        const totalTradingDebits = tradingDeval.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
        const totalTradingCredits = tradingDeval.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);

        const grossProfit = (netSales + (closingStock || 0) + totalTradingCredits) - (netPurchases + totalTradingDebits);

        // P&L Calculation
        const plParties = parties.filter(p => p.category === 'P & L');
        const plDeval = plParties.map(p => {
            const staticOpening = p.balanceType === 'Debit' ? (p.openingBalance || 0) : -(p.openingBalance || 0);
            let totalDebit = 0; let totalCredit = 0;
            filteredTxs.forEach(tx => {
                if (tx.toPartyId === p.id) totalDebit += tx.amount;
                if (tx.fromPartyId === p.id) totalCredit += tx.amount;
            });
            return { balance: staticOpening + totalDebit - totalCredit };
        });
        const totalPLDebits = plDeval.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
        const totalPLCredits = plDeval.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);

        const netProfit = grossProfit + totalPLCredits - totalPLDebits;

        // 2. Balance Sheet Items
        // Categories to include in Balance Sheet: Balance Sheet, CASH, BANK, CUSTOMER, SUPPLIER
        const bsCategories = ['Balance Sheet', 'CASH', 'BANK', 'CUSTOMER', 'SUPPLIER'];
        const bsParties = parties.filter(p => bsCategories.includes(p.category));
        
        const partyBalances = bsParties.map(party => {
            const staticOpening = party.balanceType === 'Debit' ? (party.openingBalance || 0) : -(party.openingBalance || 0);
            let totalDebit = 0;
            let totalCredit = 0;
            filteredTxs.forEach(tx => {
                if (tx.toPartyId === party.id) totalDebit += tx.amount;
                if (tx.fromPartyId === party.id) totalCredit += tx.amount;
            });
            return { name: party.name, balance: staticOpening + totalDebit - totalCredit };
        }).filter(p => p.balance !== 0);

        const assets = partyBalances.filter(p => p.balance > 0);
        const liabilities = partyBalances.filter(p => p.balance < 0);

        return { netProfit, assets, liabilities };
    }, [parties, transactions, toDate, closingStock]);

    const totalAssets = reportData.assets.reduce((acc, curr) => acc + curr.balance, 0) + (closingStock || 0);
    const totalLiabilities = reportData.liabilities.reduce((acc, curr) => acc + Math.abs(curr.balance), 0) + (reportData.netProfit > 0 ? reportData.netProfit : 0);
    
    // Adjusted assets if net loss
    const finalAssets = totalAssets + (reportData.netProfit < 0 ? Math.abs(reportData.netProfit) : 0);

    const handleExportPdf = async (isShare: boolean = false) => {
        const rows: any[] = [
            ['Capital / Net Profit', reportData.netProfit > 0 ? (reportData.netProfit / 100).toFixed(2) : '-', 'Closing Stock', (Math.abs(closingStock || 0) / 100).toFixed(2)],
            ...Array.from({ length: Math.max(reportData.liabilities.length, reportData.assets.length) }).map((_, i) => [
                reportData.liabilities[i]?.name || '',
                reportData.liabilities[i] ? (Math.abs(reportData.liabilities[i].balance) / 100).toFixed(2) : '',
                reportData.assets[i]?.name || '',
                reportData.assets[i] ? (reportData.assets[i].balance / 100).toFixed(2) : ''
            ])
        ];

        if (reportData.netProfit < 0) {
            rows.push(['', '', 'Net Loss', (Math.abs(reportData.netProfit) / 100).toFixed(2)]);
        }

        rows.push(['TOTAL', (finalAssets / 100).toFixed(2), 'TOTAL', (finalAssets / 100).toFixed(2)]);

        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Balance Sheet" 
                subtitle={`As of ${dayjs(toDate).format('DD/MM/YYYY')}`}
                headers={['Liabilities', 'Amount', 'Assets', 'Amount']}
                rows={rows}
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
        const headers = ['Liabilities', 'L_Amount', 'Assets', 'A_Amount'];
        const csvData: any[] = [
            { Liabilities: 'Capital / Net Profit', L_Amount: reportData.netProfit > 0 ? (reportData.netProfit / 100).toFixed(2) : '-', Assets: 'Closing Stock', A_Amount: (Math.abs(closingStock || 0) / 100).toFixed(2) },
            ...Array.from({ length: Math.max(reportData.liabilities.length, reportData.assets.length) }).map((_, i) => ({
                Liabilities: reportData.liabilities[i]?.name || '',
                L_Amount: reportData.liabilities[i] ? (Math.abs(reportData.liabilities[i].balance) / 100).toFixed(2) : '',
                Assets: reportData.assets[i]?.name || '',
                A_Amount: reportData.assets[i] ? (reportData.assets[i].balance / 100).toFixed(2) : ''
            }))
        ];

        if (reportData.netProfit < 0) {
            csvData.push({ Liabilities: '', L_Amount: '', Assets: 'Net Loss', A_Amount: (Math.abs(reportData.netProfit) / 100).toFixed(2) });
        }

        csvData.push({ Liabilities: 'TOTAL', L_Amount: (finalAssets / 100).toFixed(2), Assets: 'TOTAL', A_Amount: (finalAssets / 100).toFixed(2) });

        ReportExportService.exportToCSV('Balance_Sheet', csvData, headers, isShare);
    };

    if (closingStock === null) {
        return (
            <Box p={3} maxWidth={400} mx="auto" mt={5}>
                <Typography variant="h5" mb={2}>Closing Stock</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Please enter the closing stock value to generate the Balance Sheet.
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
                <Typography variant="h6" fontWeight="bold">Balance Sheet</Typography>
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
                <Grid size={{ xs: 12 }}>
                    <TextField 
                        label="As of Date" 
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
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'secondary.dark' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Liabilities</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assets</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Capital / Net Profit</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {reportData.netProfit > 0 ? (reportData.netProfit / 100).toFixed(2) : '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Closing Stock</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {(Math.abs(closingStock || 0) / 100).toFixed(2)}
                            </TableCell>
                        </TableRow>
                        
                        {/* Map liabilities and assets side by side */}
                        {Array.from({ length: Math.max(reportData.liabilities.length, reportData.assets.length) }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>{reportData.liabilities[i]?.name || ''}</TableCell>
                                <TableCell align="right">
                                    {reportData.liabilities[i] ? (Math.abs(reportData.liabilities[i].balance) / 100).toFixed(2) : ''}
                                </TableCell>
                                <TableCell>{reportData.assets[i]?.name || ''}</TableCell>
                                <TableCell align="right">
                                    {reportData.assets[i] ? (reportData.assets[i].balance / 100).toFixed(2) : ''}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Net Loss handling */}
                        {reportData.netProfit < 0 && (
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>Net Loss</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                    {(Math.abs(reportData.netProfit) / 100).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )}

                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {(finalAssets / 100).toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {(finalAssets / 100).toFixed(2)}
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
