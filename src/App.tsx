import React, { useState, useMemo, useEffect } from 'react';
import { StockItem, SlotData, AuditFinding } from './types/warehouse';
import { WAREHOUSE_RACKS, DEFAULT_AISLES } from './config/warehouseConfig';
import { INITIAL_STOCK_DATA } from './data/initialStockData';
import { buildStockIndex, generateRackSlots, calculateRackStats } from './utils/warehouseMapper';
import { Navbar } from './components/Navbar';
import { RackTabs, ViewMode, FilterType } from './components/RackTabs';
import { RackGridView } from './components/RackGridView';
import { AisleDoubleView } from './components/AisleDoubleView';
import { CellDetailModal } from './components/CellDetailModal';
import { DataImportModal } from './components/DataImportModal';
import { ReportModal } from './components/ReportModal';
import { ClipboardCheck } from 'lucide-react';

const LOCAL_STORAGE_STOCK_KEY = 'auditoria_almacenamiento_stock_v1';
const LOCAL_STORAGE_AUDIT_KEY = 'auditoria_almacenamiento_audit_v1';

export default function App() {
  // 1. Stock Data
  const [stockData, setStockData] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STOCK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stock from localStorage', e);
    }
    return INITIAL_STOCK_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_STOCK_KEY, JSON.stringify(stockData));
    } catch (e) {
      console.warn('Storage quota exceeded or error saving stock', e);
    }
  }, [stockData]);

  // 2. Audit Findings
  const [auditFindings, setAuditFindings] = useState<Map<string, AuditFinding>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
      if (saved) {
        const parsed: [string, AuditFinding][] = JSON.parse(saved);
        return new Map<string, AuditFinding>(parsed);
      }
    } catch (e) {
      console.error('Error loading audit findings', e);
    }
    return new Map<string, AuditFinding>();
  });

  useEffect(() => {
    try {
      const entries = Array.from(auditFindings.entries());
      localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Error saving audit findings', e);
    }
  }, [auditFindings]);

  // 3. Navigation & Views (Default to Rack 8 as in the user's prompt!)
  const [selectedRackId, setSelectedRackId] = useState<number>(8);
  const [selectedAisleId, setSelectedAisleId] = useState<number>(4); // Pasillo 4 (Rack 7 - 8)
  const [viewMode, setViewMode] = useState<ViewMode>('audit_excel');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [auditMode, setAuditMode] = useState<boolean>(false);

  // 4. Modals
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // 5. Stock Index O(1)
  const stockIndex = useMemo(() => buildStockIndex(stockData), [stockData]);

  // Current Rack configuration
  const currentRack = useMemo(() => {
    return WAREHOUSE_RACKS.find(r => r.id === selectedRackId) || WAREHOUSE_RACKS[0];
  }, [selectedRackId]);

  // Current Rack slots grid
  const currentRackSlots = useMemo(() => {
    return generateRackSlots(currentRack, stockIndex);
  }, [currentRack, stockIndex]);

  // Current Rack stats
  const currentRackStats = useMemo(() => {
    return calculateRackStats(currentRackSlots);
  }, [currentRackSlots]);

  // Global warehouse stats
  const globalWarehouseStats = useMemo(() => {
    let totalSlots = 0;
    for (const r of WAREHOUSE_RACKS) {
      totalSlots += r.moduleCount * 6;
    }
    const occupiedUbicaciones = stockIndex.size;
    const emptySlots = Math.max(0, totalSlots - occupiedUbicaciones);
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedUbicaciones / totalSlots) * 1000) / 10 : 0;
    const totalPallets = stockData.length;

    return {
      totalSlots,
      occupiedSlots: occupiedUbicaciones,
      emptySlots,
      occupancyRate,
      totalPallets,
    };
  }, [stockIndex, stockData]);

  // Helper to get slots for any rack
  const getRackSlotsById = (rackId: number) => {
    const r = WAREHOUSE_RACKS.find(x => x.id === rackId);
    if (!r) return [];
    return generateRackSlots(r, stockIndex);
  };

  // Handlers
  const handleSaveAuditFinding = (finding: AuditFinding) => {
    setAuditFindings(prev => {
      const next = new Map(prev);
      next.set(finding.ubicacion, finding);
      return next;
    });
  };

  const handleClearAuditFinding = (ubicacion: string) => {
    setAuditFindings(prev => {
      const next = new Map(prev);
      next.delete(ubicacion);
      return next;
    });
  };

  const handleClearAllAudit = () => {
    if (window.confirm('¿Deseas reiniciar y borrar todas las verificaciones de auditoría tomadas?')) {
      setAuditFindings(new Map());
    }
  };

  const handleImportStock = (newItems: StockItem[]) => {
    setStockData(newItems);
  };

  const handleRestoreDefaultStock = () => {
    setStockData(INITIAL_STOCK_DATA);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans antialiased">
      {/* CIAL Brand Header */}
      <Navbar
        totalSlots={globalWarehouseStats.totalSlots}
        occupiedSlots={globalWarehouseStats.occupiedSlots}
        emptySlots={globalWarehouseStats.emptySlots}
        occupancyRate={globalWarehouseStats.occupancyRate}
        totalPallets={globalWarehouseStats.totalPallets}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        auditMode={auditMode}
        onToggleAuditMode={() => setAuditMode(prev => !prev)}
        auditCount={auditFindings.size}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onResetData={handleRestoreDefaultStock}
      />

      {/* Rack Selector & View Mode Switcher */}
      <RackTabs
        racks={WAREHOUSE_RACKS}
        selectedRackId={selectedRackId}
        onSelectRack={setSelectedRackId}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        filterType={filterType}
        onChangeFilter={setFilterType}
        aisles={DEFAULT_AISLES}
        selectedAisleId={selectedAisleId}
        onSelectAisle={setSelectedAisleId}
        rackStats={currentRackStats}
      />

      {/* Audit Mode Banner Indicator */}
      {auditMode && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2.5 flex items-center justify-between text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <ClipboardCheck className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>
              MODO AUDITORÍA ACTIVO: Haz clic en cualquier posición del rack para verificar físico vs sistémico y registrar discrepancias.
            </span>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs transition-all shadow-xs cursor-pointer"
          >
            Ver Informe ({auditFindings.size})
          </button>
        </div>
      )}

      {/* Main Rack View Area */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {viewMode === 'double_aisle' ? (
          <AisleDoubleView
            aisles={DEFAULT_AISLES}
            allRacks={WAREHOUSE_RACKS}
            selectedAisleId={selectedAisleId}
            onSelectAisle={setSelectedAisleId}
            getRackSlots={getRackSlotsById}
            auditFindings={auditFindings}
            searchQuery={searchQuery}
            onSlotClick={setSelectedSlot}
          />
        ) : (
          <RackGridView
            rack={currentRack}
            slotsGrid={currentRackSlots}
            viewMode={viewMode}
            filterType={filterType}
            searchQuery={searchQuery}
            auditFindings={auditFindings}
            auditMode={auditMode}
            onSlotClick={setSelectedSlot}
          />
        )}
      </main>

      {/* Footer info bar */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-[#0a5c36]">Auditoría Almacenamiento v1.0</span>
          <span>•</span>
          <span>CIAL Alimentos CD San Jorge</span>
          <span>•</span>
          <span>29 Racks Activos</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600 font-semibold">
          <button
            onClick={() => setIsImportOpen(true)}
            className="hover:text-[#0a5c36] transition-colors cursor-pointer"
          >
            Pegar Data SAP
          </button>
          <span>•</span>
          <button
            onClick={() => setIsReportOpen(true)}
            className="hover:text-[#0a5c36] transition-colors cursor-pointer"
          >
            Generar Informe de Validación
          </button>
        </div>
      </footer>

      {/* Detail / Audit Modal */}
      <CellDetailModal
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        auditFinding={selectedSlot ? auditFindings.get(selectedSlot.ubicacion) : undefined}
        onSaveAudit={handleSaveAuditFinding}
        onClearAudit={handleClearAuditFinding}
      />

      {/* Import Data Modal */}
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportData={handleImportStock}
        onRestoreDefault={handleRestoreDefaultStock}
        currentItemsCount={stockData.length}
      />

      {/* Email / Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        auditFindings={auditFindings}
        onClearAllAudit={handleClearAllAudit}
      />
    </div>
  );
}
