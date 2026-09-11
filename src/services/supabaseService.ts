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
  let isoTimestamp = new Date().toISOString();
  if (f.timestamp && f.timestamp.includes('T')) {
    const parsed = new Date(f.timestamp);
    if (!isNaN(parsed.getTime())) {
      isoTimestamp = parsed.toISOString();
    }
  }

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
    timestamp: isoTimestamp,
  };
}

export function rowToFinding(r: AuditFindingRow): AuditFinding {
  let displayTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (r.timestamp) {
    try {
      const d = new Date(r.timestamp);
      if (!isNaN(d.getTime())) {
        displayTime = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
  }

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
    timestamp: displayTime,
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
 * Carga los hallazgos de auditoría registrados en Supabase para un Rack específico.
 */
export async function fetchAuditFindingsForRack(rackId: number): Promise<Map<string, AuditFinding>> {
  const map = new Map<string, AuditFinding>();
  try {
    const { data, error } = await supabase
      .from('altura_audit_findings')
      .select('*')
      .eq('rack_id', rackId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn(`Error al cargar hallazgos del Rack ${rackId}:`, error);
      return map;
    }

    if (data) {
      for (const row of data as AuditFindingRow[]) {
        map.set(row.ubicacion, rowToFinding(row));
      }
    }
  } catch (err) {
    console.warn(`Error de red al conectar con Supabase para Rack ${rackId}:`, err);
  }
  return map;
}

/**
 * Carga los hallazgos de auditoría registrados en Supabase para un Pasillo (múltiples racks enfrentados).
 */
export async function fetchAuditFindingsForAisle(aisleRackIds: number[]): Promise<Map<string, AuditFinding>> {
  const map = new Map<string, AuditFinding>();
  try {
    const { data, error } = await supabase
      .from('altura_audit_findings')
      .select('*')
      .in('rack_id', aisleRackIds)
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn(`Error al cargar hallazgos del pasillo:`, error);
      return map;
    }

    if (data) {
      for (const row of data as AuditFindingRow[]) {
        map.set(row.ubicacion, rowToFinding(row));
      }
    }
  } catch (err) {
    console.warn(`Error de red al conectar con Supabase para pasillo:`, err);
  }
  return map;
}

/**
 * Sincroniza un Rack individual con la nube de forma bidireccional:
 * 1. Sube cualquier hallazgo local de ese rack que no se haya guardado.
 * 2. Descarga todas las diferencias de ese rack desde Supabase.
 */
export async function syncRackWithCloud(
  rackId: number,
  localFindingsForRack: AuditFinding[]
): Promise<{ success: boolean; cloudFindings: Map<string, AuditFinding>; count: number; error?: string }> {
  try {
    if (localFindingsForRack.length > 0) {
      const rows = localFindingsForRack.map(findingToRow);
      const { error: upsertError } = await supabase
        .from('altura_audit_findings')
        .upsert(rows);
      if (upsertError) {
        console.warn(`Aviso al subir hallazgos locales de Rack ${rackId}:`, upsertError);
      }
    }

    const cloudMap = await fetchAuditFindingsForRack(rackId);
    return {
      success: true,
      cloudFindings: cloudMap,
      count: cloudMap.size,
    };
  } catch (err: any) {
    console.error(`Error al sincronizar Rack ${rackId}:`, err);
    return {
      success: false,
      cloudFindings: new Map(),
      count: 0,
      error: err?.message || 'Error de red al sincronizar con la nube',
    };
  }
}

/**
 * Sincroniza un Pasillo completo con la nube de forma bidireccional.
 */
export async function syncAisleWithCloud(
  aisleRackIds: number[],
  localFindingsForAisle: AuditFinding[]
): Promise<{ success: boolean; cloudFindings: Map<string, AuditFinding>; count: number; error?: string }> {
  try {
    if (localFindingsForAisle.length > 0) {
      const rows = localFindingsForAisle.map(findingToRow);
      const { error: upsertError } = await supabase
        .from('altura_audit_findings')
        .upsert(rows);
      if (upsertError) {
        console.warn(`Aviso al subir hallazgos de pasillo:`, upsertError);
      }
    }

    const cloudMap = await fetchAuditFindingsForAisle(aisleRackIds);
    return {
      success: true,
      cloudFindings: cloudMap,
      count: cloudMap.size,
    };
  } catch (err: any) {
    console.error(`Error al sincronizar pasillo:`, err);
    return {
      success: false,
      cloudFindings: new Map(),
      count: 0,
      error: err?.message || 'Error de red al sincronizar con la nube',
    };
  }
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
