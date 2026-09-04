import * as XLSX from 'xlsx';
import { StockItem } from '../types/warehouse';

/**
 * Normaliza nombres de encabezados eliminando tildes y caracteres especiales.
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parsea números formateados con coma o punto decimal (ej: "443.800" o "140,5").
 */
function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim();
  // Si tiene coma y punto, asumimos formato latino (1.234,56)
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  }
  // Si solo tiene coma
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.'));
  }
  return parseFloat(str) || 0;
}

/**
 * Parsea texto pegado desde SAP o Excel (separado por tabulaciones o comas).
 */
export function parsePastedData(text: string): StockItem[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detectar delimitador (tabulaciones \t, punto y coma ;, o coma ,)
  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(',')) delimiter = ',';

  const rawHeaders = firstLine.split(delimiter).map(h => h.trim());
  const normHeaders = rawHeaders.map(normalizeHeader);

  // Mapear índices de columnas esperadas
  const colIndex: { [key: string]: number } = {
    material: normHeaders.findIndex(h => h.includes('material') || h === 'codigo' || h === 'cod'),
    centro: normHeaders.findIndex(h => h.includes('centro') || h === 'ce'),
    almacen: normHeaders.findIndex(h => h.includes('almacen') || h === 'alm'),
    lote: normHeaders.findIndex(h => h.includes('lote')),
    descripcion: normHeaders.findIndex(h => h.includes('descrip') || h.includes('texto')),
    tipoAlmacen: normHeaders.findIndex(h => h.includes('tipoalm') || h.includes('tipo')),
    ubicacion: normHeaders.findIndex(h => h.includes('ubicaci') || h === 'ubi'),
    stock: normHeaders.findIndex(h => h.includes('stockdispon') || h.includes('stock') || h.includes('cantidad') || h.includes('cant')),
    unidad: normHeaders.findIndex(h => h.includes('unidad') || h.includes('umb') || h === 'un'),
    fecha: normHeaders.findIndex(h => h.includes('caduc') || h.includes('fecaduc') || h.includes('fecha') || h.includes('fpc')),
    peso: normHeaders.findIndex(h => h.includes('peso') || h.includes('kg')),
  };

  const hasHeaderRow = colIndex.ubicacion !== -1 || colIndex.material !== -1;
  const startLine = hasHeaderRow ? 1 : 0;

  const results: StockItem[] = [];

  for (let i = startLine; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map(p => p.trim());
    if (parts.length === 0 || parts.every(p => p === '')) continue;

    let ubicacion = '';
    let material = '';
    let lote = '';
    let descripcion = '';
    let centro = 'SGSJ';
    let almacen = 'NCD1';
    let tipoAlmacen = '';
    let stock = 0;
    let unidad = 'UN';
    let fechaCaducidad = '';
    let peso = 0;

    if (hasHeaderRow) {
      ubicacion = colIndex.ubicacion !== -1 ? parts[colIndex.ubicacion] || '' : '';
      material = colIndex.material !== -1 ? parts[colIndex.material] || '' : '';
      lote = colIndex.lote !== -1 ? parts[colIndex.lote] || '' : '';
      descripcion = colIndex.descripcion !== -1 ? parts[colIndex.descripcion] || '' : '';
      centro = colIndex.centro !== -1 ? parts[colIndex.centro] || 'SGSJ' : 'SGSJ';
      almacen = colIndex.almacen !== -1 ? parts[colIndex.almacen] || 'NCD1' : 'NCD1';
      tipoAlmacen = colIndex.tipoAlmacen !== -1 ? parts[colIndex.tipoAlmacen] || '' : '';
      stock = colIndex.stock !== -1 ? parseNumber(parts[colIndex.stock]) : 0;
      unidad = colIndex.unidad !== -1 ? parts[colIndex.unidad] || 'UN' : 'UN';
      fechaCaducidad = colIndex.fecha !== -1 ? parts[colIndex.fecha] || '' : '';
      peso = colIndex.peso !== -1 ? parseNumber(parts[colIndex.peso]) : 0;
    } else {
      // Intentar auto-detección por posición común de SAP (Material=0, Centro=1, Almacen=2, Lote=4, Desc=6, Tipo=7, Ubic=8, Stock=9, UMB=10, Fecha=11, Peso=12)
      material = parts[0] || '';
      centro = parts[1] || 'SGSJ';
      almacen = parts[2] || 'NCD1';
      lote = parts[4] || '';
      descripcion = parts[6] || '';
      tipoAlmacen = parts[7] || '';
      ubicacion = parts[8] || '';
      stock = parseNumber(parts[9]);
      unidad = parts[10] || 'UN';
      fechaCaducidad = parts[11] || '';
      peso = parseNumber(parts[12]);
    }

    // Limpiar ubicación (remover espacios, asegurarse de que tenga formato)
    const cleanUbic = ubicacion.replace(/\s+/g, '');
    if (cleanUbic.length >= 5) {
      results.push({
        material: material.replace(/^0+/, '') || material, // Remover ceros a la izquierda si los hay
        centro,
        almacen,
        lote,
        descripcion,
        tipoAlmacen,
        ubicacion: cleanUbic.padStart(7, '0'), // Normalizar a 7 dígitos
        stockDisponible: stock,
        unidad,
        fechaCaducidad,
        peso,
        valVista: stock === 0 ? 'TRANSFER' : 'OK'
      });
    }
  }

  return results;
}

/**
 * Lee un archivo Excel (.xlsx / .xlsm / .csv) subido por el usuario.
 */
export async function parseExcelFile(file: File): Promise<StockItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Buscar hoja prioritaria: BBD, Stock, Base o la primera
  const targetSheetName = 
    workbook.SheetNames.find(s => s.toUpperCase() === 'BBD') ||
    workbook.SheetNames.find(s => s.toUpperCase().includes('STOCK')) ||
    workbook.SheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!jsonData || jsonData.length === 0) return [];

  // Convertir a texto delimitado por tabulaciones y usar parsePastedData
  const textRepresentation = jsonData
    .filter(row => row && row.length > 0)
    .map(row => row.map(cell => (cell !== null && cell !== undefined ? String(cell) : '')).join('\t'))
    .join('\n');

  return parsePastedData(textRepresentation);
}
