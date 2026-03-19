import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import type { Transaction  } from '../../types/transaction.types';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from './AmountDisplay';
import { useNavigate } from 'react-router-dom';

export default function TransactionCard({ tx }: { tx: Transaction }) {
    const navigate = useNavigate();

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'receipt':
            case 'sales':
            case 'purchase_return':
                return 'success';
            case 'payment':
            case 'purchase':
            case 'sales_return':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={() => navigate(`/transactions/${tx.id}`)}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                        {tx.slNo} • {formatDate(tx.date)}
                    </Typography>
                    <Chip label={tx.type.toUpperCase().replace('_', ' ')} size="small" color={getTypeColor(tx.type) as any} />
                </Box>
                <Typography variant="body1" noWrap>
                    {tx.fromPartyName} &rarr; {tx.toPartyName}
                </Typography>
                <Box display="flex" justifyContent="flex-end" mt={1}>
                    <AmountDisplay amount={tx.amount} color={getTypeColor(tx.type) === 'success' ? 'success.main' : 'error.main'} />
                </Box>
            </CardContent>
        </Card>
    );
}
