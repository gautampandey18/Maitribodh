import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { api } from '../api.js';
import InternationalPhoneField from '../components/InternationalPhoneField.jsx';
import { toE164Phone } from '../utils/phone.js';

export default function PublicQrPage() {
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('IN');
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookup(event) {
    event.preventDefault();
    const internationalMobile = toE164Phone(mobile, country);
    if (!internationalMobile) {
      setError('Enter a valid mobile number for the selected country.');
      return;
    }

    setLoading(true);
    setError('');
    setItems([]);
    setSearched(false);
    try {
      const response = await api.post('/public/qr-lookups', { mobile: internationalMobile });
      setItems(response.data.items);
      setSearched(true);
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 429) {
        const retryAfter = Number(requestError.response.headers?.['retry-after']);
        setError(Number.isFinite(retryAfter) && retryAfter > 0
          ? `Too many requests. Try again in ${retryAfter} seconds.`
          : 'Too many requests. Try again later.');
      } else {
        setError('QR retrieval is temporarily unavailable. Try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="public-qr-page">
      <Box className="public-qr-header">
        <Box className="brand-lockup public-qr-brand">
          <Box className="brand-mark">M</Box>
          <Box>
            <Typography className="public-qr-brand-title">Maitribodh</Typography>
            <Typography className="brand-caption">ACCESS MANAGEMENT</Typography>
          </Box>
        </Box>
        <Button component={Link} to="/login" startIcon={<ArrowBackOutlinedIcon />}>
          Sign in
        </Button>
      </Box>

      <Box className="public-qr-content">
        <Box className="public-qr-heading">
          <Typography className="eyebrow">MEMBER ACCESS</Typography>
          <Typography component="h1" variant="h1">Retrieve QR</Typography>
          <Typography color="text.secondary">Enter the mobile number associated with the registration.</Typography>
        </Box>

        <Paper component="form" className="public-qr-search" elevation={0} onSubmit={lookup}>
          <InternationalPhoneField
            country={country}
            number={mobile}
            onCountryChange={setCountry}
            onNumberChange={setMobile}
            required
            label="Mobile number"
          />
          <Button type="submit" variant="contained" color="secondary" disabled={loading || !mobile}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Find QR'}
          </Button>
        </Paper>

        {error && <Alert severity="error" className="public-qr-alert">{error}</Alert>}
        {searched && !items.length && (
          <Alert severity="info" className="public-qr-alert">No active registration was found.</Alert>
        )}
        {items.length > 0 && (
          <Box className="public-qr-results" aria-label="QR results">
            <Typography variant="h3">Matching registrations <Typography component="span" color="text.secondary">{items.length}</Typography></Typography>
            {items.map((item, index) => (
              <Paper className="public-qr-result" elevation={0} key={`${item.displayName}-${item.category}-${index}`}>
                <Box>
                  <Typography variant="h3">{item.displayName}</Typography>
                  <Typography color="text.secondary">{item.category}</Typography>
                </Box>
                <img
                  className="public-qr-image"
                  src={`data:image/png;base64,${item.qrPng}`}
                  alt={`QR code for ${item.displayName}`}
                />
                <Tooltip title="Download QR code">
                  <IconButton
                    aria-label={`Download QR code ${index + 1}`}
                    component="a"
                    href={`data:image/png;base64,${item.qrPng}`}
                    download={`maitribodh-qr-${index + 1}.png`}
                  >
                    <DownloadOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
