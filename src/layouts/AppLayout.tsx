import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SafeAreaWrapper from './SafeAreaWrapper';
import TopAppBar from '../components/common/TopAppBar';
import BottomNavigation from '../components/common/BottomNavigation';
import { useAuthStore } from '../stores/authStore';

export default function AppLayout() {
    return (
        <SafeAreaWrapper>
            <TopAppBar />
            <Box component="main" sx={{ flexGrow: 1, p: 2, pb: 14, bgcolor: 'background.default', minHeight: '100vh' }}>
                {/* Spacer for fixed AppBar */}
                <Toolbar />
                <Outlet />
            </Box>
            <BottomNavigation />
        </SafeAreaWrapper>
    );
}
