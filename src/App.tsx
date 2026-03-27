import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './config/theme';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import { useOrganizationStore } from './stores/organizationStore';

import SplashScreen from './components/common/SplashScreen';
import AutoUpdater from './components/common/AutoUpdater';

function App() {
  const { init, initialized, profile } = useAuthStore();
  const { subscribeToOrganization, currentOrganization } = useOrganizationStore();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    init();
    // Force splash for at least 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [init]);

  useEffect(() => {
    if (profile?.organizationId) {
      const unsub = subscribeToOrganization(profile.organizationId);
      return () => unsub();
    }
  }, [profile?.organizationId, subscribeToOrganization]);

  useEffect(() => {
    const backfillSystemParties = async () => {
      if (profile?.organizationId && currentOrganization) {
        try {
          const { db } = await import('./config/firebase');
          const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
          
          const systemParties = [
            { id: 'party_cash', code: 'CASH', name: 'Cash in Hand', category: 'CASH' },
            { id: 'party_sale', code: 'SALE', name: 'SALES', category: 'Trading' },
            { id: 'party_purc', code: 'PURC', name: 'PURCHASE', category: 'Trading' },
            { id: 'party_sret', code: 'SRET', name: 'SALES RETURN', category: 'Trading' },
            { id: 'party_pret', code: 'PRET', name: 'PURCHASE RETURN', category: 'Trading' },
            { id: 'party_disc', code: 'DISC', name: 'DISCOUNT', category: 'P & L' }
          ];

          for (const party of systemParties) {
              const partyRef = doc(db, 'organizations', profile.organizationId, 'parties', party.id);
              const snap = await getDoc(partyRef);
              
              if (!snap.exists()) {
                 await setDoc(partyRef, {
                    id: party.id,
                    code: party.code,
                    name: party.name,
                    category: party.category,
                    address: 'System Default',
                    town: currentOrganization.city || 'Local',
                    phoneNumber: '0000000000',
                    openingBalance: 0,
                    balanceType: 'Debit',
                    isSystem: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log(`Backfilled ${party.code} party for org:`, profile.organizationId);
              }
          }
        } catch (e) {
          console.error('Failed to backfill system parties:', e);
        }
      }
    };
    backfillSystemParties();
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
      <AutoUpdater />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
