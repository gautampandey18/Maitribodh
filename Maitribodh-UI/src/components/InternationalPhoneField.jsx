import { memo } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { phoneCountries } from '../utils/phone.js';

const countryOptions = phoneCountries.map((item) => (
  <MenuItem key={item.country} value={item.country}>
    {item.name} ({item.callingCode})
  </MenuItem>
));

const CountryCodeSelect = memo(function CountryCodeSelect({ country, onChange, required }) {
  return (
    <TextField
      select
      label="Country code"
      value={country}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    >
      {countryOptions}
    </TextField>
  );
});

export default function InternationalPhoneField({
  country,
  number,
  onCountryChange,
  onNumberChange,
  required = false,
  label = 'Mobile Number',
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(110px, .55fr) minmax(0, 1.45fr)', gap: 1, minWidth: 0 }}>
      <CountryCodeSelect country={country} onChange={onCountryChange} required={required} />
      <TextField
        label={label}
        type="tel"
        value={number}
        onChange={(event) => onNumberChange(event.target.value.replace(/\D/g, '').slice(0, 15))}
        required={required}
        autoComplete="tel-national"
        inputProps={{ inputMode: 'numeric', maxLength: 15, pattern: '[0-9]{4,15}' }}
      />
    </Box>
  );
}
