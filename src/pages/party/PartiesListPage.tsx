import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { usePartyStore } from '../../stores/partyStore';
import { useAuthStore } from '../../stores/authStore';
import PartyCard from '../../components/party/PartyCard';
import { useNavigate } from 'react-router-dom';

export default function PartiesListPage() {
    const { parties, fetchParties, loading, initialized } = usePartyStore();
    const { profile } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (profile?.organizationId && !initialized) {
            fetchParties(profile.organizationId);
        }
    }, [profile?.organizationId, initialized, fetchParties]);

    const filteredParties = parties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.town.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="bold">Parties</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/parties/add')}
                    sx={{ borderRadius: 8, textTransform: 'none' }}
                >
                    Add Party
                </Button>
            </Box>

            <Box mb={3}>
                <TextField
                    fullWidth
                    placeholder="Search parties by name, code or town..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {loading ? (
                <Typography textAlign="center">Loading parties...</Typography>
            ) : filteredParties.length > 0 ? (
                filteredParties.map(party => <PartyCard key={party.id} party={party} />)
            ) : (
                <Typography textAlign="center" color="text.secondary" mt={4}>
                    No parties found.
                </Typography>
            )}
        </Box>
    );
}
