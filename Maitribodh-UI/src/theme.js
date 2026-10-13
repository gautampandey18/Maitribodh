import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#f7d327', contrastText: '#504c41' },
    secondary: { main: '#504c41', contrastText: '#ffffff' },
    background: { default: '#fffefb', paper: '#ffffff' },
    success: { main: '#2e7d46' },
    warning: { main: '#b8790a' },
    error: { main: '#c4281b' },
    info: { main: '#0b6e7a' },
    text: { primary: '#504c41', secondary: '#716d62' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Segoe UI", sans-serif',
    h1: { fontSize: '1.3125rem', fontWeight: 700, lineHeight: 1.25 },
    h2: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '0.90625rem', fontWeight: 700, lineHeight: 1.35 },
    body1: { fontSize: '0.825rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '0.875rem', lineHeight: 1.45 },
    caption: { fontSize: '0.69rem', lineHeight: 1.4 },
    button: { fontSize: '0.875rem', textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '10px 14px', borderColor: '#feed9f', fontSize: '0.825rem' },
        head: { fontSize: '0.6875rem', fontWeight: 700, color: '#716d62', backgroundColor: 'var(--mams-navigation)', textTransform: 'uppercase' },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.8125rem' } } },
    MuiOutlinedInput: { styleOverrides: { input: { fontSize: '0.875rem' } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: '0.6875rem' } } },
    MuiTab: { styleOverrides: { root: { minHeight: 42, fontSize: '0.8125rem', textTransform: 'none', fontWeight: 600 } } },
  },
});