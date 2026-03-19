import React from 'react';
import { Box, TextField, MenuItem, InputAdornment, Grid, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '../../config/constants';

interface Props {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedType: string;
    setSelectedType: (val: string) => void;
    fromDate: string;
    setFromDate: (val: string) => void;
    toDate: string;
    setToDate: (val: string) => void;
}

export default function TransactionFilters({
    searchTerm, setSearchTerm,
    selectedType, setSelectedType,
    fromDate, setFromDate,
    toDate, setToDate
}: Props) {
    const types = Object.values(TransactionType);

    return (
        <Box mb={3}>
            <Box 
                display="flex" 
                gap={1} 
                mb={2}
                sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' }
                }}
            >
                <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    size="small"
                    displayEmpty
                    sx={{ 
                        minWidth: { xs: '100%', sm: 120 }, 
                        bgcolor: 'background.paper' 
                    }}
                >
                    <MenuItem value="">All Types</MenuItem>
                    {types.map(type => (
                        <MenuItem key={type} value={type}>
                            {type} - {TRANSACTION_TYPE_LABELS[type]}
                        </MenuItem>
                    ))}
                </Select>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search Party, SL No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Grid container spacing={1}>
                <Grid size={{ xs: 6, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
