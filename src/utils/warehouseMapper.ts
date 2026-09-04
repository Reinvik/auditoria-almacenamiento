import { RackConfig, StockItem, SlotData } from '../types/warehouse';

/**
 * Agrupa los elementos de stock por ubicación para acceso O(1).
 */
export function buildStockIndex(stock: StockItem[]): Map<string, StockItem[]> {
  const index = new Map<string, StockItem[]>();
  for (const item of stock) {
    const loc = item.ubicacion.trim().padStart(7, '0');
    const list = index.get(loc) || [];
    list.push(item);
    index.set(loc, list);
  }
  return index;
}

/**
 * Genera la grilla completa de slots (posiciones) para un Rack dado.
 */
export function generateRackSlots(
  rack: RackConfig,
  stockIndex: Map<string, StockItem[]>
): SlotData[][] {
  const grid: SlotData[][] = [];

  // Recorrer cada módulo del rack (filas)
  for (let colIdx = 0; colIdx < rack.modules.length; colIdx++) {
    const moduloStr = rack.modules[colIdx];
    const rowSlots: SlotData[] = [];

    // Niveles 6 hacia 1 (orden de auditoría en altura: el más alto arriba)
    for (let nivel = 6; nivel >= 1; nivel--) {
      const nivelStr = String(nivel).padStart(2, '0');
      const ubicacion = `${moduloStr}${nivelStr}`;
      const items = stockIndex.get(ubicacion) || [];

      const isEmpty = items.length === 0;
      const palletCount = items.length;
      const materialCode = items.length > 0 ? items[0].material : undefined;

      // Texto de visualización idéntico a la hoja Excel (ej: "2713 x2", "8346 x1", "Vacio")
      let displayText = 'Vacio';
      if (!isEmpty && materialCode) {
        displayText = `${materialCode} x${palletCount}`;
      }

      const hasTransfer = items.some(
        it => it.stockDisponible === 0 || it.valVista === 'TRANSFER'
      );

      const totalStock = items.reduce((acc, it) => acc + (it.stockDisponible || 0), 0);

      rowSlots.push({
        ubicacion,
        rackId: rack.id,
        rackCode: rack.code,
        moduloStr,
        colNumber: colIdx + 1,
        nivel,
        isEmpty,
        displayText,
        materialCode,
        palletCount,
        totalStock,
        items,
        hasTransfer,
      });
    }

    grid.push(rowSlots);
  }

  return grid;
}

/**
 * Calcula estadísticas rápidas de un Rack.
 */
export function calculateRackStats(slotsGrid: SlotData[][]) {
  let totalSlots = 0;
  let occupiedSlots = 0;
  let emptySlots = 0;
  let totalPallets = 0;
  let totalUnits = 0;
  let transferSlots = 0;

  for (const row of slotsGrid) {
    for (const slot of row) {
      totalSlots++;
      if (slot.isEmpty) {
        emptySlots++;
      } else {
        occupiedSlots++;
        totalPallets += slot.palletCount;
        totalUnits += slot.totalStock;
        if (slot.hasTransfer) transferSlots++;
      }
    }
  }

  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return {
    totalSlots,
    occupiedSlots,
    emptySlots,
    totalPallets,
    totalUnits,
    transferSlots,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  };
}
