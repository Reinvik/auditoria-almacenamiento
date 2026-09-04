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
  | 'FALTA_FISICA'      // Sistémico ocupado, físico vacío
  | 'SOBRA_FISICA'      // Sistémico vacío, físico ocupado
  | 'DIFERENCIA_CANTIDAD' // Distinta cantidad de pallets
  | 'LOTE_DISTINTO'     // Lote o material no coincide
  | 'OTRO';

export interface AuditFinding {
  ubicacion: string;
  rackId: number;
  systemPallets: number;
  physicalPallets: number;
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
