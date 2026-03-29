import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Button, Menu, MenuItem, Stack } from '@mui/material';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionType } from '../../config/constants';
import dayjs from 'dayjs';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';

export default function MonthlyReportPage() {
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const data = useMemo(() => {
        const groups: Record<string, { credit: number, debit: number }> = {};

        transactions.forEach(tx => {
            const month = dayjs(tx.date.toMillis()).format('MMM YYYY');
            if (!groups[month]) groups[month] = { credit: 0, debit: 0 };

            switch (tx.type) {
                case TransactionType.CR:
                case TransactionType.BR:
                case TransactionType.SI:
                    groups[month].credit += (tx.amount / 100);
                    break;
                case TransactionType.CP:
                case TransactionType.BP:
                case TransactionType.PI:
                    groups[month].debit += (tx.amount / 100);
                    break;
            }
        });

        return Object.keys(groups).map(k => ({
            name: k,
            In: groups[k].credit,
            Out: groups[k].debit
        })).sort((a, b) => dayjs(a.name, 'MMM YYYY').valueOf() - dayjs(b.name, 'MMM YYYY').valueOf());
    }, [transactions]);

    const handleExportPdf = async (isShare: boolean = false) => {
        if (data.length === 0) return;
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Monthly Cash Flow Report" 
                subtitle="Monthly Inward vs Outward"
                headers={['Month', 'Cash In (₹)', 'Cash Out (₹)']}
                rows={data.map(d => [d.name, d.In.toFixed(2), d.Out.toFixed(2)])}
                organization={currentOrganization}
            />
        );
        
        const filename = `Monthly_Report_${new Date().getTime()}.pdf`;
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
        if (data.length === 0) return;
        const headers = ['Month', 'In', 'Out'];
        ReportExportService.exportToCSV('Monthly_Flow', data, headers, isShare);
    };

    return (
        <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button onClick={() => navigate(-1)}>&larr; Back</Button>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating || data.length === 0}
                    >
                        Download
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating || data.length === 0}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>
            <Typography variant="h5" mb={3}>Monthly Report</Typography>

            <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>Money In vs Money Out</Typography>
                {data.length > 0 ? (
                    <Box sx={{ height: 350, width: '100%', mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `₹${value}`} />
                                <Bar dataKey="In" fill="#2E7D32" />
                                <Bar dataKey="Out" fill="#C62828" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Typography textAlign="center" mt={10}>No data to chart</Typography>
                )}
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
