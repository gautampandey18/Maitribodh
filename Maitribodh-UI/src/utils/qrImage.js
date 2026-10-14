export async function scanQrImage(scanner, file) {
  try {
    return await scanner.scanFile(file, false);
  } catch {
    // Retry detection failures with normalized images, using the same Html5-QRCode reader.
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const loaded = new Image();
      loaded.onload = () => resolve(loaded);
      loaded.onerror = () => reject(new Error('The selected image could not be opened.'));
      loaded.src = url;
    });
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new Error('The selected image is empty.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('This browser cannot process QR images.');
    const side = Math.min(width, height);
    const regions = [
      { x: 0, y: 0, width, height },
      { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side },
    ];
    for (const region of regions) {
      const sizes = [...new Set([Math.min(1600, Math.max(region.width, region.height)), 800, 400])];
      for (const size of sizes) {
        const scale = size / Math.max(region.width, region.height);
        const padding = 32;
        const drawWidth = Math.max(1, Math.round(region.width * scale));
        const drawHeight = Math.max(1, Math.round(region.height * scale));
        for (const rotation of [0, 90, 180, 270]) {
          const sideways = rotation === 90 || rotation === 270;
          canvas.width = (sideways ? drawHeight : drawWidth) + padding * 2;
          canvas.height = (sideways ? drawWidth : drawHeight) + padding * 2;
          for (const inverted of [false, true]) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(rotation * Math.PI / 180);
            context.filter = inverted ? 'invert(1)' : 'none';
            context.drawImage(image, region.x, region.y, region.width, region.height, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            context.restore();
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('This browser could not prepare the QR image.');
            const normalized = new File([blob], 'qr-scan.png', { type: 'image/png' });
            try {
              return await scanner.scanFile(normalized, false);
            } catch {
              // A decode miss is expected; continue with the next image variant.
            }
          }
        }
      }
    }
    throw new Error('No readable QR code was found. Crop the image around the entire QR code, leaving its white border visible, and try again.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
