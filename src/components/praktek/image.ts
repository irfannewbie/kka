/** Membaca gambar dari perangkat dan mengompresnya agar aman untuk localStorage. */

const MAX_DATA_URL_LENGTH = 1_400_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca berkas.'));
    reader.readAsDataURL(file);
  });
}

interface LoadedImage {
  width: number;
  height: number;
  source: CanvasImageSource;
  close?: () => void;
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Gagal membaca gambar.'));
      element.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      source: image,
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/**
 * Mengembalikan data URL gambar.
 * PNG kecil dipertahankan (transparansi); selain itu dikompres ke JPEG.
 */
export async function readImageFile(file: File, maxSize = 1200): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar.');
  }

  if (file.type === 'image/png' && file.size <= 900_000) {
    return fileToDataUrl(file);
  }

  const image = await loadImage(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas tidak tersedia di browser ini.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image.source, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.62);
    }
    return dataUrl;
  } finally {
    image.close?.();
  }
}
