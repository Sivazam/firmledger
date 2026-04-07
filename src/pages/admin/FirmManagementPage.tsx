import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, Typography, List, ListItem, ListItemText, Chip, Button, 
    CircularProgress, ToggleButton, ToggleButtonGroup, Collapse,
    IconButton, Divider, Avatar, Stack, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, MenuItem, Alert,
    Tooltip
} from '@mui/material';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AdminService } from '../../services/admin.service';
import { SecondaryAuthService } from '../../utils/secondaryAuth';
import { AuthService } from '../../services/auth.service';
import { OrganizationService } from '../../services/organization.service';
import { generateFinancialYearOptions } from '../../utils/dateUtils';
import { VALIDATION_PATTERNS } from '../../config/constants';

export default function FirmManagementPage() {
    const { 
        organizations: orgs, users, loading, initialized, 
        fetchOrganizations, fetchUsers 
    } = useAdminStore();
    const navigate = useNavigate();
    const location = useLocation();
    const fyOptions = useMemo(() => generateFinancialYearOptions(), []);
    
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>(
        location.state?.statusFilter || 'all'
    );
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Org Dialog State
    const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
    const [createOrgLoading, setCreateOrgLoading] = useState(false);
    const [createOrgError, setCreateOrgError] = useState('');
    const [newOrgData, setNewOrgData] = useState({
        orgName: '', city: '', address: '', pincode: '', gstNumber: '',
        ownerUsername: '', ownerEmail: '', ownerPassword: '', phone: '',
        selectedFyIndex: 0
    });

    // Member Dialog State
    const [createMemberDialogOpen, setCreateMemberDialogOpen] = useState(false);
    const [createMemberLoading, setCreateMemberLoading] = useState(false);
    const [createMemberError, setCreateMemberError] = useState('');
    const [selectedOrgForMember, setSelectedOrgForMember] = useState<any>(null);
    const [newMemberData, setNewMemberData] = useState({
        username: '', email: '', password: ''
    });

    // Shareable Success Dialog State
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successDetails, setSuccessDetails] = useState({
        title: '', message: '', username: '', email: '', password: '', type: 'org' as 'org' | 'member'
    });

    const [dialogConfig, setDialogConfig] = useState<{ 
        open: boolean, title: string, message: string, 
        variant: 'success' | 'confirm' | 'error', onConfirm: () => void 
    }>({ open: false, title: '', message: '', variant: 'confirm', onConfirm: () => {} });

    useEffect(() => {
        if (!initialized) {
            fetchOrganizations();
            fetchUsers();
        }
    }, [initialized, fetchOrganizations, fetchUsers]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'denied': return 'error';
            default: return 'warning';
        }
    };

    const filteredOrgs = orgs.filter(o => {
        if (o.isOwnerAdmin) return false;
        if (statusFilter === 'all') return true;
        return o.status === statusFilter;
    });

    const orgMembersMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        orgs.forEach(o => map[o.id] = []);
        users.forEach(u => {
            if (u.organizationId && map[u.organizationId]) {
                const org = orgs.find(o => o.id === u.organizationId);
                if (org && org.ownerId !== u.uid) {
                    map[u.organizationId].push(u);
                }
            }
        });
        return map;
    }, [users, orgs]);

    const handleUpdateMemberStatus = (member: any, newStatus: 'approved' | 'denied') => {
        const isDeactivate = newStatus === 'denied';
        setDialogConfig({
            open: true,
            variant: isDeactivate ? 'confirm' : 'success',
            title: isDeactivate ? 'Revoke User Access?' : 'Approve User?',
            message: `Are you sure you want to ${isDeactivate ? 'revoke access for' : 'approve'} ${member.displayName}?`,
            onConfirm: async () => {
                setDialogConfig(prev => ({ ...prev, open: false }));
                setActionLoading(member.uid);
                try {
                    await AdminService.updateUserStatus(member.uid, newStatus);
                    await fetchUsers();
                } catch (err: any) {
                    alert('Error: ' + err.message);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const handleCreateOrg = async () => {
        setCreateOrgError('');
        const { orgName, city, address, pincode, ownerUsername, ownerEmail, ownerPassword, phone } = newOrgData;
        
        if (!orgName || !city || !address || !pincode || !ownerUsername || !ownerEmail || !ownerPassword || !phone) {
            setCreateOrgError('Please fill all required fields');
            return;
        }

        setCreateOrgLoading(true);
        try {
            const isAvailable = await AuthService.isUsernameAvailable(ownerUsername);
            if (!isAvailable) throw new Error('Username already taken.');

            const uid = await SecondaryAuthService.createUser(ownerEmail, ownerPassword, ownerUsername);
            
            const selectedFy = fyOptions[newOrgData.selectedFyIndex];
            
            await Promise.all([
                AuthService.registerWithUsername(ownerUsername, ownerEmail, uid),
                AuthService.createUserProfile(uid, {
                    displayName: ownerUsername, email: ownerEmail, phone: phone, 
                    city: city, address: address, pincode: pincode, userType: 'user',
                    status: 'approved', profileComplete: true
                }),
                OrganizationService.createOrganization(uid, {
                    orgName, city, address, pincode, gstNumber: newOrgData.gstNumber, ownerId: uid,
                    subscriptionStart: selectedFy.startDate, subscriptionEnd: selectedFy.endDate,
                    subscriptionLabel: selectedFy.label, subscriptionDescription: selectedFy.description
                }, true)
            ]);

            setCreateOrgDialogOpen(false);
            setNewOrgData({
                orgName: '', city: '', address: '', pincode: '', gstNumber: '',
                ownerUsername: '', ownerEmail: '', ownerPassword: '', phone: '', selectedFyIndex: 0
            });
            fetchOrganizations();
            fetchUsers();
            
            setSuccessDetails({
                title: 'Organization Created',
                message: `Organization "${orgName}" and Owner account created successfully!`,
                username: ownerUsername,
                email: ownerEmail,
                password: ownerPassword,
                type: 'org'
            });
            setSuccessDialogOpen(true);
        } catch (err: any) {
            setCreateOrgError(err.message || 'Failed to create organization');
        } finally {
            setCreateOrgLoading(false);
        }
    };

    const handleCreateMember = async () => {
        setCreateMemberError('');
        const { username, email, password } = newMemberData;
        if (!username || !email || !password) {
            setCreateMemberError('Please fill all fields');
            return;
        }

        setCreateMemberLoading(true);
        try {
            const isAvailable = await AuthService.isUsernameAvailable(username);
            if (!isAvailable) throw new Error('Username already taken.');

            const uid = await SecondaryAuthService.createUser(email, password, username);
            await AuthService.registerWithUsername(username, email, uid);
            await AuthService.createUserProfile(uid, {
                displayName: username, email: email, organizationId: selectedOrgForMember.id,
                userType: 'user', status: 'approved', profileComplete: true
            });

            setCreateMemberDialogOpen(false);
            setNewMemberData({ username: '', email: '', password: '' });
            fetchUsers();
            
            setSuccessDetails({
                title: 'Staff Member Created',
                message: `New staff member created for "${selectedOrgForMember.orgName}"`,
                username: username,
                email: email,
                password: password,
                type: 'member'
            });
            setSuccessDialogOpen(true);
        } catch (err: any) {
            setCreateMemberError(err.message || 'Failed to create member');
        } finally {
            setCreateMemberLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getShareableText = () => {
        const loginUrl = 'https://www.ytraders.in/login';
        return `Hello, here are your login credentials for Viswa Ledger:\n\nLogin Link: ${loginUrl}\nUsername: ${successDetails.username}\nEmail: ${successDetails.email}\nPassword: ${successDetails.password}\n\nPlease change your password after logging in via Settings.`;
    };

    return (
        <Box p={2}>
            <Box 
                display="flex" 
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                mb={3} 
                gap={2}
            >
                <Typography variant="h5" fontWeight="900" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Firm Management
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOrgDialogOpen(true)}
                    size="medium"
                    fullWidth={{ xs: true, sm: false } as any}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                >
                    Create Organization
                </Button>
            </Box>

            <Box mb={3} display="flex" gap={1} overflow="auto" pb={1}>
                <ToggleButtonGroup
                    value={statusFilter} exclusive
                    onChange={(e, newLevel) => { if (newLevel !== null) setStatusFilter(newLevel); }}
                    size="small"
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="denied">Denied</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading && !initialized ? (
                <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredOrgs.map(org => {
                        const members = orgMembersMap[org.id] || [];
                        const isExpanded = expandedOrg === org.id;

                        return (
                            <ListItem
                                key={org.id}
                                sx={{
                                    border: '1px solid #E2E8F0', borderRadius: 3, backgroundColor: '#FFFFFF',
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    boxShadow: '0px 1px 3px rgba(0,0,0,0.05)', p: 0, overflow: 'hidden',
                                    borderLeft: `6px solid ${org.status === 'approved' ? '#10B981' : org.status === 'denied' ? '#EF4444' : '#F59E0B'}`
                                }}
                            >
                                <Box sx={{ p: 2, pb: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box flexGrow={1}>
                                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1.2 }}>{org.orgName}</Typography>
                                        <Typography variant="body2" color="text.secondary">{org.city} &bull; {org.gstNumber || 'No GST'}</Typography>
                                        <Box display="flex" gap={1} mt={1} alignItems="center">
                                            <Chip label={org.status} color={getStatusColor(org.status) as any} size="small" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700, textTransform: 'uppercase' }} />
                                            {members.length > 0 && (
                                                <Chip icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />} label={`${members.length} Staff`} variant="outlined" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                            )}
                                        </Box>
                                    </Box>
                                    <IconButton onClick={() => setExpandedOrg(isExpanded ? null : org.id)} size="small" sx={{ bgcolor: '#F1F5F9', ml: 1 }}>
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>

                                <Box width="100%" px={2} pb={2} display="flex" gap={1} justifyContent="flex-end">
                                    <Button 
                                        variant="outlined" size="small" color="secondary" startIcon={<PersonAddIcon />}
                                        onClick={() => { setSelectedOrgForMember(org); setCreateMemberDialogOpen(true); }}
                                        sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                                    >
                                        Create Staff
                                    </Button>
                                    <Button 
                                        variant="text" size="small" sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                                        onClick={() => navigate(`/admin/organizations/${org.id}`, { state: { org } })}
                                    >
                                        Firm Profile &rarr;
                                    </Button>
                                </Box>

                                <Collapse in={isExpanded} sx={{ width: '100%' }}>
                                    <Divider />
                                    <Box px={2} py={2} bgcolor="#F8FAFC">
                                        <Typography variant="overline" color="text.secondary" fontWeight="900" fontSize="0.65rem">STAFF MEMBERS</Typography>
                                        {members.length === 0 ? (
                                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>No staff members created yet.</Typography>
                                        ) : (
                                            <Stack spacing={1.5} mt={1.5}>
                                                {members.map(member => (
                                                    <Box key={member.uid} display="flex" gap={1.5} alignItems="center">
                                                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.9rem', bgcolor: 'primary.light', fontWeight: 'bold' }}>{member.displayName?.[0] || '?'}</Avatar>
                                                        <Box flexGrow={1} minWidth={0}>
                                                            <Typography variant="body2" fontWeight="bold" noWrap>{member.displayName || member.username}</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{member.phone || 'No phone'}</Typography>
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Chip label={member.status} size="small" color={getStatusColor(member.status) as any} variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                                                            <IconButton size="small" color={member.status === 'approved' ? 'error' : 'success'} onClick={() => handleUpdateMemberStatus(member, member.status === 'approved' ? 'denied' : 'approved')} disabled={actionLoading === member.uid} sx={{ border: '1px solid currentColor' }}>
                                                                {member.status === 'approved' ? <PersonOffIcon sx={{fontSize: 14}} /> : <CheckCircleIcon sx={{fontSize: 14}} />}
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                </Collapse>
                            </ListItem>
                        );
                    })}
                </List>
            )}

            {/* Create Org Dialog */}
            <Dialog open={createOrgDialogOpen} onClose={() => !createOrgLoading && setCreateOrgDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>Create New Organization</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {createOrgError && <Alert severity="error">{createOrgError}</Alert>}
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">Organization Identity</Typography>
                        <TextField label="Organization Name" fullWidth size="small" required value={newOrgData.orgName} onChange={e => setNewOrgData({...newOrgData, orgName: e.target.value})} />
                        <TextField label="GST Number (Optional)" fullWidth size="small" value={newOrgData.gstNumber} onChange={e => setNewOrgData({...newOrgData, gstNumber: e.target.value})} />
                        <Divider />
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">Location & Contact</Typography>
                        <Box display="flex" gap={2}>
                            <TextField label="City" fullWidth size="small" required value={newOrgData.city} onChange={e => setNewOrgData({...newOrgData, city: e.target.value})} />
                            <TextField label="Pincode" fullWidth size="small" required value={newOrgData.pincode} onChange={e => setNewOrgData({...newOrgData, pincode: e.target.value})} />
                        </Box>
                        <TextField label="Full Address" fullWidth size="small" required multiline rows={2} value={newOrgData.address} onChange={e => setNewOrgData({...newOrgData, address: e.target.value})} />
                        <TextField label="Phone Number" fullWidth size="small" required value={newOrgData.phone} onChange={e => setNewOrgData({...newOrgData, phone: e.target.value})} helperText="10 digit mobile number" />
                        <Divider />
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">Owner Credentials</Typography>
                        <TextField label="Owner Username" fullWidth size="small" required value={newOrgData.ownerUsername} onChange={e => setNewOrgData({...newOrgData, ownerUsername: e.target.value.toLowerCase().replace(/\s/g, '')})} />
                        <TextField label="Owner Email" fullWidth size="small" required type="email" value={newOrgData.ownerEmail} onChange={e => setNewOrgData({...newOrgData, ownerEmail: e.target.value})} />
                        <TextField label="Initial Password" fullWidth size="small" required type="password" value={newOrgData.ownerPassword} onChange={e => setNewOrgData({...newOrgData, ownerPassword: e.target.value})} />
                        <Divider />
                        <TextField select label="Financial Year" fullWidth size="small" value={newOrgData.selectedFyIndex} onChange={e => setNewOrgData({...newOrgData, selectedFyIndex: Number(e.target.value)})} >
                            {fyOptions.map((opt, idx) => (<MenuItem key={idx} value={idx}>{opt.label}</MenuItem>))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCreateOrgDialogOpen(false)} disabled={createOrgLoading} size="large">Cancel</Button>
                    <Button variant="contained" onClick={handleCreateOrg} disabled={createOrgLoading} sx={{ px: 4, fontWeight: 'bold' }} size="large">
                        {createOrgLoading ? <CircularProgress size={24} /> : 'Create Organization'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Member Dialog */}
            <Dialog open={createMemberDialogOpen} onClose={() => !createMemberLoading && setCreateMemberDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800 }}>Create Staff for {selectedOrgForMember?.orgName}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {createMemberError && <Alert severity="error">{createMemberError}</Alert>}
                        <TextField label="Username" fullWidth size="small" required value={newMemberData.username} onChange={e => setNewMemberData({...newMemberData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} helperText="User will use this to login" />
                        <TextField label="Email" fullWidth size="small" required type="email" value={newMemberData.email} onChange={e => setNewMemberData({...newMemberData, email: e.target.value})} />
                        <TextField label="Initial Password" fullWidth size="small" required type="password" value={newMemberData.password} onChange={e => setNewMemberData({...newMemberData, password: e.target.value})} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCreateMemberDialogOpen(false)} disabled={createMemberLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateMember} disabled={createMemberLoading} sx={{ px: 4, fontWeight: 'bold' }}>
                        {createMemberLoading ? <CircularProgress size={24} /> : 'Create Member'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Details Dialog */}
            <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 50, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">{successDetails.title}</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography textAlign="center" color="text.secondary" mb={3}>{successDetails.message}</Typography>
                    <Stack spacing={1} sx={{ bgcolor: '#F1F5F9', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" fontWeight="bold">Username:</Typography>
                            <Typography variant="caption" fontWeight="900" sx={{ color: 'primary.main' }}>{successDetails.username}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" fontWeight="bold">Email:</Typography>
                            <Typography variant="caption">{successDetails.email}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" fontWeight="bold">Password:</Typography>
                            <Typography variant="caption" fontWeight="bold" sx={{ letterSpacing: 1 }}>{successDetails.password}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={1} pt={1} borderTop="1px solid #CBD5E1">
                            <Typography variant="caption" fontWeight="bold">Login URL:</Typography>
                            <Typography variant="caption" sx={{ color: 'primary.main', textDecoration: 'underline' }}>https://www.ytraders.in/login</Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                    <Button 
                        variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => copyToClipboard(getShareableText())}
                    >
                        Copy Info
                    </Button>
                    <Button 
                        variant="contained" color="success" startIcon={<WhatsAppIcon />}
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getShareableText())}`, '_blank')}
                    >
                        Share WhatsApp
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog 
                open={dialogConfig.open} title={dialogConfig.title} message={dialogConfig.message} 
                variant={dialogConfig.variant} onConfirm={dialogConfig.onConfirm}
                onCancel={() => setDialogConfig(prev => ({ ...prev, open: false }))} confirmText="Ok"
            />
        </Box>
    );
}


