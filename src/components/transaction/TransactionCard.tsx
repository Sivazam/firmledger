import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import type { Transaction } from '../../types/transaction.types';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from './AmountDisplay';
import { useNavigate } from 'react-router-dom';

interface Props {
    tx: Transaction;
    isMultiUser?: boolean;  // when true, show "by <name>" attribution
    ownerId?: string;       // to differentiate colors
}

export default function TransactionCard({ tx, isMultiUser = false, ownerId }: Props) {
    const navigate = useNavigate();
    const isOwner = tx.createdBy === ownerId;

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
                <Box display="flex" justifyContent={isMultiUser && tx.createdBy_name ? 'space-between' : 'flex-end'} alignItems="center" mt={1}>
                    {/* Only show attribution when this org actually has multiple members */}
                    {isMultiUser && tx.createdBy_name && (
                        <Chip 
                            label={tx.createdBy_name} 
                            size="small" 
                            variant="outlined" 
                            color={isOwner ? "primary" : "secondary"}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                        />
                    )}
                    <AmountDisplay amount={tx.amount} color={getTypeColor(tx.type) === 'success' ? 'success.main' : 'error.main'} />
                </Box>
            </CardContent>
        </Card>
    );
}
