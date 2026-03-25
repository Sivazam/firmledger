import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function AutoUpdater() {
    // intervalMS: check every 60 minutes
    const intervalMS = 60 * 60 * 1000;

    const {
        needRefresh: [needRefresh],
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

    useEffect(() => {
        if (needRefresh) {
            // Automatically force the active service worker to take control and reload the page
            updateServiceWorker(true);
        }
    }, [needRefresh, updateServiceWorker]);

    // Check for updates when the user returns to the app tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Try to get the registration and update
                navigator.serviceWorker?.getRegistration().then((r) => {
                    if (r) r.update();
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return null; // Invisible component
}
