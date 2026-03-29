import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { usePartyStore } from '../../stores/partyStore';
import { useAuthStore } from '../../stores/authStore';
import PartyCard from '../../components/party/PartyCard';
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { usePDF } from '../../hooks/usePDF';
import PartiesDocument from '../../components/pdf/PartiesDocument';
import { useOrganizationStore } from '../../stores/organizationStore';
import { ReportExportService } from '../../utils/reportExport';

export default function PartiesListPage() {
    const { parties, fetchParties, loading, initialized } = usePartyStore();
    const { profile } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { currentOrganization } = useOrganizationStore();
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleExportPdf = async () => {
        handleCloseMenu();
        const blob = await generatePDFBlob(<PartiesDocument parties={filteredParties} organization={currentOrganization} />);
        await sharePDF(blob, `Parties_List_${new Date().getTime()}.pdf`);
    };

    const handleExportCsv = () => {
        handleCloseMenu();
        const headers = ['code', 'name', 'fatherName', 'town', 'address', 'phoneNumber', 'aadharNumber', 'panNumber', 'gstNumber', 'category', 'openingBalance', 'balanceType'];
        const csvData = filteredParties.map(p => ({
            ...p,
            openingBalance: (p.openingBalance || 0) / 100
        }));
        ReportExportService.exportToCSV(`Parties_List_${new Date().getTime()}`, csvData, headers);
    };

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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1}>
                <Typography variant="h5" fontWeight="bold">Parties</Typography>
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleOpenMenu}
                        disabled={isGenerating || parties.length === 0}
                        sx={{ borderRadius: 8, textTransform: 'none' }}
                    >
                        {isGenerating ? 'Generating...' : 'Export'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/parties/add')}
                        sx={{ borderRadius: 8, textTransform: 'none' }}
                    >
                        Add Party
                    </Button>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleExportPdf}>Export PDF (Print/Share)</MenuItem>
                <MenuItem onClick={handleExportCsv}>Export Excel (CSV)</MenuItem>
            </Menu>

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
