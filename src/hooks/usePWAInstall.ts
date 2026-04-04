import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).__deferredPrompt);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already captured in global window
        if ((window as any).__deferredPrompt) {
            setDeferredPrompt((window as any).__deferredPrompt);
        }

        const checkStandalone = () => {
            const isStandaloneMode = 
                window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true ||
                window.location.search.includes('source=pwa');
                
            setIsStandalone(isStandaloneMode);
            
            // Detect iOS
            const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setIsIOS(isAppleDevice);
        };

        checkStandalone();

        // Listen for the 'beforeinstallprompt' event
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the default browser prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            console.log('PWA: beforeinstallprompt captured');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('pwa-prompt-captured', () => {
            setDeferredPrompt((window as any).__deferredPrompt);
        });
        window.addEventListener('appinstalled', () => {
            console.log('PWA: installed');
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: User choice outcome: ${outcome}`);

        // Regardless of the outcome, we can only use the prompt once
        setDeferredPrompt(null);
    };

    return {
        isInstallable: !!deferredPrompt,
        isStandalone,
        isIOS,
        installApp
    };
}
