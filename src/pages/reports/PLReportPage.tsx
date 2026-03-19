import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, TextField, Divider } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { TransactionType } from '../../config/constants';
import { usePartyStore } from '../../stores/partyStore';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Stack } from '@mui/material';

export default function PLReportPage() {
    const { transactions } = useTransactionStore();
    const { parties } = usePartyStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

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

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Profit & Loss Account</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => {
                            const headers = ['Particulars_Debit', 'Amount_Dr', 'Particulars_Credit', 'Amount_Cr'];
                            const rows = [
                                { Particulars_Debit: 'To Indirect Expenses', Amount_Dr: (expenses / 100).toFixed(2), Particulars_Credit: 'By Gross Profit b/f', Amount_Cr: (grossProfit / 100).toFixed(2) },
                                { Particulars_Debit: '', Amount_Dr: '', Particulars_Credit: 'By Other Income', Amount_Cr: (indirectIncome / 100).toFixed(2) },
                                { Particulars_Debit: 'Net Profit', Amount_Dr: (netProfit / 100).toFixed(2), Particulars_Credit: '', Amount_Cr: '' }
                            ];
                            ReportExportService.exportToCSV('Profit_Loss_Report', rows, headers);
                        }}
                    >
                        Excel (CSV)
                    </Button>
                    <PDFDownloadLink
                        document={
                            <ReportPDF 
                                title="Profit & Loss Account" 
                                subtitle={`${fromDate} to ${toDate}`}
                                headers={['Particulars (Dr)', 'Amount (Dr)', 'Particulars (Cr)', 'Amount (Cr)']}
                                rows={[
                                    ['To Indirect Expenses', (expenses / 100).toFixed(2), 'By Gross Profit b/f', (grossProfit / 100).toFixed(2)],
                                    ['', '', 'By Other Income', (indirectIncome / 100).toFixed(2)],
                                    ['Net Profit', (netProfit / 100).toFixed(2), '', '']
                                ]}
                            />
                        }
                        fileName="Profit_Loss_Report.pdf"
                        style={{ textDecoration: 'none' }}
                    >
                        {({ loading }) => (
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<PictureAsPdfIcon />}
                                disabled={loading}
                            >
                                {loading ? '...' : 'PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </Stack>
            </Box>

            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                    <TextField label="From" type="date" fullWidth size="small" value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField label="To" type="date" fullWidth size="small" value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
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
        </Box>
    );
}
