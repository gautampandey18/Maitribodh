import { memo } from 'react';
import { Box, TextField, createFilterOptions } from '@mui/material';
import { phoneCountries } from '../utils/phone.js';
import SearchableSelect from './SearchableSelect.jsx';

const countryOptions = phoneCountries.map((item) => ({
  value: item.country,
  label: `${item.name} (${item.callingCode})`,
  callingCode: item.callingCode,
}));

const filterCountries = createFilterOptions({ stringify: (option) => `${option.label} ${option.value}` });

const CountryCodeSelect = memo(function CountryCodeSelect({
  country = 'IN',
  onChange,
  required,
  size = 'medium',
  disabled = false,
  label = 'Country code',
}) {
  return (
    <SearchableSelect
      label={label}
      value={country}
      onChange={onChange}
      options={countryOptions}
      required={required}
      size={size}
      disabled={disabled}
      disableClearable
      renderValue={(option) => `${option.value} (${option.callingCode})`}
      filterOptions={filterCountries}
      sx={{ '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': { fontSize: '.875rem' } }}
    />
  );
});

export default function InternationalPhoneField({
  country = 'IN',
  number = '',
  onCountryChange,
  onNumberChange,
  onBlur,
  onKeyDown,
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
  const codeLabel = countryCodeLabel || (label && label.toLowerCase() !== 'mobile number' ? `${label} code` : 'Country code');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: size === 'small' ? '140px minmax(0, 1fr)' : 'minmax(140px, 150px) minmax(0, 1fr)',
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
        onKeyDown={onKeyDown}
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
