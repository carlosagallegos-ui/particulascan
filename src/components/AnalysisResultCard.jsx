import React from 'react';
import { useLang } from '@/lib/i18n';

export default function AnalysisResultCard({ result, calibration }) {
  const { t } = useLang();
  if (!result) return null;

  const scale = calibration?.scale_factor_um_per_px;
  const hasScale = typeof scale === 'number' && scale > 0;
  const toUm2 = (px) => (hasScale && typeof px === 'number' ? px * scale * scale : null);

  const fiberPercentage =
    typeof result.fiber_percentage === 'number'
      ? result.fiber_percentage
      : (result.types || []).reduce(
          (sum, tp) => (tp.is_fiber ? sum + (tp.percentage_of_particle_area || 0) : sum),
          0
        );

  const totalAreaUm2 = toUm2(result.total_particle_area_pixels);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.totalParticles')}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{result.total_particles}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {hasScale ? t('result.totalAreaUm') : t('result.totalArea')}
          </p>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {hasScale
              ? totalAreaUm2?.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : result.total_particle_area_pixels?.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-background/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('result.fibers')}</p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {fiberPercentage > 0 ? `${fiberPercentage.toFixed(2)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('result.type')}</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">{t('result.count')}</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                {hasScale ? t('result.areaUm') : t('result.area')}
              </th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {result.types?.map((tp, i) => {
              const areaUm2 = toUm2(tp.total_area_pixels);
              return (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 text-foreground flex items-center gap-1.5">
                    {tp.type_name}
                    {tp.is_fiber && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                        fiber
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{tp.count}</td>
                  <td className="px-4 py-2.5 text-right text-foreground tabular-nums">
                    {hasScale
                      ? areaUm2?.toLocaleString(undefined, { maximumFractionDigits: 1 })
                      : tp.total_area_pixels?.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-primary font-medium tabular-nums">
                    {typeof tp.percentage_of_particle_area === 'number'
                      ? tp.percentage_of_particle_area.toFixed(2)
                      : tp.percentage_of_particle_area}%
                  </td>
                </tr>
              );
            })}
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