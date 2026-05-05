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
    filter?: (party: Party) => boolean;
    highlight?: boolean;
}

export default function PartySelector({ label, value, onChange, error, helperText, filter, highlight }: Props) {
    const { parties } = usePartyStore();
    const filteredOptions = filter ? parties.filter(filter) : parties;

    return (
        <Autocomplete
            options={filteredOptions}
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
                    sx={highlight ? {
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { 
                                borderColor: 'primary.main', 
                                borderWidth: '2px',
                                boxShadow: '0 0 8px rgba(25, 118, 210, 0.2)'
                            },
                        },
                        '& .MuiInputLabel-root': { color: 'primary.main', fontWeight: 'bold' }
                    } : {}}
                />
            )}
            isOptionEqualToValue={(option, val) => option.id === val.id}
        />
    );
}
