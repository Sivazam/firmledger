import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, TextField } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionType } from '../../config/constants';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Stack } from '@mui/material';

export default function TradingReportPage() {
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

    const filtered = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
        return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
               txDate.isBefore(dayjs(toDate).add(1, 'day'));
    });

    const sales = filtered.filter(tx => tx.type === TransactionType.SI).reduce((sum, tx) => sum + tx.amount, 0);
    const salesReturn = filtered.filter(tx => tx.type === TransactionType.SR).reduce((sum, tx) => sum + tx.amount, 0);
    const purchases = filtered.filter(tx => tx.type === TransactionType.PI).reduce((sum, tx) => sum + tx.amount, 0);
    const purchaseReturn = filtered.filter(tx => tx.type === TransactionType.PR).reduce((sum, tx) => sum + tx.amount, 0);

    const netSales = sales - salesReturn;
    const netPurchases = purchases - purchaseReturn;
    const grossProfit = netSales - netPurchases;

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Trading Account</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => {
                            const headers = ['Debit_Particulars', 'Debit_Amount', 'Credit_Particulars', 'Credit_Amount'];
                            const rows = [
                                { Debit_Particulars: 'To Purchases', Debit_Amount: (purchases / 100).toFixed(2), Credit_Particulars: 'By Sales', Credit_Amount: (sales / 100).toFixed(2) },
                                { Debit_Particulars: 'Less: Purchase Return', Debit_Amount: (purchaseReturn / 100).toFixed(2), Credit_Particulars: 'Less: Sales Return', Credit_Amount: (salesReturn / 100).toFixed(2) },
                                { Debit_Particulars: 'Net Purchases', Debit_Amount: (netPurchases / 100).toFixed(2), Credit_Particulars: 'Net Sales', Credit_Amount: (netSales / 100).toFixed(2) },
                                { Debit_Particulars: 'Gross Profit c/o', Debit_Amount: (grossProfit / 100).toFixed(2), Credit_Particulars: '', Credit_Amount: '' }
                            ];
                            ReportExportService.exportToCSV('Trading_Account_Report', rows, headers);
                        }}
                    >
                        Excel (CSV)
                    </Button>
                    <PDFDownloadLink
                        document={
                            <ReportPDF 
                                title="Trading Account" 
                                subtitle={`${fromDate} to ${toDate}`}
                                headers={['Particulars (Dr)', 'Amount (Dr)', 'Particulars (Cr)', 'Amount (Cr)']}
                                rows={[
                                    ['To Purchases', (purchases / 100).toFixed(2), 'By Sales', (sales / 100).toFixed(2)],
                                    ['Less: Purchase Return', (purchaseReturn / 100).toFixed(2), 'Less: Sales Return', (salesReturn / 100).toFixed(2)],
                                    ['Net Purchases', (netPurchases / 100).toFixed(2), 'Net Sales', (netSales / 100).toFixed(2)],
                                    ['Gross Profit c/o', (grossProfit / 100).toFixed(2), '', '']
                                ]}
                                organization={currentOrganization}
                            />
                        }
                        fileName="Trading_Account_Report.pdf"
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
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Debit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Credit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>To Purchases</TableCell>
                            <TableCell align="right">{(purchases / 100).toFixed(2)}</TableCell>
                            <TableCell>By Sales</TableCell>
                            <TableCell align="right">{(sales / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Less: Purchase Return</TableCell>
                            <TableCell align="right">{(purchaseReturn / 100).toFixed(2)}</TableCell>
                            <TableCell>Less: Sales Return</TableCell>
                            <TableCell align="right">{(salesReturn / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Purchases</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{(netPurchases / 100).toFixed(2)}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Sales</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{(netSales / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Gross Profit c/o</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: grossProfit >= 0 ? 'success.main' : 'error.main' }}>
                                {(grossProfit / 100).toFixed(2)}
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
