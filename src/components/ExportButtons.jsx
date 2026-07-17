import React from 'react';
import { Button } from '@/components/ui/button';
import { FileJson, FileText, FileSpreadsheet } from 'lucide-react';
import { exportAnalysisToPdf } from '@/lib/exportPdf';

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

  const exportPDF = () => {
    exportAnalysisToPdf(analysis);
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