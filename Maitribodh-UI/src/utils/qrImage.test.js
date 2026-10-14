import { afterEach, expect, it, vi } from 'vitest';
import { scanQrImage } from './qrImage.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function imageEnvironment() {
  const context = { fillRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn() };
  const canvas = {
    getContext: () => context,
    toBlob: (callback) => callback(new Blob(['normalized'], { type: 'image/png' })),
  };
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:qr-image', revokeObjectURL });
  vi.stubGlobal('Image', class {
    naturalWidth = 3000;
    naturalHeight = 4000;
    set src(_url) { queueMicrotask(() => this.onload()); }
  });
  vi.spyOn(document, 'createElement').mockReturnValue(canvas);
  return { canvas, context, revokeObjectURL };
}

it('uses the original file with Html5-QRCode first', async () => {
  const file = new File(['qr'], 'qr.png', { type: 'image/png' });
  const scanner = { scanFile: vi.fn().mockResolvedValue('AMS1.MB-000008.1.signature') };
  expect(await scanQrImage(scanner, file)).toBe('AMS1.MB-000008.1.signature');
  expect(scanner.scanFile).toHaveBeenCalledExactlyOnceWith(file, false);
});

it('retries normalized PNGs with the same Html5-QRCode instance and releases the URL', async () => {
  const { canvas, context, revokeObjectURL } = imageEnvironment();
  const scanner = { scanFile: vi.fn().mockRejectedValueOnce(new Error('No MultiFormat Readers')).mockRejectedValueOnce(new Error('No QR')).mockResolvedValue('signed-payload') };
  const file = new File(['qr'], 'qr.png', { type: 'image/png' });
  expect(await scanQrImage(scanner, file)).toBe('signed-payload');
  expect(scanner.scanFile).toHaveBeenCalledTimes(3);
  expect(scanner.scanFile.mock.calls[1][0]).toBeInstanceOf(File);
  expect(scanner.scanFile.mock.calls[1][0].type).toBe('image/png');
  expect(context.drawImage).toHaveBeenCalledTimes(2);
  expect(canvas.width).toBe(1264);
  expect(canvas.height).toBe(1664);
  expect(context.restore).toHaveBeenCalledTimes(2);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:qr-image');
});

it('reports unreadable images after bounded retries without returning a payload', async () => {
  const { context, revokeObjectURL } = imageEnvironment();
  const scanner = { scanFile: vi.fn().mockRejectedValue(new Error('No QR')) };
  await expect(scanQrImage(scanner, new File(['blank'], 'blank.png'))).rejects.toThrow('No readable QR code was found');
  expect(scanner.scanFile).toHaveBeenCalledTimes(49);
  expect(context.drawImage).toHaveBeenCalledTimes(48);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:qr-image');
});

it('rotates the image when upright and inverted attempts fail', async () => {
  const { canvas, context } = imageEnvironment();
  const scanner = { scanFile: vi.fn().mockRejectedValueOnce(new Error('No QR')).mockRejectedValueOnce(new Error('No QR')).mockRejectedValueOnce(new Error('No QR')).mockResolvedValue('signed-payload') };
  expect(await scanQrImage(scanner, new File(['qr'], 'qr.png'))).toBe('signed-payload');
  expect(context.rotate).toHaveBeenLastCalledWith(Math.PI / 2);
  expect(canvas.width).toBe(1664);
  expect(canvas.height).toBe(1264);
});

it('reports image loading failures and releases the URL', async () => {
  const { revokeObjectURL } = imageEnvironment();
  vi.stubGlobal('Image', class { set src(_url) { queueMicrotask(() => this.onerror()); } });
  const scanner = { scanFile: vi.fn().mockRejectedValue(new Error('No QR')) };
  await expect(scanQrImage(scanner, new File(['bad'], 'bad.png'))).rejects.toThrow('could not be opened');
  expect(revokeObjectURL).toHaveBeenCalled();
});
