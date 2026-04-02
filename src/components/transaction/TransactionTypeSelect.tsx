import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '../../config/constants';
import { useOrganizationStore } from '../../stores/organizationStore';

interface Props {
    value: TransactionType;
    onChange: (value: TransactionType) => void;
    disabled?: boolean;
}

const BUSINESS_TYPES = [
    TransactionType.SI,
    TransactionType.PI,
    TransactionType.SR,
    TransactionType.PR
];

export default function TransactionTypeSelect({ value, onChange, disabled }: Props) {
    const { currentOrganization } = useOrganizationStore();
    
    // Filter types based on organization permissions
    const types = Object.values(TransactionType).filter(type => {
        if (BUSINESS_TYPES.includes(type)) {
            return !!currentOrganization?.hasBusinessTransactions;
        }
        return true; // Always show standard financial types
    });

    return (
        <TextField
            select
            label="Transaction Type"
            value={value}
            onChange={(e) => onChange(e.target.value as TransactionType)}
            fullWidth
            disabled={disabled}
        >
            {types.map((type) => (
                <MenuItem key={type} value={type}>
                    {type} - {TRANSACTION_TYPE_LABELS[type]}
                </MenuItem>
            ))}
        </TextField>
    );
}
