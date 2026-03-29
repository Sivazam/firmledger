import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, TextField, Divider, Menu, MenuItem, Stack } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionType } from '../../config/constants';
import { usePartyStore } from '../../stores/partyStore';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

export default function PLReportPage() {
    const { transactions } = useTransactionStore();
    const { parties } = usePartyStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const filtered = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
        return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
               txDate.isBefore(dayjs(toDate).add(1, 'day'));
    });

    // Trading Account Logic
    const sales = filtered.filter(tx => tx.type === TransactionType.SI).reduce((sum, tx) => sum + tx.amount, 0);
    const salesReturn = filtered.filter(tx => tx.type === TransactionType.SR).reduce((sum, tx) => sum + tx.amount, 0);
    const purchases = filtered.filter(tx => tx.type === TransactionType.PI).reduce((sum, tx) => sum + tx.amount, 0);
    const purchaseReturn = filtered.filter(tx => tx.type === TransactionType.PR).reduce((sum, tx) => sum + tx.amount, 0);

    const netSales = sales - salesReturn;
    const netPurchases = purchases - purchaseReturn;
    const grossProfit = netSales - netPurchases;

    // P&L Logic: Sum of JV/CP/BP where category is EXPENSE or REVENUE (other than sales/purchase)
    // For now, let's just sum all transactions involving parties of type REVENUE or EXPENSE
    const expenses = filtered.reduce((sum, tx) => {
        const fromP = parties.find(p => p.id === tx.fromPartyId);
        const toP = parties.find(p => p.id === tx.toPartyId);
        
        let txExpense = 0;
        if (toP?.category === 'EXPENSE') txExpense += tx.amount;
        if (fromP?.category === 'EXPENSE') txExpense -= tx.amount; // Unusual but handled
        
        return sum + txExpense;
    }, 0);

    const indirectIncome = filtered.reduce((sum, tx) => {
        const fromP = parties.find(p => p.id === tx.fromPartyId);
        const toP = parties.find(p => p.id === tx.toPartyId);
        
        let txIncome = 0;
        if (toP?.category === 'REVENUE' && tx.type !== TransactionType.SI) txIncome += tx.amount;
        
        return sum + txIncome;
    }, 0);

    const netProfit = grossProfit + indirectIncome - expenses;

    const handleExportPdf = async (isShare: boolean = false) => {
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Profit & Loss Account" 
                subtitle={`${fromDate} to ${toDate}`}
                headers={['Particulars (Dr)', 'Amount (Dr)', 'Particulars (Cr)', 'Amount (Cr)']}
                rows={[
                    ['To Indirect Expenses', (expenses / 100).toFixed(2), 'By Gross Profit b/f', (grossProfit / 100).toFixed(2)],
                    ['', '', 'By Other Income', (indirectIncome / 100).toFixed(2)],
                    ['Net Profit', (netProfit / 100).toFixed(2), '', '']
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
        const headers = ['Particulars_Debit', 'Amount_Dr', 'Particulars_Credit', 'Amount_Cr'];
        const csvData = [
            { Particulars_Debit: 'To Indirect Expenses', Amount_Dr: (expenses / 100).toFixed(2), Particulars_Credit: 'By Gross Profit b/f', Amount_Cr: (grossProfit / 100).toFixed(2) },
            { Particulars_Debit: '', Amount_Dr: '', Particulars_Credit: 'By Other Income', Amount_Cr: (indirectIncome / 100).toFixed(2) },
            { Particulars_Debit: 'Net Profit', Amount_Dr: (netProfit / 100).toFixed(2), Particulars_Credit: '', Amount_Cr: '' }
        ];
        ReportExportService.exportToCSV('Profit_Loss', csvData, headers, isShare);
    };

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Profit & Loss Account</Typography>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating}
                    >
                        Download
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating}
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

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'secondary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expenses (Debit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Income (Credit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>To Indirect Expenses</TableCell>
                            <TableCell align="right">{(expenses / 100).toFixed(2)}</TableCell>
                            <TableCell>By Gross Profit b/f</TableCell>
                            <TableCell align="right">{(grossProfit / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell align="right"></TableCell>
                            <TableCell>By Other Income</TableCell>
                            <TableCell align="right">{(indirectIncome / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ '& td': { borderBottom: '2px solid', borderColor: 'divider' } }}>
                            <TableCell colSpan={4} sx={{ p: 0 }} />
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Profit</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: netProfit >= 0 ? 'success.main' : 'error.main' }}>
                                {(netProfit / 100).toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
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
