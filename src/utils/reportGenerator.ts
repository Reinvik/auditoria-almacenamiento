import * as XLSX from 'xlsx';
import { AuditFinding } from '../types/warehouse';

export interface EmailReportData {
  dateStr: string;
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  differencesCount: number;
}

export const DEFAULT_EMAIL_TO = 'claudio.munoz@cial.cl; fernando.ramos@cial.cl; christopher.aleman@cial.cl; marcos.primera@cial.cl';
export const DEFAULT_EMAIL_CC = 'luis.puchi@cial.cl; controldeexistencias@cialalimentos.cl';

export function generateEmailReport(
  findings: AuditFinding[], 
  customTo?: string, 
  customCc?: string
): EmailReportData {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');

  const discrepancies = findings.filter(f => f.discrepancyType !== 'NONE');
  const hasDiffs = discrepancies.length > 0;

  const to = customTo !== undefined ? customTo : DEFAULT_EMAIL_TO;
  const cc = customCc !== undefined ? customCc : DEFAULT_EMAIL_CC;
  const subject = `Validación altura ${dateStr}`;

  let bodyText = '';
  let bodyHtml = '';

  if (!hasDiffs) {
    bodyText = `Buenos días,\n\nNo se presentan diferencias de altura.\n\nFecha: ${dateStr}`;
    bodyHtml = `<p>Buenos días,</p><p><strong>No se presentan diferencias de altura.</strong></p><p><small>Fecha: ${dateStr}</small></p>`;
  } else {
    bodyText = `Buenos días,\n\nSe presentan diferencias de altura:\n\n`;
    bodyText += `Ubicación\tSistémico\tFísico\tDiferencia\tCódigo\tLote\tObservaciones\n`;

    discrepancies.forEach(d => {
      const codigo = d.physicalMaterial || d.systemMaterial || '—';
      const lote = d.physicalLote || d.systemLote || '—';
      const diffLabel = d.differenceDetail || (d.systemPallets > d.physicalPallets ? `Falta ${d.systemPallets - d.physicalPallets} de ${d.systemPallets}` : 'Diferencia');
      bodyText += `${d.ubicacion}\t${d.systemPallets}\t${d.physicalPallets}\t${diffLabel}\t${codigo}\t${lote}\t${d.notes || ''}\n`;
    });

    bodyHtml = `
      <p>Buenos días,</p>
      <p><strong>Se presentan diferencias de altura:</strong></p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 13px; text-align: center; width: 100%;">
        <thead style="background-color: #0a5c36; color: white;">
          <tr>
            <th style="padding: 7px 12px;">Ubicación</th>
            <th style="padding: 7px 12px;">Sistémico</th>
            <th style="padding: 7px 12px;">Físico</th>
            <th style="padding: 7px 12px;">Diferencia</th>
            <th style="padding: 7px 12px;">Código</th>
            <th style="padding: 7px 12px;">Lote</th>
            <th style="padding: 7px 12px;">Observación</th>
          </tr>
        </thead>
        <tbody>
          ${discrepancies.map((d, idx) => {
            const diffLabel = d.differenceDetail || (d.systemPallets > d.physicalPallets ? `Falta ${d.systemPallets - d.physicalPallets} de ${d.systemPallets}` : 'Diferencia');
            const isFalta = d.discrepancyType === 'FALTA_FISICA';
            const diffColor = isFalta ? '#b91c1c' : '#b45309';
            const diffBg = isFalta ? '#fef2f2' : '#fffbeb';

            return `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="font-weight: bold; font-family: monospace; color: #0a5c36; font-size: 13px;">${d.ubicacion}</td>
                <td style="background-color: ${d.systemPallets === 0 ? '#fee2e2' : 'transparent'}; font-weight: bold;">${d.systemPallets}</td>
                <td style="background-color: ${d.physicalPallets === 0 ? '#fee2e2' : '#dcfce7'}; font-weight: bold;">${d.physicalPallets}</td>
                <td style="background-color: ${diffBg}; color: ${diffColor}; font-weight: 800; padding: 6px 10px;">${diffLabel}</td>
                <td style="font-weight: bold;">${d.physicalMaterial || d.systemMaterial || '—'}</td>
                <td style="font-family: monospace;">${d.physicalLote || d.systemLote || '—'}</td>
                <td style="text-align: left; font-style: italic; color: #475569;">${d.notes || ''}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <p><small style="color: #64748b;">Generado desde Auditoría Almacenamiento CIAL • ${new Date().toLocaleString('es-CL')}</small></p>
    `;
  }

  return {
    dateStr,
    to,
    cc,
    subject,
    bodyText,
    bodyHtml,
    differencesCount: discrepancies.length,
  };
}

export function exportFindingsToExcel(findings: AuditFinding[], filename = 'Auditoria_Almacenamiento_Diferencias.xlsx') {
  const data = findings.map(f => ({
    Ubicación: f.ubicacion,
    Rack: f.rackId,
    'Sistémico (Pallets)': f.systemPallets,
    'Físico (Pallets)': f.physicalPallets,
    'Detalle Diferencia': f.differenceDetail,
    'Código Sistémico': f.systemMaterial || '',
    'Código Físico': f.physicalMaterial || '',
    'Lote Sistémico': f.systemLote || '',
    'Lote Físico': f.physicalLote || '',
    'Tipo Discrepancia': f.discrepancyType,
    Observaciones: f.notes || '',
    Fecha: f.timestamp,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Diferencias Almacenamiento');
  XLSX.writeFile(workbook, filename);
}
