import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB', // Vibrant Blue (Indigo 600)
      light: '#60A5FA',
      dark: '#1D4ED8',
    },
    secondary: {
      main: '#6366F1', // Indigo Vibrant
      light: '#818CF8',
      dark: '#4338CA',
    },
    error: { main: '#F43F5E' },
    warning: { main: '#F59E0B' },
    info: { main: '#3B82F6' },
    success: { main: '#10B981' },
    background: {
      default: '#F8FAFC', // Very light warm slate
      paper: '#FFFFFF'
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
    }
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600, color: '#64748B' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 12,
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 700,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            transform: 'translateY(-1px)',
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '16px !important', // Prevents iOS Safari from auto-zooming
        }
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #F1F5F9',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          color: '#0F172A',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #F1F5F9',
        }
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'auto',
          minHeight: '70px',
          borderTop: '1px solid #F1F5F9',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
        }
      }
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          paddingTop: 10,
          paddingBottom: 10,
          '&.Mui-selected': {
            color: '#2563EB',
            fontWeight: 700,
          }
        }
      }
    }
  }
});

export default theme;
