import { memo } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { phoneCountries } from '../utils/phone.js';

const countryOptions = phoneCountries.map((item) => (
  <MenuItem key={item.country} value={item.country}>
    {item.name} ({item.callingCode})
  </MenuItem>
));

const CountryCodeSelect = memo(function CountryCodeSelect({
  country = 'IN',
  onChange,
  required,
  size = 'medium',
  disabled = false,
  label = 'Country code',
}) {
  return (
    <TextField
      select
      label={label}
      value={country}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      size={size}
      disabled={disabled}
      SelectProps={{
        renderValue: (selected) => {
          const item = phoneCountries.find((c) => c.country === selected);
          return item ? `${item.country} (${item.callingCode})` : selected;
        },
      }}
    >
      {countryOptions}
    </TextField>
  );
});

export default function InternationalPhoneField({
  country = 'IN',
  number = '',
  onCountryChange,
  onNumberChange,
  onBlur,
  error = false,
  helperText,
  required = false,
  label = 'Mobile Number',
  countryCodeLabel,
  size = 'medium',
  disabled = false,
  placeholder,
  sx,
  inputProps,
  InputProps,
  id,
}) {
  const codeLabel = countryCodeLabel || (label && label !== 'Mobile Number' ? `${label} code` : 'Country code');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: size === 'small' ? '120px 1fr' : 'minmax(115px, 135px) 1fr',
        gap: 1,
        minWidth: 0,
        ...sx,
      }}
    >
      <CountryCodeSelect
        country={country}
        onChange={onCountryChange}
        required={required}
        size={size}
        disabled={disabled}
        label={codeLabel}
      />
      <TextField
        id={id}
        label={label}
        type="tel"
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        value={number}
        onChange={(event) => onNumberChange(event.target.value.replace(/\D/g, '').slice(0, 15))}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        required={required}
        autoComplete="tel-national"
        inputProps={{
          inputMode: 'numeric',
          maxLength: 15,
          pattern: '[0-9]{4,15}',
          ...inputProps,
        }}
        InputProps={InputProps}
      />
    </Box>
  );
}
