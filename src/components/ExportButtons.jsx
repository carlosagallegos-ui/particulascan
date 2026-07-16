import React from 'react';
import { Button } from '@/components/ui/button';
import { FileJson, FileText, FileSpreadsheet } from 'lucide-react';

export default function ExportButtons({ analysis }) {
  if (!analysis?.result) return null;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(analysis.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.name || 'analisis'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [['Tipo', 'Cantidad', 'Area_px', 'Porcentaje']];
    analysis.result.types?.forEach((t) => {
      rows.push([t.type_name, t.count, t.total_area_pixels, t.percentage_of_particle_area]);
    });
    rows.push([]);
    rows.push(['Total partículas', analysis.result.total_particles, '', '']);
    rows.push(['Área total (px)', analysis.result.total_particle_area_pixels, '', '']);
    const csv = rows.map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.name || 'analisis'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(15, 17, 23);
    doc.text(analysis.name || 'Análisis de partículas', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de partículas: ${analysis.result.total_particles}`, 20, 32);
    doc.text(`Área total (px): ${analysis.result.total_particle_area_pixels?.toLocaleString()}`, 20, 40);

    doc.setTextColor(15, 17, 23);
    doc.setFontSize(12);
    doc.text('Tipos de partículas:', 20, 55);

    let y = 65;
    doc.setFontSize(9);
    analysis.result.types?.forEach((t) => {
      doc.text(
        `${t.type_name}:  ${t.count} partículas  |  ${t.total_area_pixels?.toLocaleString()} px  |  ${typeof t.percentage_of_particle_area === 'number' ? t.percentage_of_particle_area.toFixed(2) : t.percentage_of_particle_area}%`,
        20,
        y
      );
      y += 7;
    });

    if (analysis.result.notes) {
      y += 5;
      doc.setTextColor(100, 100, 100);
      const notes = doc.splitTextToSize(`Notas: ${analysis.result.notes}`, 170);
      doc.text(notes, 20, y);
    }

    doc.save(`${analysis.name || 'analisis'}.pdf`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={exportJSON} variant="outline" size="sm">
        <FileJson className="w-4 h-4 mr-1.5" />
        JSON
      </Button>
      <Button onClick={exportCSV} variant="outline" size="sm">
        <FileSpreadsheet className="w-4 h-4 mr-1.5" />
        CSV
      </Button>
      <Button onClick={exportPDF} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-1.5" />
        PDF
      </Button>
    </div>
  );
}