import { useCallback, useEffect, useState } from 'react';
import { Alert, Avatar, Box, Button, CircularProgress, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { api } from '../api.js';
import { downloadBlob, requestMessage } from '../utils/resources.js';

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character]);
}

function wrapText(value, limit = 42) {
  const words = String(value ?? '—').split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    while (word.length > limit) {
      if (line) { lines.push(line); line = ''; }
      lines.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    if (line && `${line} ${word}`.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
}

export function buildIdentityCardSvg({ name, personCode, category, status, mobile, photoData, qrData, fields = [] }) {
  const width = 1200;
  const rows = [];
  for (let index = 0; index < fields.length; index += 2) {
    const rowFields = fields.slice(index, index + 2).map(([label, value], column) => ({
      label,
      lines: wrapText(value, 38),
      x: 56 + column * 560,
    }));
    rows.push({ fields: rowFields, height: Math.max(88, ...rowFields.map(({ lines }) => 46 + lines.length * 25)) });
  }
  const contentHeight = rows.reduce((total, row) => total + row.height, 0);
  const height = Math.max(610, 84 + 220 + 68 + contentHeight + 48);
  const photo = photoData
    ? `<image href="${photoData}" x="56" y="126" width="145" height="164" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="56" y="126" width="145" height="164" rx="12" fill="#FDF0E6"/><text x="128" y="220" text-anchor="middle" font-size="54" font-weight="700" fill="#8A3F0B">${escapeXml((name ?? '').split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase())}</text>`;
  let rowY = 388;
  const fieldMarkup = rows.map(({ fields: rowFields, height: rowHeight }) => {
    const content = rowFields.map(({ label, lines, x }) => `
      <text x="${x}" y="${rowY + 25}" fill="#65676B" font-size="16" font-family="Arial,sans-serif">${escapeXml(label)}</text>
      ${lines.map((line, lineIndex) => `<text x="${x}" y="${rowY + 53 + lineIndex * 25}" fill="#1C1E21" font-size="19" font-weight="600" font-family="Arial,sans-serif">${escapeXml(line)}</text>`).join('')}`).join('');
    const result = `<line x1="56" y1="${rowY + rowHeight}" x2="${width - 56}" y2="${rowY + rowHeight}" stroke="#F0E2D6"/>${content}`;
    rowY += rowHeight;
    return result;
  }).join('');
  const cardHeight = Math.max(height, rowY + 42);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}">
    <rect width="100%" height="100%" rx="24" fill="#ffffff"/>
    <path d="M24 0h1152a24 24 0 0 1 24 24v60H0V24A24 24 0 0 1 24 0" fill="#C76519"/>
    <text x="56" y="53" fill="#ffffff" font-size="25" font-weight="800" letter-spacing="1.5" font-family="Arial,sans-serif">MAITRIBODH ASHRAM</text>
    <text x="${width - 56}" y="52" text-anchor="end" fill="#ffffff" font-size="18" font-weight="700" letter-spacing="1.5" font-family="Arial,sans-serif">IDENTITY CARD</text>
    <rect x="0" y="84" width="${width}" height="${cardHeight - 84}" fill="#FFFCF9"/>
    ${photo}
    <text x="230" y="149" fill="#1C1E21" font-size="35" font-weight="800" font-family="Arial,sans-serif">${escapeXml(name || '—')}</text>
    <text x="230" y="188" fill="#1C1E21" font-size="21" font-family="Consolas,monospace">${escapeXml(personCode || '—')}</text>
    <text x="230" y="226" fill="#8A3F0B" font-size="18" font-weight="700" font-family="Arial,sans-serif">${escapeXml(category || '—')}</text>
    <text x="230" y="258" fill="#2E7D32" font-size="17" font-weight="700" font-family="Arial,sans-serif">${escapeXml(status === 'DEACTIVATED' ? 'Inactive' : status || '—')}</text>
    <text x="230" y="297" fill="#65676B" font-size="17" font-family="Arial,sans-serif">Mobile: ${escapeXml(mobile || '—')}</text>
    ${qrData ? `<image href="${qrData}" x="954" y="112" width="190" height="190" preserveAspectRatio="xMidYMid meet"/>` : ''}
    <text x="1049" y="326" text-anchor="middle" fill="#65676B" font-size="15" font-weight="700" font-family="Arial,sans-serif">SCAN AT GATE</text>
    <text x="56" y="362" fill="#8A3F0B" font-size="21" font-weight="800" font-family="Arial,sans-serif">IDENTITY DETAILS</text>
    <line x1="56" y1="372" x2="${width - 56}" y2="372" stroke="#F3D2B6"/>
    ${fieldMarkup}
    <text x="${width / 2}" y="${cardHeight - 14}" text-anchor="middle" fill="#65676B" font-size="14" font-style="italic" font-family="Arial,sans-serif">Please present this card at the Security Gate.</text>
  </svg>`;
}

function blobDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the card image data.'));
    reader.readAsDataURL(blob);
  });
}

async function imageSourceDataUrl(source) {
  if (!source) return null;
  const response = await fetch(source);
  if (!response.ok) throw new Error('Could not load the profile photo for the ID card.');
  return blobDataUrl(await response.blob());
}

async function createIdentityCardPng({ photoSrc, qrBlob, ...identity }) {
  const [photoData, qrData] = await Promise.all([
    imageSourceDataUrl(photoSrc),
    qrBlob ? blobDataUrl(qrBlob) : Promise.resolve(null),
  ]);
  const svgBlob = new Blob([buildIdentityCardSvg({ ...identity, photoData, qrData })], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.src = svgUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Could not render the ID card image.'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is not supported in this browser.');
    context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the ID card download.')), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function QrPreview({ personId, personCode, onQrBlob, showPreview = true }) {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let url;
    api.get(`/persons/${personId}/qr`, { responseType: 'blob' })
      .then(({ data }) => {
        if (active) {
          url = URL.createObjectURL(data);
          setImage(url);
          onQrBlob?.(data);
        }
      })
      .catch((failure) => {
        if (active) setError(requestMessage(failure, 'QR is not available for this person.'));
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [personId, onQrBlob]);

  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!image) return <CircularProgress size={20} aria-label="Loading QR code" />;
  if (!showPreview) return null;
  return (
    <Box className="idc-qr-content">
      <Box component="img" src={image} alt={`QR code for ${personCode}`} className="idc-qr-image" />
    </Box>
  );
}

function statusSx(status) {
  if (status === 'ACTIVE') return { background: '#E6F4EA', color: '#2E7D32', fontWeight: 700 };
  if (status === 'REJECTED' || status === 'DEACTIVATED') return { background: '#FDECEA', color: '#C62828', fontWeight: 700 };
  return { background: '#FFF3E0', color: '#E65100', fontWeight: 700 };
}

function statusLabel(status) {
  return status === 'DEACTIVATED' ? 'Inactive' : status || '—';
}

function CardField({ label, value }) {
  return (
    <Box className="idc-row">
      <Box component="span">{label}</Box>
      <Box component="b">{value === null || value === undefined || value === '' ? '—' : value}</Box>
    </Box>
  );
}

export default function PersonIdentityCard({
  personId,
  personCode,
  name,
  category,
  status,
  photoSrc,
  mobile,
  qrVersion,
  onQrBlob,
  footer,
  fields = [],
  displayCard = true,
}) {
  const initials = name?.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '';
  const [qrBlob, setQrBlob] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const receiveQrBlob = useCallback((blob) => {
    setQrBlob(blob);
    onQrBlob?.(blob);
  }, [onQrBlob]);

  async function downloadCard() {
    setDownloading(true);
    setDownloadError('');
    try {
      const blob = await createIdentityCardPng({ name, personCode, category, status, mobile, photoSrc, qrBlob, fields });
      downloadBlob(blob, `Maitribodh-ID-Card-${personCode}.png`);
    } catch (failure) {
      setDownloadError(requestMessage(failure, 'Could not download the complete ID card.'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Box component={displayCard ? 'section' : 'div'} className={displayCard ? 'idc-card' : 'idc-download-only'} aria-label={displayCard ? 'Identity card' : 'ID card download'}>
      {displayCard && <>
        <Box className="idc-band">
          <span className="idc-org">MAITRIBODH ASHRAM</span>
          <span className="idc-kind">IDENTITY CARD</span>
        </Box>
        <Box className="idc-main">
          <Box className="idc-profile">
            {photoSrc
              ? <Box component="img" src={photoSrc} alt={`${name} profile`} className="idc-photo" />
              : <Avatar className="idc-photo" aria-hidden="true">{initials}</Avatar>}
            <Box className="idc-profile-info">
              <Typography className="idc-name">{name || '—'}</Typography>
              <Box className="idc-id">{personCode || '—'}</Box>
              <Box className="idc-badges">
                {category && <Box component="span" className="idc-category">{category}</Box>}
                <Box component="span" className="idc-status" style={statusSx(status)}>{statusLabel(status)}</Box>
              </Box>
              <CardField label="Mobile" value={mobile} />
            </Box>
          </Box>
          <Box className="idc-qr-panel">
            <QrPreview personId={personId} personCode={personCode} onQrBlob={receiveQrBlob} />
            <Typography className="idc-scan-label">Scan at gate</Typography>
          </Box>
        </Box>
        <Box className="idc-details">
          {fields.map(([label, value]) => <CardField key={label} label={label} value={value} />)}
        </Box>
      </>}
      {!displayCard && <QrPreview personId={personId} personCode={personCode} onQrBlob={receiveQrBlob} showPreview={false} />}
      {downloadError && <Alert severity="error" className="idc-download-error">{downloadError}</Alert>}
      <Box className={displayCard ? 'idc-actions' : 'idc-download-only-actions'}>
        {displayCard && <Typography className="idc-qr-version">{qrVersion ? `QR v${qrVersion}` : ''}</Typography>}
        <Box className="idc-card-actions">
          {footer}
          <Button size="small" startIcon={downloading ? <CircularProgress size={16} /> : <DownloadOutlinedIcon />} onClick={downloadCard} disabled={!qrBlob || downloading}>
            {downloading ? 'Preparing ID card…' : 'Download ID card'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
