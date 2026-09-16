import React, { useState } from 'react';
import { StockItem } from '../types/warehouse';
import { parsePastedData, parseExcelFile } from '../utils/parser';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ClipboardPaste, 
  RotateCcw, 
  AlertCircle,
  Sparkles,
  Terminal,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';
import { SAP_VBS_SCRIPT_CONTENT } from '../utils/sapScriptSource';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (items: StockItem[]) => void;
  onRestoreDefault: () => void;
  currentItemsCount: number;
}

const SAMPLE_SAP_DATA = `Material	Centro	Almacén	Diferenciación stock	Lote	Stock especial	Descripción material	Tipo almacén	Ubicación	Stock disponible	Unidad medida base	FeCaduc/FePreferCons	Peso
20	SGSJ	NCD1		9370008965		ARROLLADO LOMO CON AJI SJ	PFW	0172006	140	UN	10/28/2026	443.800
20	SGSJ	NCD1		9370009021		ARROLLADO LOMO CON AJI SJ	PFW	0172302	140	UN	10/31/2026	443.800
20	SGSJ	NCD1		9370009137		ARROLLADO LOMO CON AJI SJ	PFW	0181203	140	UN	11/2/2026	443.800
20	SGSJ	NCD1		9370008861		ARROLLADO LOMO CON AJI SJ	PBK	0122303	91	UN	10/26/2026	288.470
20	SGSJ	NCD1		9370008910		ARROLLADO LOMO CON AJI SJ	RCK	0281905	140	UN	10/27/2026	443.800
20	SGSJ	NCD1		9370008957		ARROLLADO LOMO CON AJI SJ	PFW	0170902	133	UN	10/28/2026	421.610
20	SGSJ	NCD1		9370009057		ARROLLADO LOMO CON AJI SJ	PBK	0113304	112	UN	11/1/2026	355.040
20	SGSJ	NCD1		9370009151		ARROLLADO LOMO CON AJI SJ	PFW	0172605	140	UN	11/3/2026	443.800
20	SGSJ	NCD1		9370008968		ARROLLADO LOMO CON AJI SJ	RCK	0280204	140	UN	10/28/2026	443.800
20	SGSJ	NCD1		9370009103		ARROLLADO LOMO CON AJI SJ	PBK	0113003	140	UN	11/2/2026	443.800
20	SGSJ	NCD1		9370009022		ARROLLADO LOMO CON AJI SJ	PFW	0170906	91	UN	10/31/2026	288.470
20	SGSJ	NCD1		9370009138		ARROLLADO LOMO CON AJI SJ	PBK	0113003	105	UN	11/2/2026	332.850
20	SGSJ	NCD1		9370008959		ARROLLADO LOMO CON AJI SJ	PBK	0250103	84	UN	10/28/2026	266.280
20	SGSJ	NCD1		9370008991		ARROLLADO LOMO CON AJI SJ	PBK	0111206	140	UN	10/28/2026	443.800
20	SGSJ	NCD1		9370008860		ARROLLADO LOMO CON AJI SJ	PFW	0180104	140	UN	10/26/2026	443.800
20	SGSJ	NCD1		9370008990		ARROLLADO LOMO CON AJI SJ	PFW	0181505	140	UN	10/28/2026	443.800
20	SGSJ	NCD1		9370008958		ARROLLADO LOMO CON AJI SJ	PBK	0244206	140	UN	10/28/2026	443.800
20	SGSJ	NCD1		9370009149		ARROLLADO LOMO CON AJI SJ	PFW	0173002	140	UN	11/3/2026	443.800
20	SGSJ	NCD1		9370008857		ARROLLADO LOMO CON AJI SJ	PFW	0180104	140	UN	10/26/2026	443.800`;

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  onRestoreDefault,
  currentItemsCount,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'restore' | 'sap'>('paste');
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedPreviewCount, setParsedPreviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false);

  const handleDownloadScript = () => {
    const blob = new Blob([SAP_VBS_SCRIPT_CONTENT], { type: 'text/vbscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Descargar_LX02_Almacenamiento.vbs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SAP_VBS_SCRIPT_CONTENT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const txt = e.target.value;
    setPastedText(txt);
    setErrorMessage(null);
    if (txt.trim().length > 10) {
      const items = parsePastedData(txt);
      setParsedPreviewCount(items.length);
    } else {
      setParsedPreviewCount(null);
    }
  };

  const handleProcessPasted = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor pega la información copiada desde SAP o Excel.');
      return;
    }
    setLoading(true);
    try {
      const items = parsePastedData(pastedText);
      if (items.length === 0) {
        setErrorMessage('No se detectaron filas válidas con ubicación.');
        setLoading(false);
        return;
      }
      onImportData(items);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error al procesar los datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const items = await parseExcelFile(file);
      if (items.length === 0) {
        setErrorMessage('No se encontraron registros de stock en el archivo subido.');
        setLoading(false);
        return;
      }
      onImportData(items);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error al leer el archivo Excel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setPastedText(SAMPLE_SAP_DATA);
    const items = parsePastedData(SAMPLE_SAP_DATA);
    setParsedPreviewCount(items.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con Verde CIAL */}
        <div className="bg-[#0a5c36] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08482a] border border-white/20 flex items-center justify-center text-emerald-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                Carga de Stock SAP / Excel
              </h3>
              <p className="text-xs text-emerald-100">
                Pega directamente columnas de SAP o arrastra la planilla de inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#0a5c36] text-[#0a5c36]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Pegar Texto SAP (Ctrl + V)</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'border-[#0a5c36] text-[#0a5c36]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Subir Archivo Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-[#0a5c36] text-[#0a5c36]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Base Oficial</span>
          </button>

          <button
            onClick={() => setActiveTab('sap')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sap'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="flex items-center gap-1.5">
              <span>Script SAP (.vbs)</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-black">
                ⚡ Auto
              </span>
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  Copia las columnas desde SAP o Excel y pégalas aquí:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] font-black text-[#0a5c36] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Cargar Ejemplo del Mensaje
                </button>
              </div>

              <textarea
                rows={9}
                placeholder="Material	Centro	Almacén	Lote	Descripción material	Tipo almacén	Ubicación	Stock disponible	Unidad	FeCaduc	Peso..."
                value={pastedText}
                onChange={handleTextChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0a5c36] focus:bg-white focus:ring-1 focus:ring-[#0a5c36]"
              />

              {parsedPreviewCount !== null && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#e6f4ea] border border-[#a3cfb6] text-xs">
                  <span className="text-[#08482a] font-bold">
                    ✓ Se detectaron <strong>{parsedPreviewCount.toLocaleString()}</strong> registros válidos
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Bodega actual: {currentItemsCount.toLocaleString()} items
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4 text-center py-6">
              <div className="border-2 border-dashed border-slate-300 hover:border-[#0a5c36] rounded-2xl p-8 transition-colors bg-slate-50">
                <FileSpreadsheet className="w-12 h-12 text-[#0a5c36] mx-auto mb-3" />
                <h4 className="text-sm font-black text-slate-900 mb-1">
                  Arrastra tu archivo Excel aquí
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Soporta formatos .xlsx, .xlsm o .csv
                </p>
                <label className="inline-block px-5 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-black text-xs cursor-pointer shadow-md transition-all">
                  <span>Seleccionar Archivo</span>
                  <input
                    type="file"
                    accept=".xlsx, .xlsm, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel.sheet.macroEnabled.12"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE DEFAULT */}
          {activeTab === 'restore' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-black text-slate-900">
                Restaurar Base de Datos Oficial (Excel Actual)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vuelve a cargar el inventario oficial extraído de la planilla BBD con sus 4.641 registros reales y los 29 Racks mapeados.
              </p>
              <button
                type="button"
                onClick={() => {
                  onRestoreDefault();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#e6f4ea] hover:bg-[#d4edd8] text-[#08482a] font-black text-xs border border-[#a3cfb6] flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4 text-[#0a5c36]" />
                Restaurar los 4.641 registros originales
              </button>
            </div>
          )}

          {/* TAB 4: SCRIPT SAP (.VBS) */}
          {activeTab === 'sap' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Script SAP GUI Standalone (.vbs)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Automatiza la extracción de stock desde SAP GUI y guarda el archivo directamente en tu Escritorio.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadScript}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar .vbs</span>
                  </button>
                </div>

                {/* Parámetros configurados */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-blue-200/60">
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Transacción</span>
                    <span className="text-xs font-mono font-black text-blue-900">/nLX02</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Centro</span>
                    <span className="text-xs font-mono font-black text-blue-900">NCD</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipos Almacén</span>
                    <span className="text-xs font-mono font-black text-blue-900">PBK, CGO, PFW, RCK</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Variante ALV</span>
                    <span className="text-xs font-mono font-black text-blue-900">/JESTAY</span>
                  </div>
                </div>
              </div>

              {/* Pasos de Uso */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h5 className="text-xs font-black uppercase text-slate-700 tracking-wide">
                  Instrucciones de Uso Rápido:
                </h5>
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Abre tu <strong>SAP GUI</strong> e inicia sesión en el mandante habitual de CIAL Alimentos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Haz doble clic en el archivo <strong>Descargar_LX02_Almacenamiento.vbs</strong> descargado.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      El script ejecutará automáticamente la transacción y guardará <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[11px] font-bold">LX02_Almacenamiento.xlsx</code> en tu <strong>Escritorio</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Regresa a esta ventana y arrastra el archivo a la pestaña <strong>Subir Archivo Excel</strong> (o copia y pega sus columnas).
                    </span>
                  </li>
                </ol>
              </div>

              {/* Botones de acción secundaria y código */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Código VBS Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Código del Script (.vbs)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-4 h-4 text-slate-500" />
                  <span>{showCodePreview ? 'Ocultar Código Fuente' : 'Ver Código Fuente'}</span>
                  {showCodePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Visor de Código Plegable */}
              {showCodePreview && (
                <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-xl max-h-48 overflow-y-auto border border-slate-700 select-all">
                  {SAP_VBS_SCRIPT_CONTENT}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cerrar
          </button>
          {activeTab === 'paste' && (
            <button
              onClick={handleProcessPasted}
              disabled={loading || !pastedText.trim()}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#0a5c36] hover:bg-[#08482a] disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
            >
              {loading ? 'Procesando...' : 'Procesar y Aplicar a Bodega'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
