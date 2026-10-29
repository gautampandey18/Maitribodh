import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#B55A12', dark: '#9A4C0F', contrastText: '#FFFFFF' },
    secondary: { main: '#FDF0E6', dark: '#FADFC9', contrastText: '#9A4C0F' },
    background: { default: '#F0F2F5', paper: '#FFFFFF' },
    success: { main: '#1E6B2E', light: '#E3F4E7' },
    warning: { main: '#B8790A', light: '#FCF1DD' },
    error: { main: '#D0293B', dark: '#B01F30', light: '#FDE7EA' },
    info: { main: '#0B6E7A', light: '#E0F0F1' },
    text: { primary: '#1C1E21', secondary: '#65676B', disabled: '#8A8D91' },
    divider: '#DADDE1',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
    h1: { fontSize: '1.375rem', fontWeight: 700, color: '#1C1E21' },
    h2: { fontSize: '1.3125rem', fontWeight: 600, color: '#1C1E21' },
    h3: { fontSize: '0.90625rem', fontWeight: 700, color: '#1C1E21', lineHeight: 1.35 },
    body1: { fontSize: '0.8125rem', lineHeight: 1.5, color: '#1C1E21' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, color: '#1C1E21' },
    subtitle1: { fontSize: '0.875rem', lineHeight: 1.45 },
    caption: { fontSize: '0.6875rem', lineHeight: 1.4, color: '#65676B' },
    button: { fontSize: '0.84375rem', textTransform: 'none', fontWeight: 600, lineHeight: '20px' },
    overline: { fontSize: '0.625rem', fontWeight: 700, color: '#65676B', letterSpacing: '0.08em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 38,
          padding: '8px 16px',
          transition: 'background-color 150ms ease, transform 150ms ease',
          '&:active': { transform: 'scale(.97)' },
        },
        sizeSmall: { minHeight: 32, padding: '5px 12px', fontSize: '0.75rem' },
        containedPrimary: {
          backgroundColor: '#B55A12',
          '&:hover': { backgroundColor: '#9A4C0F' },
        },
        containedSecondary: {
          backgroundColor: '#FDF0E6',
          color: '#9A4C0F',
          '&:hover': { backgroundColor: '#FADFC9' },
        },
        outlinedPrimary: {
          borderColor: '#B55A12',
          color: '#9A4C0F',
          '&:hover': { backgroundColor: '#FDF0E6', borderColor: '#B55A12' },
        },
        textPrimary: {
          color: '#9A4C0F',
          '&:hover': { backgroundColor: '#FDF0E6' },
        },
        containedError: {
          backgroundColor: '#D0293B',
          '&:hover': { backgroundColor: '#B01F30' },
        },
        containedSuccess: {
          backgroundColor: '#1E6B2E',
          '&:hover': { backgroundColor: '#155424' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
          border: '1px solid #F3D2B6',
          boxShadow: '0 1px 2px rgba(225,115,36,.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 14px',
          borderColor: '#DADDE1',
          fontSize: '0.8125rem',
          color: '#1C1E21',
          verticalAlign: 'middle',
          lineHeight: 1.5,
          overflowWrap: 'anywhere',
          fontVariantNumeric: 'tabular-nums',
        },
        head: {
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#8A3F0B',
          backgroundColor: '#FDF0E6',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          borderBottomColor: '#F5C9A6',
          padding: '12px 14px',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: '#FFF1E5' },
          '&.Mui-selected': { backgroundColor: '#FADFC9' },
          '&.Mui-selected:hover': { backgroundColor: '#F9D3B4' },
          '&:focus-visible': { outline: '2px solid #B55A12', outlineOffset: -2 },
          transition: 'background-color 180ms ease',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          width: '100%',
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#B55A12' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B55A12',
            boxShadow: '0 0 0 3px #F9D3B4',
          },
          '&.Mui-disabled': { backgroundColor: '#E4E6EB' },
        },
        notchedOutline: { borderColor: '#CED0D4' },
        input: {
          fontSize: '0.875rem',
          color: '#1C1E21',
          '&::placeholder': { color: '#8A8D91', opacity: 1 },
          '&:disabled': { color: '#8A8D91', WebkitTextFillColor: '#8A8D91' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: '#1C1E21',
          '&.Mui-focused': { color: '#B55A12' },
        },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: '0.6875rem' } } },
    MuiCheckbox: { styleOverrides: { root: { accentColor: '#B55A12', color: '#CED0D4', '&.Mui-checked': { color: '#B55A12' } } } },
    MuiRadio: { styleOverrides: { root: { color: '#CED0D4', '&.Mui-checked': { color: '#B55A12' } } } },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 42,
          fontSize: '0.8125rem',
          textTransform: 'none',
          fontWeight: 600,
          color: '#65676B',
          '&.Mui-selected': { color: '#B55A12', fontWeight: 700 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#E17324', height: 3 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1C1E21',
          boxShadow: '0 1px 2px rgba(0,0,0,.1),0 2px 4px rgba(0,0,0,.04)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #DADDE1',
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,.1),0 8px 16px rgba(0,0,0,.1)',
          border: 'none',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { backgroundColor: '#FDF0E6', color: '#8A3F0B' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: '0.6875rem',
          fontWeight: 700,
          height: 'auto',
          padding: '4px 9px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: { backgroundColor: '#E3F4E7', color: '#1E6B2E' },
        standardWarning: { backgroundColor: '#FCF1DD', color: '#B8790A' },
        standardError: { backgroundColor: '#FDE7EA', color: '#B01F30' },
        standardInfo: { backgroundColor: '#E0F0F1', color: '#0B6E7A' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'background-color 150ms ease',
          '& .MuiListItemIcon-root': { transition: 'transform 200ms ease' },
          '&:hover .MuiListItemIcon-root': { transform: 'scale(1.12)' },
        },
      },
    },
  },
});
