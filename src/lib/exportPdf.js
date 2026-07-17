import { jsPDF } from 'jspdf';

const ACCENT = [79, 142, 247];
const DARK = [15, 17, 23];
const GRAY = [110, 110, 110];
const LIGHT = [240, 240, 240];

function fmt(n) {
  if (typeof n !== 'number') return String(n ?? '—');
  return n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

/**
 * Genera un PDF con formato de hoja de cálculo para un análisis individual.
 */
export function exportAnalysisToPdf(analysis) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableW = pageW - margin * 2;
  let y = 20;

  // Título
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text(analysis.name || 'Análisis de partículas', margin, y);

  y += 7;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const dateStr = analysis.created_date
    ? new Date(analysis.created_date).toLocaleString('es-MX')
    : new Date().toLocaleString('es-MX');
  doc.text(`Fecha: ${dateStr}`, margin, y);

  // Resumen
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Resumen', margin, y);

  y += 5;
  const summaryCols = [
    { label: 'Total partículas', value: fmt(analysis.result?.total_particles) },
    { label: 'Área total (px)', value: fmt(analysis.result?.total_particle_area_pixels) },
    { label: '% Fibras', value: typeof analysis.result?.fiber_percentage === 'number' ? `${analysis.result.fiber_percentage.toFixed(2)}%` : '—' },
  ];
  const colW = tableW / summaryCols.length;
  summaryCols.forEach((c, i) => {
    const x = margin + i * colW;
    doc.setFillColor(...LIGHT);
    doc.rect(x, y, colW - 2, 12, 'F');
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.text(c.label, x + 2, y + 4);
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.text(String(c.value), x + 2, y + 9);
  });
  y += 17;

  // Tabla de tipos
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Tipos de partículas', margin, y);
  y += 4;

  const headers = ['Tipo', 'Cantidad', 'Área (px)', '%'];
  const colWidths = [tableW * 0.4, tableW * 0.2, tableW * 0.25, tableW * 0.15];

  // Header row
  doc.setFillColor(...ACCENT);
  doc.rect(margin, y, tableW, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 5);
    x += colWidths[i];
  });
  y += 7;

  // Data rows
  doc.setTextColor(...DARK);
  const types = analysis.result?.types || [];
  types.forEach((t, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.rect(margin, y, tableW, 6.5, 'F');
    }
    const pct = typeof t.percentage_of_particle_area === 'number'
      ? t.percentage_of_particle_area.toFixed(2)
      : t.percentage_of_particle_area;
    const rowData = [t.type_name || '', String(t.count ?? ''), fmt(t.total_area_pixels), `${pct}%`];
    x = margin;
    rowData.forEach((val, i) => {
      doc.text(String(val), x + 2, y + 4.5);
      x += colWidths[i];
    });
    y += 6.5;
  });

  // Notas
  if (analysis.result?.notes) {
    y += 4;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('Notas:', margin, y);
    y += 4;
    const lines = doc.splitTextToSize(analysis.result.notes, tableW);
    doc.setTextColor(...DARK);
    doc.text(lines, margin, y);
  }

  // Imagen
  if (analysis.image_url) {
    try {
      doc.addPage();
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text('Imagen analizada', margin, 20);
      doc.addImage(analysis.image_url, 'JPEG', margin, 25, tableW, tableW * 0.6);
    } catch (_) {
      // Si la imagen no se puede cargar, se omite
    }
  }

  doc.save(`${analysis.name || 'analisis'}.pdf`);
}

/**
 * Genera un PDF con formato de hoja de cálculo que contiene todos los análisis
 * del historial, una tabla por análisis.
 */
export function exportAllAnalysesToPdf(analyses) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableW = pageW - margin * 2;
  let y = 20;

  // Portada
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text('Reporte de Análisis de Partículas', margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Total de análisis: ${analyses.length}`, margin, y);
  y += 5;
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, margin, y);
  y += 10;

  const headers = ['Tipo', 'Cantidad', 'Área (px)', '%'];
  const colWidths = [tableW * 0.4, tableW * 0.2, tableW * 0.25, tableW * 0.15];

  analyses.forEach((analysis, aIdx) => {
    if (y > 240) { doc.addPage(); y = 20; }

    // Encabezado del análisis
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(`${aIdx + 1}. ${analysis.name || 'Sin nombre'}`, margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    const dateStr = analysis.created_date
      ? new Date(analysis.created_date).toLocaleDateString('es-MX')
      : '—';
    doc.text(`Fecha: ${dateStr}  ·  Partículas: ${analysis.result?.total_particles ?? '—'}  ·  Área total: ${fmt(analysis.result?.total_particle_area_pixels)} px  ·  % Fibras: ${typeof analysis.result?.fiber_percentage === 'number' ? analysis.result.fiber_percentage.toFixed(2) + '%' : '—'}`, margin, y);
    y += 6;

    // Header de tabla
    doc.setFillColor(...ACCENT);
    doc.rect(margin, y, tableW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    let x = margin;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 4); x += colWidths[i]; });
    y += 6;

    // Filas
    doc.setTextColor(...DARK);
    const types = analysis.result?.types || [];
    types.forEach((t, idx) => {
      if (y > 275) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 250);
        doc.rect(margin, y, tableW, 5.5, 'F');
      }
      const pct = typeof t.percentage_of_particle_area === 'number'
        ? t.percentage_of_particle_area.toFixed(2)
        : t.percentage_of_particle_area;
      const rowData = [t.type_name || '', String(t.count ?? ''), fmt(t.total_area_pixels), `${pct}%`];
      x = margin;
      rowData.forEach((val, i) => { doc.text(String(val), x + 2, y + 3.8); x += colWidths[i]; });
      y += 5.5;
    });

    y += 6;
  });

  doc.save('reporte_analisis_particulas.pdf');
}