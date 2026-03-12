import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { OrganizationService } from '../../services/organization.service';
import type { Organization  } from '../../types/organization.types';

export default function PendingApprovalPage() {
    const { profile } = useAuthStore();
    const [org, setOrg] = useState<Organization | null>(null);

    const checkStatus = async () => {
        if (profile?.organizationId) {
            const orgData = await OrganizationService.getOrganization(profile.organizationId);
            setOrg(orgData);
            if (orgData?.status === 'approved') {
                window.location.href = '/';
            }
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, [profile?.organizationId]);

    return (
        <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h4" gutterBottom>
                    {org?.status === 'denied' ? 'Request Denied' : 'Pending Approval'}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    {org?.status === 'denied'
                        ? 'Your organization approval request was denied by the administrator.'
                        : 'Your organization is currently awaiting administrator approval. Please check back later.'}
                </Typography>
                <Button variant="outlined" onClick={checkStatus}>Refresh Status</Button>
            </Box>
        </Container>
    );
}
