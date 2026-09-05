export interface StockItem {
  material: string;
  centro?: string;
  almacen?: string;
  diferenciacionStock?: string;
  lote: string;
  stockEspecial?: string;
  descripcion: string;
  tipoAlmacen?: string;
  ubicacion: string;
  stockDisponible: number;
  unidad: string;
  fechaCaducidad?: string;
  peso?: number;
  valVista?: string;
}

export interface RackConfig {
  id: number;
  name: string;
  code: string;
  sheet: string;
  moduleCount: number;
  minModule: string;
  maxModule: string;
  modules: string[];
}

export interface SlotData {
  ubicacion: string;
  rackId: number;
  rackCode: string;
  moduloStr: string;
  colNumber: number;
  nivel: number;
  isEmpty: boolean;
  displayText: string;
  materialCode?: string;
  palletCount: number;
  totalStock: number;
  items: StockItem[];
  hasTransfer: boolean;
  hasCriticalDate?: boolean;
}

export type DiscrepancyType = 
  | 'NONE'
  | 'FALTA_FISICA'        // Sistémico ocupado, faltan pallets (ej: Falta 1 de 2, Falta 2 de 2)
  | 'SOBRA_FISICA'        // Físicamente hay más pallets
  | 'DIFERENCIA_CANTIDAD' // Distinta cantidad de pallets
  | 'LOTE_DISTINTO'       // Lote o material no coincide
  | 'OTRO';

export interface AuditFinding {
  ubicacion: string;
  rackId: number;
  systemPallets: number;
  physicalPallets: number;
  differenceDetail: string; // ej: "Falta 1 de 2", "Falta 2 de 2", "Conforme (2 de 2)", "Sobra 1 (3 de 2)"
  badgeLabel: string;       // ej: "FALTA 1/2", "FALTA 2/2", "SOBRA +1", "OK"
  systemMaterial?: string;
  physicalMaterial?: string;
  systemLote?: string;
  physicalLote?: string;
  discrepancyType: DiscrepancyType;
  notes?: string;
  timestamp: string;
  auditorName?: string;
}

export interface AislePair {
  id: number;
  name: string;
  leftRackId: number;
  rightRackId: number;
}

/**
 * Calcula la etiqueta formal de diferencia (ej: "Falta 1 de 2", "Falta 2 de 2", "Conforme (2 de 2)").
 */
export function computeDifferenceLabel(
  systemPallets: number,
  physicalPallets: number,
  discrepancyType?: DiscrepancyType
): { differenceDetail: string; badgeLabel: string; type: DiscrepancyType } {
  if (discrepancyType === 'LOTE_DISTINTO') {
    return {
      differenceDetail: 'Lote o Material distinto al sistémico',
      badgeLabel: 'LOTE DIF',
      type: 'LOTE_DISTINTO'
    };
  }

  if (physicalPallets === systemPallets) {
    return {
      differenceDetail: systemPallets === 0 ? 'Conforme (Espacio Vacío)' : `Conforme (${systemPallets} de ${systemPallets})`,
      badgeLabel: 'OK',
      type: 'NONE'
    };
  }

  if (physicalPallets < systemPallets) {
    const missing = systemPallets - physicalPallets;
    return {
      differenceDetail: `Falta ${missing} de ${systemPallets}`,
      badgeLabel: `FALTA ${missing}/${systemPallets}`,
      type: 'FALTA_FISICA'
    };
  }

  // physicalPallets > systemPallets
  const extra = physicalPallets - systemPallets;
  if (systemPallets === 0) {
    return {
      differenceDetail: `Sobra ${extra} pallet(s) en espacio vacío`,
      badgeLabel: `SOBRA +${extra}`,
      type: 'SOBRA_FISICA'
    };
  }

  return {
    differenceDetail: `Sobra ${extra} (${physicalPallets} de ${systemPallets})`,
    badgeLabel: `SOBRA +${extra}`,
    type: 'SOBRA_FISICA'
  };
}

export type WarehouseZone = 'ALL' | 'CONGELADO' | 'REFRIGERADO';

export type BalanceMetric = 'effortPoints' | 'occupiedSlots' | 'totalSlots' | 'totalPallets';
export type PartitionMode = 'by_aisles' | 'by_racks';

export interface AuditorAssignment {
  id: number;           // 1, 2, 3...
  name: string;         // "Auditor 1", "Auditor 2" o nombre asignado
  color: string;        // Color distintivo para la interfaz
  aisleIds: number[];   // Lista de IDs de pasillos asignados (ej: [5, 6, 7])
  rackIds: number[];    // Lista de IDs de racks asignados (ej: [9, 10, 11, 12, 13, 14])
  effortPoints: number; // Puntaje de esfuerzo: 1pt simple + 2pt doble (vacías 0pt)
  singlePalletSlots: number; // Posiciones simples (1 pallet = 1 punto)
  doublePalletSlots: number; // Posiciones dobles (2 pallets = 2 puntos)
  emptySlots: number;   // Posiciones vacías (0 puntos, fáciles de revisar)
  totalSlots: number;   // Total de posiciones físicas (huecos de altura)
  occupiedSlots: number;// Posiciones ocupadas según SAP
  totalPallets: number; // Total de pallets según SAP
  percentage: number;   // Porcentaje del total de puntos de la zona
}

export interface WorkloadDistributionConfig {
  zone: WarehouseZone;
  auditorCount: number;
  balanceMetric: BalanceMetric;
  partitionMode: PartitionMode;
  assignments: AuditorAssignment[];
  updatedAt: string;
  version: number;
}


