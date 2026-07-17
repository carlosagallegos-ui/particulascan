import { jsPDF } from 'jspdf';

const ACCENT = [79, 142, 247];
const DARK = [15, 17, 23];
const GRAY = [110, 110, 110];
const LIGHT = [240, 240, 240];
const CHART_COLORS = ['#4F8EF7', '#3ECFA4', '#F7B84F', '#A84FF7', '#F7584F', '#4FF7D8', '#F74FB8', '#B8F74F'];

function fmt(n) {
  if (typeof n !== 'number') return String(n ?? '—');
  return n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

function pctVal(v) {
  return typeof v === 'number' ? v : (parseFloat(v) || 0);
}

/**
 * Genera un pie chart como string SVG a partir de los tipos del resultado.
 */
function buildPieChartSvg(result) {
  const types = result?.types || [];
  if (!types.length) return null;

  const total = types.reduce((s, t) => s + pctVal(t.percentage_of_particle_area), 0);
  if (total <= 0) return null;

  const cx = 90, cy = 90, r = 75;
  let angle = -Math.PI / 2;
  let paths = '';

  types.forEach((t, i) => {
    const pct = pctVal(t.percentage_of_particle_area);
    const slice = (pct / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const largeArc = slice > Math.PI ? 1 : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${color}" stroke="white" stroke-width="1.5"/>`;
    angle += slice;
  });

  // Leyenda
  let legendY = 8;
  let legend = '';
  const maxLabelLen = 28;
  types.forEach((t, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    let label = t.type_name || `Tipo ${i + 1}`;
    if (label.length > maxLabelLen) label = label.slice(0, maxLabelLen - 1) + '…';
    const pct = pctVal(t.percentage_of_particle_area).toFixed(2);
    legend += `<rect x="185" y="${legendY}" width="11" height="11" rx="2" fill="${color}"/>`;
    legend += `<text x="202" y="${legendY + 9}" font-size="9" fill="#1A1D27">${label}</text>`;
    legend += `<text x="345" y="${legendY + 9}" font-size="9" fill="#6E6E6E" text-anchor="end">${pct}%</text>`;
    legendY += 16;
  });

  const height = Math.max(190, legendY + 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${height}" viewBox="0 0 360 ${height}">
    <rect width="360" height="${height}" fill="white" rx="6"/>
    <text x="180" y="14" font-size="11" font-weight="bold" fill="#1A1D27" text-anchor="middle">Distribución por tipo</text>
    ${paths}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="white"/>
    <text x="${cx}" y="${cy - 4}" font-size="8" fill="#6E6E6E" text-anchor="middle">${types.length}</text>
    <text x="${cx}" y="${cy + 8}" font-size="7" fill="#9E9E9E" text-anchor="middle">tipos</text>
    ${legend}
  </svg>`;
}

/**
 * Convierte un string SVG a data URL PNG mediante canvas.
 */
function svgToPngDataUrl(svg) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = 360 * scale;
      canvas.height = (svg.match(/height="(\d+)"/)?.[1] || 200) * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/**
 * Descarga una imagen desde URL y la convierte a data URL para embeber en el PDF.
 */
async function imageUrlToDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (_) {
    return null;
  }
}

/**
 * Genera un PDF con imagen, gráfica de distribución y tabla de resultados.
 */
export async function exportAnalysisToPdf(analysis) {
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
  y += 8;

  // Resumen
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

  // Imagen + Gráfica lado a lado
  const imgData = analysis.image_url ? await imageUrlToDataUrl(analysis.image_url) : null;
  const chartSvg = buildPieChartSvg(analysis.result);
  const chartData = chartSvg ? await svgToPngDataUrl(chartSvg).catch(() => null) : null;

  if (imgData || chartData) {
    const halfW = (tableW - 4) / 2;
    if (imgData) {
      try {
        doc.addImage(imgData, 'JPEG', margin, y, halfW, halfW * 0.7);
      } catch (_) { /* skip */ }
    }
    if (chartData) {
      try {
        const chartH = halfW * 0.7;
        doc.addImage(chartData, 'PNG', margin + halfW + 4, y, halfW, chartH);
      } catch (_) { /* skip */ }
    }
    y += halfW * 0.7 + 6;
  }

  // Tabla de tipos
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Tipos de partículas', margin, y);
  y += 4;

  const headers = ['Tipo', 'Cantidad', 'Área (px)', '%'];
  const colWidths = [tableW * 0.4, tableW * 0.2, tableW * 0.25, tableW * 0.15];

  doc.setFillColor(...ACCENT);
  doc.rect(margin, y, tableW, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  let x = margin;
  headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += colWidths[i]; });
  y += 7;

  doc.setTextColor(...DARK);
  const types = analysis.result?.types || [];
  types.forEach((t, idx) => {
    if (y > 275) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.rect(margin, y, tableW, 6.5, 'F');
    }
    const pct = typeof t.percentage_of_particle_area === 'number'
      ? t.percentage_of_particle_area.toFixed(2)
      : t.percentage_of_particle_area;
    const rowData = [t.type_name || '', String(t.count ?? ''), fmt(t.total_area_pixels), `${pct}%`];
    x = margin;
    rowData.forEach((val, i) => { doc.text(String(val), x + 2, y + 4.5); x += colWidths[i]; });
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

  doc.save(`${analysis.name || 'analisis'}.pdf`);
}

/**
 * Genera un PDF con todos los análisis del historial, incluyendo imagen y gráfica por muestra.
 */
export async function exportAllAnalysesToPdf(analyses) {
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

  for (let aIdx = 0; aIdx < analyses.length; aIdx++) {
    const analysis = analyses[aIdx];
    if (y > 230) { doc.addPage(); y = 20; }

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
    doc.text(`Fecha: ${dateStr}  ·  Partículas: ${analysis.result?.total_particles ?? '—'}  ·  Área: ${fmt(analysis.result?.total_particle_area_pixels)} px  ·  % Fibras: ${typeof analysis.result?.fiber_percentage === 'number' ? analysis.result.fiber_percentage.toFixed(2) + '%' : '—'}`, margin, y);
    y += 6;

    // Imagen + gráfica
    const imgData = analysis.image_url ? await imageUrlToDataUrl(analysis.image_url) : null;
    const chartSvg = buildPieChartSvg(analysis.result);
    const chartData = chartSvg ? await svgToPngDataUrl(chartSvg).catch(() => null) : null;

    if (imgData || chartData) {
      const halfW = (tableW - 4) / 2;
      const imgH = halfW * 0.55;
      if (imgData) {
        try { doc.addImage(imgData, 'JPEG', margin, y, halfW, imgH); } catch (_) { /* skip */ }
      }
      if (chartData) {
        try { doc.addImage(chartData, 'PNG', margin + halfW + 4, y, halfW, imgH); } catch (_) { /* skip */ }
      }
      y += imgH + 5;
    }

    // Tabla
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(...ACCENT);
    doc.rect(margin, y, tableW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    let x = margin;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 4); x += colWidths[i]; });
    y += 6;

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

    y += 8;
  }

  doc.save('reporte_analisis_particulas.pdf');
}