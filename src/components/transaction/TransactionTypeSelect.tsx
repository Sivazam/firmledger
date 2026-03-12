import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { TransactionType } from '../../config/constants';

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
                    {type.replace('_', ' ').toUpperCase()}
                </MenuItem>
            ))}
        </TextField>
    );
}
