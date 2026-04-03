import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Button, CircularProgress } from '@mui/material';
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
        const headers = ['Code', 'Name', 'Father_Name', 'Town', 'Address', 'Phone_Number', 'Aadhar_Number', 'PAN_Number', 'GST_Number', 'Category', 'Opening_Balance', 'Balance_Type'];
        const csvData = filteredParties.map(p => ({
            Code: p.code,
            Name: p.name,
            Father_Name: p.fatherName || '',
            Town: p.town,
            Address: p.address,
            Phone_Number: p.phoneNumber,
            Aadhar_Number: p.aadharNumber || '',
            PAN_Number: p.panNumber || '',
            GST_Number: p.gstNumber || '',
            Category: p.category,
            Opening_Balance: (p.openingBalance || 0) / 100,
            Balance_Type: p.balanceType
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
                <Typography variant="h5" fontWeight="900" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Parties</Typography>
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        onClick={handleOpenMenu}
                        disabled={isGenerating || parties.length === 0}
                        size="small"
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            minWidth: { xs: 40, sm: 100 },
                            height: { xs: 40, sm: 'auto' },
                            p: { xs: 0, sm: '4px 10px' },
                            fontWeight: 'bold'
                        }}
                    >
                        {isGenerating ? (
                            <CircularProgress size={20} />
                        ) : (
                            <>
                                <DownloadIcon sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: { xs: 24, sm: 20 } }} />
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                    Export
                                </Box>
                            </>
                        )}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/parties/add')}
                        size="small"
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            minWidth: { xs: 40, sm: 110 },
                            height: { xs: 40, sm: 'auto' },
                            p: { xs: 0, sm: '4px 10px' },
                            fontWeight: 'bold'
                        }}
                    >
                        <AddIcon sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: { xs: 24, sm: 20 } }} />
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                            Add Party
                        </Box>
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
