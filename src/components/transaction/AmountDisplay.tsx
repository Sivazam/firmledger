import React from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import { formatINR } from '../../utils/formatters';

interface Props extends TypographyProps {
    amount: number; // in paisa
}

export default function AmountDisplay({ amount, ...props }: Props) {
    return (
        <Typography {...props} sx={{ fontWeight: 'bold', ...props.sx }}>
            {formatINR(amount)}
        </Typography>
    );
}
