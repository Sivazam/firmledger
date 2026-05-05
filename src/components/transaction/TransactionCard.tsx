import React, { useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Transaction } from '../../types/transaction.types';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from './AmountDisplay';
import { useNavigate } from 'react-router-dom';

interface Props {
    tx: Transaction;
    isMultiUser?: boolean;  // when true, show "by <name>" attribution
    ownerId?: string;       // to differentiate colors
    onDelete?: (tx: Transaction) => void;
}

export default function TransactionCard({ tx, isMultiUser = false, ownerId, onDelete }: Props) {
    const navigate = useNavigate();
    const isOwner = tx.createdBy === ownerId;
    const startX = useRef<number | null>(null);
    const [swiped, setSwiped] = useState(false);

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

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (startX.current === null) return;
        const diff = startX.current - e.changedTouches[0].clientX;
        if (diff > 80) {
            setSwiped(true);
        } else if (diff < -40) {
            setSwiped(false);
        }
        startX.current = null;
    };

    return (
        <Card
            sx={{
                mb: 2,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Delete action revealed on swipe */}
            {swiped && onDelete && (
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 72,
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(tx);
                    }}
                >
                    <IconButton sx={{ color: 'white' }}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            )}
            <Box
                onClick={() => navigate(`/transactions/${tx.id}`)}
                sx={{
                    position: 'relative',
                    zIndex: 3,
                    bgcolor: 'background.paper',
                    transform: swiped ? 'translateX(-72px)' : 'translateX(0)',
                    transition: 'transform 0.25s ease',
                }}
            >
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
            </Box>
        </Card>
    );
}
