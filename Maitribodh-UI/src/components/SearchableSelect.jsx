import { memo, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  TextField,
  styled,
} from '@mui/material';

/**
 * SearchableSelect is a reusable, globally searchable dropdown component.
 * It provides consistent searchable behavior across all dropdowns in the application.
 *
 * Props:
 * - label: Display label for the field
 * - value: Currently selected value
 * - onChange: Callback when selection changes
 * - options: Array of options with shape { value, label } or { value, label, group }
 * - required: Whether field is required
 * - disabled: Whether field is disabled
 * - error: Whether field has error
 * - helperText: Helper text to display
 * - size: Field size ('small' | 'medium')
 * - placeholder: Placeholder text
 * - renderOption: Optional custom render function for options
 * - renderValue: Optional custom render function for selected value
 * - groupBy: Optional function to group options
 * - sx: Additional MUI sx prop
 */

const StyledAutocomplete = styled(Autocomplete)(() => ({
  '& .MuiAutocomplete-paper': {
    maxHeight: '300px',
  },
}));

const SearchableSelect = memo(function SearchableSelect({
  label,
  value = null,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  size = 'medium',
  placeholder = '',
  renderOption,
  renderValue,
  groupBy,
  multiple = false,
  sx,
  name,
  id,
  ...otherProps
}) {
  // Normalize options to ensure consistency
  const normalizedOptions = useMemo(
    () =>
      options.map((option) => {
        if (typeof option === 'string' || typeof option === 'number') {
          return { value: option, label: String(option) };
        }
        return {
          value: option.value ?? option,
          label: option.label ?? String(option.value ?? option),
          ...option,
        };
      }),
    [options]
  );

  // Handle both single and multiple selections
  const displayValue = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return normalizedOptions.filter((opt) => value.includes(opt.value));
    }
    return normalizedOptions.find((opt) => opt.value === value) || null;
  }, [normalizedOptions, value, multiple]);

  const handleChange = (event, newValue) => {
    if (onChange) {
      if (multiple) {
        onChange(Array.isArray(newValue) ? newValue.map((v) => v.value) : []);
      } else {
        onChange(newValue ? newValue.value : null);
      }
    }
  };

  return (
    <StyledAutocomplete
      id={id || name}
      options={normalizedOptions}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      groupBy={groupBy}
      getOptionLabel={(option) => {
        if (!option) return '';
        if (renderValue) return renderValue(option);
        return option.label || String(option.value);
      }}
      renderOption={(props, option) => {
        if (renderOption) {
          return renderOption(props, option);
        }
        return (
          <Box component="li" {...props}>
            {option.label || option.value}
          </Box>
        );
      }}
      isOptionEqualToValue={(option, val) => option?.value === val?.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          size={size}
        />
      )}
      noOptionsText="No options found"
      loadingText="Loading..."
      multiple={multiple}
      sx={{
        minWidth: 0,
        ...sx,
      }}
      {...otherProps}
    />
  );
});

export default SearchableSelect;
