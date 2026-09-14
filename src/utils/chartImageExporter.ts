/**
 * Utilidades para exportar el gráfico SVG a imagen (PNG/JPEG),
 * descargar el archivo ReporteOcupacionCD.jpg y copiar al portapapeles del sistema
 * para incrustar directamente en Microsoft Outlook.
 */

export interface ExportSvgOptions {
  scale?: number; // 2x para resolución nítida en Outlook y pantallas Retina
  format?: 'image/png' | 'image/jpeg';
  quality?: number; // 0.95 por defecto para JPEG
  backgroundColor?: string;
}

/**
 * Convierte un elemento SVG en un Blob de imagen PNG o JPEG usando Canvas.
 */
export async function exportSvgToBlob(
  svgElement: SVGSVGElement,
  options: ExportSvgOptions = {}
): Promise<Blob> {
  const scale = options.scale ?? 2;
  const format = options.format ?? 'image/png';
  const quality = options.quality ?? 0.95;
  const backgroundColor = options.backgroundColor ?? '#ffffff';

  // Clonar el SVG para no mutar el DOM original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth || 1000;
  const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight || 440;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  // Asegurar que las fuentes y estilos sean legibles
  clone.style.fontFamily = 'Calibri, system-ui, sans-serif';

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobURL);
          reject(new Error('No se pudo inicializar el contexto 2D del Canvas'));
          return;
        }

        // Fondo blanco sólido (vital para Outlook y correos electrónicos)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Suavizado de imagen para alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobURL);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al generar Blob en Canvas'));
            }
          },
          format,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(blobURL);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobURL);
      reject(new Error('Error al cargar imagen vectorial SVG en el Canvas'));
    };

    img.src = blobURL;
  });
}

/**
 * Copia un Blob de imagen PNG directamente al portapapeles del sistema operativo
 * de modo que al presionar Ctrl + V en Outlook, se pegue la imagen incrustada.
 */
export async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    console.warn('Clipboard API no soportada en este entorno');
    return false;
  }

  try {
    // La API de Portapapeles de los navegadores exige image/png para imágenes
    let pngBlob = blob;
    if (blob.type !== 'image/png') {
      // Si recibimos JPEG, convertirlo a PNG para compatibilidad con ClipboardItem
      const img = new Image();
      const url = URL.createObjectURL(blob);
      pngBlob = await new Promise<Blob>((res, rej) => {
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          if (!ctx) return rej(new Error('no ctx'));
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          c.toBlob((b) => (b ? res(b) : rej(new Error('fail'))), 'image/png');
        };
        img.onerror = rej;
        img.src = url;
      });
    }

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Error al copiar imagen al portapapeles:', err);
    return false;
  }
}

/**
 * Descarga un Blob directamente con el nombre indicado
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formato de fecha oficial DD-MM-YYYY (ej: 14-09-2026)
 */
export function formatOfficialDateDDMMYYYY(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
