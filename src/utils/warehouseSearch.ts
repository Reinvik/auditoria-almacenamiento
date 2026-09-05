import { StockItem } from '../types/warehouse';

export interface WarehouseSearchItem {
  ubicacion: string;
  rackId: number;
  moduloStr: string;
  nivel: number;
  material: string;
  lote: string;
  descripcion: string;
  palletCount: number;
  displayText: string;
}

export interface WarehouseSearchResult {
  query: string;
  totalItems: number;
  totalLocations: number;
  rackCounts: Map<number, number>;
  items: WarehouseSearchItem[];
  matchedRackIds: number[];
}

/**
 * Busca eficientemente en todo el inventario del almacén según el término ingresado
 * (código de material, lote, descripción o ubicación).
 */
export function searchWarehouse(stockData: StockItem[], rawQuery: string): WarehouseSearchResult {
  const query = (rawQuery || '').trim().toLowerCase();

  if (!query) {
    return {
      query: '',
      totalItems: 0,
      totalLocations: 0,
      rackCounts: new Map(),
      items: [],
      matchedRackIds: [],
    };
  }

  const rackCounts = new Map<number, number>();
  const locationMap = new Map<string, StockItem[]>();
  let totalItemsMatched = 0;

  for (const item of stockData) {
    const matMatch = item.material && item.material.toLowerCase().includes(query);
    const descMatch = item.descripcion && item.descripcion.toLowerCase().includes(query);
    const loteMatch = item.lote && item.lote.toLowerCase().includes(query);
    const ubiMatch = item.ubicacion && item.ubicacion.toLowerCase().includes(query);

    if (matMatch || descMatch || loteMatch || ubiMatch) {
      totalItemsMatched++;
      const loc = item.ubicacion.trim().padStart(7, '0');
      const list = locationMap.get(loc) || [];
      list.push(item);
      locationMap.set(loc, list);
    }
  }

  const items: WarehouseSearchItem[] = [];

  for (const [ubicacion, groupedItems] of locationMap.entries()) {
    const rackId = parseInt(ubicacion.slice(0, 3), 10);
    const moduloStr = ubicacion.slice(0, 5);
    const nivel = parseInt(ubicacion.slice(5, 7), 10);

    const currentCount = rackCounts.get(rackId) || 0;
    rackCounts.set(rackId, currentCount + 1);

    const firstItem = groupedItems[0];
    const lotes = Array.from(new Set(groupedItems.map(it => it.lote).filter(Boolean))).join(', ');

    items.push({
      ubicacion,
      rackId,
      moduloStr,
      nivel,
      material: firstItem.material || '—',
      lote: lotes || '—',
      descripcion: firstItem.descripcion || '—',
      palletCount: groupedItems.length,
      displayText: `${firstItem.material} x${groupedItems.length}`,
    });
  }

  // Ordenar los ítems por Rack y luego por Ubicación
  items.sort((a, b) => {
    if (a.rackId !== b.rackId) return a.rackId - b.rackId;
    return a.ubicacion.localeCompare(b.ubicacion);
  });

  const matchedRackIds = Array.from(rackCounts.keys()).sort((a, b) => a - b);

  return {
    query,
    totalItems: totalItemsMatched,
    totalLocations: items.length,
    rackCounts,
    items,
    matchedRackIds,
  };
}
