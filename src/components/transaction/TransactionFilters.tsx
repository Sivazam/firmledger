import React from 'react';
import { Box, TextField, MenuItem, InputAdornment, Grid, Select, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TransactionType, TRANSACTION_TYPE_LABELS } from '../../config/constants';
import { useOrganizationStore } from '../../stores/organizationStore';

interface Props {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedType: string;
    setSelectedType: (val: string) => void;
    fromDate: string;
    setFromDate: (val: string) => void;
    toDate: string;
    setToDate: (val: string) => void;
    onGenerateReport: () => void;
    hasTransactions: boolean;
}

const BUSINESS_TYPES = [
    TransactionType.SI,
    TransactionType.PI,
    TransactionType.SR,
    TransactionType.PR
];

export default function TransactionFilters({
    searchTerm, setSearchTerm,
    selectedType, setSelectedType,
    fromDate, setFromDate,
    toDate, setToDate,
    onGenerateReport,
    hasTransactions
}: Props) {
    const { currentOrganization } = useOrganizationStore();
    
    const types = Object.values(TransactionType).filter(type => {
        if (BUSINESS_TYPES.includes(type as TransactionType)) {
            return !!currentOrganization?.hasBusinessTransactions;
        }
        return true;
    });

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
                        minWidth: { xs: '100%', sm: 140 }, 
                        bgcolor: 'background.paper' 
                    }}
                >
                    <MenuItem value="">All Records</MenuItem>
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
                <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="From"
                        type="date"
                        value={fromDate}
                        onChange={(e) => { setFromDate(e.target.value); if(e.target.value) (e.target as any).blur(); }}
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="To"
                        type="date"
                        value={toDate}
                        onChange={(e) => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }}
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        size="small" 
                        onClick={onGenerateReport}
                        disabled={!hasTransactions}
                        sx={{ height: '40px', fontWeight: 'bold' }}
                    >
                        Generate Report
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
