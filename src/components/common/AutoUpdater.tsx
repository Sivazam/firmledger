import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

export default function AutoUpdater() {
    // Check for updates every 60 minutes
    const intervalMS = 60 * 60 * 1000;

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: any) {
            if (r) {
                setInterval(() => {
                    r.update();
                }, intervalMS);
            }
        },
        onRegisterError(error: any) {
            console.error('SW registration error', error);
        },
    });

    // Check for updates when the user returns to the app tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                navigator.serviceWorker?.getRegistration().then((r) => {
                    if (r) r.update();
                });
                
                // If there's an update pending from a previous background sync, deploy it immediately when they open the app
                if (needRefresh) {
                    updateServiceWorker(true);
                }
            }
        };

        // If the app just booted and an update is already pending, force the flush payload instantly
        if (needRefresh && document.visibilityState === 'visible') {
            updateServiceWorker(true);
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [needRefresh, updateServiceWorker]);

    const closePrompt = () => {
        setNeedRefresh(false);
    };

    return (
        <Snackbar 
            open={needRefresh} 
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 90, sm: 24 } }} // Clears the bottom navigation bar safely
        >
            <Alert 
                severity="info" 
                variant="filled" 
                sx={{ width: '100%', alignItems: 'center', backgroundColor: '#1E293B', color: 'white' }}
                action={
                    <React.Fragment>
                        <Button 
                            color="primary" 
                            variant="contained" 
                            size="small" 
                            startIcon={<DownloadIcon />}
                            onClick={() => updateServiceWorker(true)}
                            sx={{ mr: 1, fontWeight: 'bold' }}
                        >
                            Update
                        </Button>
                        <Button color="inherit" size="small" onClick={closePrompt}>
                            Ignore
                        </Button>
                    </React.Fragment>
                }
            >
                A new update is available!
            </Alert>
        </Snackbar>
    );
}
