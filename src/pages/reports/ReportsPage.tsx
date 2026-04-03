import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BalanceIcon from '@mui/icons-material/Balance';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';

const reports = [
    { title: 'Ledger', description: 'Party-wise transaction ledger', path: '/reports/ledger', icon: ReceiptLongIcon, color: '#1565c0', bg: 'rgba(21, 101, 192, 0.1)' },
    { title: 'Trading Account', description: 'Gross profit/loss calculation', path: '/reports/trading', icon: ShowChartIcon, color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)' },
    { title: 'Profit & Loss', description: 'Net profit/loss calculation', path: '/reports/pl', icon: AccountBalanceIcon, color: '#6a1b9a', bg: 'rgba(106, 27, 154, 0.1)' },
    { title: 'Balance Sheet', description: 'Overall financial position', path: '/reports/balance-sheet', icon: BalanceIcon, color: '#e65100', bg: 'rgba(230, 81, 0, 0.1)' },
    { title: 'Trial Balance', description: 'View current balances of all parties', path: '/reports/trial-balance', icon: ListAltIcon, color: '#00695c', bg: 'rgba(0, 105, 92, 0.1)' },
    { title: 'Monthly Report', description: 'Month-wise aggregation', path: '/reports/monthly', icon: CalendarMonthIcon, color: '#1976d2', bg: 'rgba(25, 118, 210, 0.1)' },
    { title: 'Audit Checklist', description: 'Transaction counts and totals', path: '/reports/checklist', icon: FactCheckIcon, color: '#c62828', bg: 'rgba(198, 40, 40, 0.1)' },
];

export default function ReportsPage() {
    const navigate = useNavigate();

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Reports</Typography>
            <Grid container spacing={2}>
                {reports.map((r, i) => {
                    const Icon = r.icon;
                    return (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Card 
                                sx={{ 
                                    cursor: 'pointer', 
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                                    transition: 'all 0.18s ease',
                                    borderLeft: `4px solid ${r.color}`,
                                }} 
                                onClick={() => navigate(r.path)}
                            >
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ bgcolor: r.bg, p: 1.2, borderRadius: 2, flexShrink: 0 }}>
                                        <Icon sx={{ fontSize: 28, color: r.color }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{r.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{r.description}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
