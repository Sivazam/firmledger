import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './config/theme';
import { router } from './router';
import { useAuthStore } from './stores/authStore';

import SplashScreen from './components/common/SplashScreen';

function App() {
  const { init, initialized } = useAuthStore();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    init();
    // Force splash for at least 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [init]);

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
