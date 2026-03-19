import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '../../config/constants';

interface Props {
    value: TransactionType;
    onChange: (value: TransactionType) => void;
}

export default function TransactionTypeSelect({ value, onChange }: Props) {
    const types = Object.values(TransactionType);

    return (
        <TextField
            select
            label="Transaction Type"
            value={value}
            onChange={(e) => onChange(e.target.value as TransactionType)}
            fullWidth
        >
            {types.map((type) => (
                <MenuItem key={type} value={type}>
                    {type} - {TRANSACTION_TYPE_LABELS[type]}
                </MenuItem>
            ))}
        </TextField>
    );
}
