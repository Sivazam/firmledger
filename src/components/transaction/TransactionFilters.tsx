import React from 'react';
import { Box, TextField, Chip, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TransactionType } from '../../config/constants';

interface Props {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedType: string;
    setSelectedType: (val: string) => void;
}

export default function TransactionFilters({ searchTerm, setSearchTerm, selectedType, setSelectedType }: Props) {
    const types = Object.values(TransactionType);

    return (
        <Box mb={3}>
            <TextField
                fullWidth
                placeholder="Search by Party Name, SL No, or Description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                    label="All"
                    color={selectedType === '' ? 'primary' : 'default'}
                    onClick={() => setSelectedType('')}
                />
                {types.map(type => (
                    <Chip
                        key={type}
                        label={type.replace('_', ' ').toUpperCase()}
                        color={selectedType === type ? 'primary' : 'default'}
                        onClick={() => setSelectedType(type)}
                    />
                ))}
            </Box>
        </Box>
    );
}
