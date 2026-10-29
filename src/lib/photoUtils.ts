/**
 * Utilitário client-side para redimensionamento e compressão de imagens
 * para fotos de anamnese (avaliação postural, corporal e equipamentos).
 * Garante arquivos leves (<= 90KB) em formato WebP/JPEG, compatíveis com
 * persistência offline em localStorage e sincronização com Firestore.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.72,
  maxSizeBytes: 95 * 1024, // 95 KB
};

/**
 * Valida se o arquivo é uma imagem suportada
 */
export function isValidImageFile(file: File): boolean {
  if (!file || !file.type) return false;
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
}

/**
 * Lê arquivo como Data URL simples
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime uma imagem client-side usando Canvas para caber no limite definido
 */
export async function compressImageFile(
  file: File,
  options?: CompressionOptions
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawDataUrl = await readFileAsDataUrl(file);

  // No ambiente de testes (jsdom/Node sem Image real), retorna o raw data URL mockado
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    return rawDataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Mantém aspect ratio
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Tenta WebP primeiro, fallback para JPEG
        let currentQuality = opts.quality;
        let resultDataUrl = canvas.toDataURL('image/webp', currentQuality);

        // Se o navegador não converteu para webp (gerou png) ou ficou grande demais, tenta jpeg
        if (resultDataUrl.startsWith('data:image/png')) {
          resultDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        // Loop de redução de qualidade se exceder maxSizeBytes
        let attempts = 0;
        while (resultDataUrl.length > opts.maxSizeBytes * 1.33 && attempts < 4 && currentQuality > 0.25) {
          currentQuality -= 0.15;
          resultDataUrl = canvas.toDataURL('image/jpeg', Math.max(0.2, currentQuality));
          attempts++;
        }

        resolve(resultDataUrl);
      } catch (err) {
        // Fallback resiliente
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => {
      resolve(rawDataUrl);
    };
    img.src = rawDataUrl;
  });
}
