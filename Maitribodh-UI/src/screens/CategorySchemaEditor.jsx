import { useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, TextField, Tooltip } from '@mui/material';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { api } from '../api.js';
import { requestMessage } from '../utils/resources.js';

const sources = ['DEPARTMENT', 'JOB_ROLE', 'SUBCATEGORY', 'PROGRAM_BATCH', 'ID_PROOF_TYPE', 'BLACKLIST_REASON', 'PERMISSION_LEVEL', 'AREA'];
export default function CategorySchemaEditor({ category, onSaved }) {
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function open() {
    setError('');
    try {
      const { data } = await api.get('/persons/registration/options');
      setSchema(data.categories.find((item) => item.category_id === category.category_id)?.schema ?? { fields: [], addressRequired: false, emergencyRequired: false });
    } catch (failure) { setError(requestMessage(failure)); }
  }
  function change(index, key, value) {
    setSchema((previous) => ({
      ...previous,
      fields: previous.fields.map((field, position) => {
        if (position !== index) return field;
        if (key === 'type') {
          const rest = Object.fromEntries(Object.entries(field).filter(([fieldKey]) => !['source', 'options', 'optionsText'].includes(fieldKey)));
          return { ...rest, type: value, ...(value === 'select' ? { source: null, options: [] } : {}) };
        }
        return { ...field, [key]: value };
      }),
    }));
  }
  function move(index, offset) {
    const fields = [...schema.fields];
    [fields[index], fields[index + offset]] = [fields[index + offset], fields[index]];
    setSchema({ ...schema, fields });
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const formSchema = { ...schema, fields: schema.fields.map(({ optionsText, ...field }) => ({ ...field, ...(optionsText !== undefined ? { options: [...new Set(optionsText.split(',').map((option) => option.trim()).filter(Boolean))] } : {}) })) };
      await api.patch(`/categories/${category.category_id}`, { formSchema }); setSchema(null); onSaved();
    }
    catch (failure) { setError(requestMessage(failure)); } finally { setBusy(false); }
  }
  return <><Tooltip title="Edit registration fields"><IconButton aria-label={`Edit fields for ${category.name}`} onClick={open}><FormatListBulletedOutlinedIcon /></IconButton></Tooltip>{error && !schema && <Alert severity="error">{error}</Alert>}<Dialog open={Boolean(schema)} onClose={() => !busy && setSchema(null)} fullWidth maxWidth="md"><Box component="form" onSubmit={save}><DialogTitle>Registration Fields · {category.name}</DialogTitle><DialogContent>{error && <Alert severity="error">{error}</Alert>}<FormControlLabel control={<Checkbox checked={schema?.addressRequired ?? false} onChange={(event) => setSchema({ ...schema, addressRequired: event.target.checked })} />} label="Address required" /><FormControlLabel control={<Checkbox checked={schema?.emergencyRequired ?? false} onChange={(event) => setSchema({ ...schema, emergencyRequired: event.target.checked })} />} label="Emergency contact required" />
    {schema?.fields.map((field, index) => <Box key={index} sx={{ display: 'grid', gap: 1.5, py: 2, borderBottom: '1px solid #ddd' }}><Box className="form-grid"><TextField label="Field key" value={field.key} onChange={(event) => change(index, 'key', event.target.value)} required inputProps={{ pattern: '[a-z][a-z0-9_]{0,49}' }} /><TextField label="Label" value={field.label} onChange={(event) => change(index, 'label', event.target.value)} required /><TextField select label="Type" value={field.type} onChange={(event) => change(index, 'type', event.target.value)}>{['text', 'date', 'number', 'select'].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>{field.type === 'select' && <><TextField select label="Dropdown source" value={field.source ?? ''} onChange={(event) => change(index, 'source', event.target.value || null)}><MenuItem value="">Custom options</MenuItem>{sources.map((source) => <MenuItem key={source} value={source}>{source}</MenuItem>)}</TextField>{!field.source && <TextField label="Options (comma separated)" value={field.optionsText ?? (field.options ?? []).join(', ')} onChange={(event) => change(index, 'optionsText', event.target.value)} />}</>}</Box><Box><FormControlLabel control={<Checkbox checked={field.required} onChange={(event) => change(index, 'required', event.target.checked)} />} label="Required" /><Tooltip title="Move up"><span><IconButton aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUpwardIcon /></IconButton></span></Tooltip><Tooltip title="Move down"><span><IconButton aria-label={`Move ${field.label} down`} disabled={index === schema.fields.length - 1} onClick={() => move(index, 1)}><ArrowDownwardIcon /></IconButton></span></Tooltip><Tooltip title="Remove field"><IconButton aria-label={`Remove ${field.label}`} onClick={() => setSchema({ ...schema, fields: schema.fields.filter((_field, position) => position !== index) })}><DeleteOutlineIcon /></IconButton></Tooltip></Box></Box>)}<Button onClick={() => setSchema({ ...schema, fields: [...schema.fields, { key: `field_${schema.fields.length + 1}`, label: 'New Field', type: 'text', required: false }] })} disabled={(schema?.fields.length ?? 0) >= 50}>Add Field</Button></DialogContent><DialogActions><Button onClick={() => setSchema(null)} disabled={busy}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>Save Schema</Button></DialogActions></Box></Dialog></>;
}