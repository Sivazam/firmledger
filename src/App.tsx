import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './config/theme';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import { useOrganizationStore } from './stores/organizationStore';

import SplashScreen from './components/common/SplashScreen';

function App() {
  const { init, initialized, profile } = useAuthStore();
  const { fetchOrganization, currentOrganization } = useOrganizationStore();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    init();
    // Force splash for at least 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [init]);

  useEffect(() => {
    if (profile?.organizationId && (!currentOrganization || currentOrganization.id !== profile.organizationId)) {
      fetchOrganization(profile.organizationId);
    }
  }, [profile?.organizationId, fetchOrganization, currentOrganization]);

  useEffect(() => {
    const backfillCashParty = async () => {
      if (profile?.organizationId && currentOrganization) {
        // Attempt to create it. setDoc with Merge would be safe, but setDoc is fine if we use a fixed ID or check first.
        // The service now handles it for new ones, this is for existing.
        // We'll use the same logic as in OrganizationService.
        try {
          const { db } = await import('./config/firebase');
          const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const cashPartyId = 'party_cash';
          const cashPartyRef = doc(db, 'organizations', profile.organizationId, 'parties', cashPartyId);
          const cashPartySnap = await getDoc(cashPartyRef);
          
          if (!cashPartySnap.exists()) {
             await setDoc(cashPartyRef, {
                id: cashPartyId,
                code: 'CASH',
                name: 'Cash in Hand',
                category: 'CASH',
                address: 'System Default',
                town: currentOrganization.city || 'Local',
                phoneNumber: '0000000000',
                isSystem: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('Backfilled CASH party for org:', profile.organizationId);
          }
        } catch (e) {
          console.error('Failed to backfill CASH party:', e);
        }
      }
    };
    backfillCashParty();
  }, [profile?.organizationId, currentOrganization]);
  if (showSplash || !initialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SplashScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
