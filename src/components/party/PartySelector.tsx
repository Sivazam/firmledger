import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { usePartyStore } from '../../stores/partyStore';
import type { Party } from '../../types/party.types';

interface Props {
    label: string;
    value: Party | null;
    onChange: (party: Party | null) => void;
    error?: boolean;
    helperText?: string;
}

export default function PartySelector({ label, value, onChange, error, helperText }: Props) {
    const { parties } = usePartyStore();

    return (
        <Autocomplete
            options={parties}
            autoHighlight
            getOptionLabel={(option) => `${option.name} (${option.code}) - ${option.town}`}
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText}
                    required
                />
            )}
            isOptionEqualToValue={(option, val) => option.id === val.id}
        />
    );
}
