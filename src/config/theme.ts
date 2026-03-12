import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E40AF', // Deep Blue
      light: '#3B82F6',
      dark: '#1E3A8A',
    },
    secondary: {
      main: '#0F766E', // Deep Teal
      light: '#14B8A6',
      dark: '#0F52BA',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info: { main: '#3B82F6' },
    success: { main: '#10B981' },
    background: {
      default: '#F1F5F9', // Slate 100
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1E293B', // Slate 800
      secondary: '#475569', // Slate 600
    }
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 6,
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(30, 64, 175, 0.2)',
          }
        },
        containedPrimary: {
          background: '#1E40AF',
          color: '#FFFFFF',
          '&:hover': {
            background: '#1E3A8A',
          },
          '&.Mui-disabled': {
            background: '#1E40AF',
            color: '#FFFFFF',
            opacity: 0.7
          }
        }
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            transition: 'border-color 0.2s',
            '&.Mui-focused': {
              boxShadow: 'none',
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.08)',
          border: '1px solid #E2E8F0',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.05)',
          borderBottom: '1px solid #E2E8F0',
        }
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'auto',
          minHeight: '60px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
        }
      }
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
          '&.Mui-selected': {
            color: '#1E40AF',
          }
        }
      }
    }
  }
});

export default theme;
