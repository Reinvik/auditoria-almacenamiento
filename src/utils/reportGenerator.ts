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

export function generateEmailReport(findings: AuditFinding[]): EmailReportData {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');

  const discrepancies = findings.filter(f => f.discrepancyType !== 'NONE');
  const hasDiffs = discrepancies.length > 0;

  const to = 'claudio.munoz@cial.cl; fernando.ramos@cial.cl; christopher.aleman@cial.cl; marcos.primera@cial.cl';
  const cc = 'irene.espina@cial.cl; controldeexistencias@cialalimentos.cl';
  const subject = `Validación altura ${dateStr}`;

  let bodyText = '';
  let bodyHtml = '';

  if (!hasDiffs) {
    bodyText = `Buenos días,\n\nNo se presentan diferencias de altura.\n\nFecha: ${dateStr}`;
    bodyHtml = `<p>Buenos días,</p><p><strong>No se presentan diferencias de altura.</strong></p><p><small>Fecha: ${dateStr}</small></p>`;
  } else {
    bodyText = `Buenos días,\n\nSe presentan diferencias de altura:\n\n`;
    bodyText += `Ubicación\tSistémico\tFísico\tCódigo\tLote\tTipo Diferencia\tObservaciones\n`;

    discrepancies.forEach(d => {
      const codigo = d.physicalMaterial || d.systemMaterial || '—';
      const lote = d.physicalLote || d.systemLote || '—';
      bodyText += `${d.ubicacion}\t${d.systemPallets}\t${d.physicalPallets}\t${codigo}\t${lote}\t${d.discrepancyType}\t${d.notes || ''}\n`;
    });

    bodyHtml = `
      <p>Buenos días,</p>
      <p><strong>Se presentan diferencias de altura:</strong></p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 13px; text-align: center;">
        <thead style="background-color: #0f172a; color: white;">
          <tr>
            <th style="padding: 6px 12px;">Ubicación</th>
            <th style="padding: 6px 12px;">Sistémico</th>
            <th style="padding: 6px 12px;">Físico</th>
            <th style="padding: 6px 12px;">Código</th>
            <th style="padding: 6px 12px;">Lote</th>
            <th style="padding: 6px 12px;">Tipo</th>
            <th style="padding: 6px 12px;">Observación</th>
          </tr>
        </thead>
        <tbody>
          ${discrepancies.map((d, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="font-weight: bold; color: #0284c7;">${d.ubicacion}</td>
              <td style="background-color: ${d.systemPallets === 0 ? '#fee2e2' : 'transparent'}; font-weight: 600;">${d.systemPallets}</td>
              <td style="background-color: ${d.physicalPallets === 0 ? '#fee2e2' : '#dcfce7'}; font-weight: 600;">${d.physicalPallets}</td>
              <td>${d.physicalMaterial || d.systemMaterial || '—'}</td>
              <td>${d.physicalLote || d.systemLote || '—'}</td>
              <td style="font-size: 11px; color: #64748b;">${d.discrepancyType}</td>
              <td style="text-align: left; font-style: italic;">${d.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><small style="color: #64748b;">Generado desde Auditoría Almacenamiento • ${new Date().toLocaleString('es-CL')}</small></p>
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

export function exportFindingsToExcel(findings: AuditFinding[], filename = 'Auditoria_Altura_Diferencias.xlsx') {
  const data = findings.map(f => ({
    Ubicación: f.ubicacion,
    Rack: f.rackId,
    'Sistémico (Pallets)': f.systemPallets,
    'Físico (Pallets)': f.physicalPallets,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Diferencias Altura');
  XLSX.writeFile(workbook, filename);
}
