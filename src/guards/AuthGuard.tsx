import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard() {
    const { user, loading, initialized } = useAuthStore();
    const location = useLocation();

    if (!initialized || loading) {
        return (
            <Box className="splash-container" bgcolor="background.default" height="100vh" position="relative">
                <Box
                    component="img"
                    src="/logo-splash.svg"
                    alt="Loading..."
                    className="splash-logo"
                />
                <Box className="splash-footer">
                    Built by <a href="https://wa.me/919014882779?text=I%20have%20a%20software/app/website%20requirement" target="_blank" rel="noopener noreferrer">Harte Labs</a>
                </Box>
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
