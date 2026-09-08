import { supabase } from '../lib/supabase';
import { AuditFinding, StockItem } from '../types/warehouse';

export interface AuditFindingRow {
  ubicacion: string;
  rack_id: number;
  system_pallets: number;
  physical_pallets: number;
  difference_detail: string;
  badge_label: string;
  system_material?: string | null;
  physical_material?: string | null;
  system_lote?: string | null;
  physical_lote?: string | null;
  discrepancy_type: string;
  notes?: string | null;
  auditor_name?: string | null;
  timestamp: string;
  updated_at?: string;
}

export function findingToRow(f: AuditFinding): AuditFindingRow {
  return {
    ubicacion: f.ubicacion,
    rack_id: f.rackId,
    system_pallets: f.systemPallets,
    physical_pallets: f.physicalPallets,
    difference_detail: f.differenceDetail,
    badge_label: f.badgeLabel,
    system_material: f.systemMaterial || null,
    physical_material: f.physicalMaterial || null,
    system_lote: f.systemLote || null,
    physical_lote: f.physicalLote || null,
    discrepancy_type: f.discrepancyType,
    notes: f.notes || null,
    auditor_name: f.auditorName || null,
    timestamp: f.timestamp || new Date().toISOString(),
  };
}

export function rowToFinding(r: AuditFindingRow): AuditFinding {
  return {
    ubicacion: r.ubicacion,
    rackId: r.rack_id,
    systemPallets: r.system_pallets,
    physicalPallets: r.physical_pallets,
    differenceDetail: r.difference_detail,
    badgeLabel: r.badge_label,
    systemMaterial: r.system_material || undefined,
    physicalMaterial: r.physical_material || undefined,
    systemLote: r.system_lote || undefined,
    physicalLote: r.physical_lote || undefined,
    discrepancyType: (r.discrepancy_type as any) || 'NONE',
    notes: r.notes || undefined,
    timestamp: r.timestamp,
    auditorName: r.auditor_name || undefined,
  };
}

/**
 * Carga todos los hallazgos de auditoría registrados en Supabase.
 */
export async function fetchAuditFindingsFromSupabase(): Promise<Map<string, AuditFinding>> {
  const map = new Map<string, AuditFinding>();
  try {
    const { data, error } = await supabase
      .from('altura_audit_findings')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('Error al cargar hallazgos desde Supabase:', error);
      return map;
    }

    if (data) {
      for (const row of data as AuditFindingRow[]) {
        map.set(row.ubicacion, rowToFinding(row));
      }
    }
  } catch (err) {
    console.warn('Error de red al conectar con Supabase:', err);
  }
  return map;
}

/**
 * Guarda o actualiza un hallazgo de celda en Supabase.
 */
export async function saveAuditFindingToSupabase(finding: AuditFinding): Promise<boolean> {
  try {
    const row = findingToRow(finding);
    const { error } = await supabase
      .from('altura_audit_findings')
      .upsert({ ...row, updated_at: new Date().toISOString() });

    if (error) {
      console.warn('Error al guardar hallazgo en Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error de red al guardar hallazgo:', err);
    return false;
  }
}

/**
 * Elimina un hallazgo de auditoría en Supabase para una ubicación.
 */
export async function deleteAuditFindingFromSupabase(ubicacion: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('altura_audit_findings')
      .delete()
      .eq('ubicacion', ubicacion);

    if (error) {
      console.warn('Error al eliminar hallazgo de Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error de red al eliminar hallazgo:', err);
    return false;
  }
}

/**
 * Limpia todas las auditorías en Supabase (reinicio global).
 */
export async function clearAllAuditFindingsFromSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('altura_audit_findings')
      .delete()
      .neq('ubicacion', '');

    if (error) {
      console.warn('Error al limpiar hallazgos en Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error de red al limpiar hallazgos:', err);
    return false;
  }
}

/**
 * Carga el stock / inventario compartido activo desde Supabase.
 */
export async function fetchWarehouseStateFromSupabase(): Promise<{
  stockData: StockItem[];
  fileName?: string;
  updatedAt?: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('altura_warehouse_state')
      .select('*')
      .eq('id', 'current')
      .maybeSingle();

    if (error || !data) return null;
    return {
      stockData: data.stock_data as StockItem[],
      fileName: data.file_name,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Error al obtener estado del almacén desde Supabase:', err);
    return null;
  }
}

/**
 * Guarda el stock / inventario compartido en Supabase para sincronizarlo con otros dispositivos.
 */
export async function saveWarehouseStateToSupabase(
  stockData: StockItem[],
  fileName?: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('altura_warehouse_state')
      .upsert({
        id: 'current',
        stock_data: stockData,
        file_name: fileName || 'Inventario Actual',
        updated_by: updatedBy || 'Auditor',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Error al sincronizar estado de stock en Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error de red al guardar estado en Supabase:', err);
    return false;
  }
}

/**
 * Suscripción en tiempo real (Supabase Realtime) para escuchar cambios multi-dispositivo.
 */
export function subscribeToRealtimeChanges(
  onFindingUpsert: (finding: AuditFinding) => void,
  onFindingDelete: (ubicacion: string) => void,
  onWarehouseStateUpdate: (stockData: StockItem[]) => void
) {
  const channel = supabase
    .channel('altura_realtime_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'altura_audit_findings' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const finding = rowToFinding(payload.new as AuditFindingRow);
          onFindingUpsert(finding);
        } else if (payload.eventType === 'DELETE') {
          const ubicacion = (payload.old as any)?.ubicacion;
          if (ubicacion) {
            onFindingDelete(ubicacion);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'altura_warehouse_state', filter: 'id=eq.current' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const stock = (payload.new as any)?.stock_data;
          if (Array.isArray(stock) && stock.length > 0) {
            onWarehouseStateUpdate(stock);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
