import React from 'react';
import { useLang } from '@/lib/i18n';

export default function AnalysisResultCard({ result }) {
  const { t } = useLang();
  if (!result) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.totalParticles')}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{result.total_particles}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.totalArea')}</p>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {result.total_particle_area_pixels?.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.fibers')}</p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {typeof result.fiber_percentage === 'number'
              ? `${result.fiber_percentage.toFixed(2)}%`
              : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('result.type')}</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">{t('result.count')}</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">{t('result.area')}</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {result.types?.map((p, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2.5 text-foreground">{p.type_name}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{p.count}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{p.total_area_pixels?.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-primary font-medium tabular-nums">
                  {typeof p.percentage_of_particle_area === 'number'
                    ? p.percentage_of_particle_area.toFixed(2)
                    : p.percentage_of_particle_area}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.notes && (
        <div className="rounded-lg bg-secondary/40 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.notes')}</p>
          <p className="text-sm text-foreground">{result.notes}</p>
        </div>
      )}
    </div>
  );
}