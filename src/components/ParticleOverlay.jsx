import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const COLORS = ['#4F8EF7', '#3ECFA4', '#F7B84F', '#A84FF7', '#F7584F', '#4FF7D8', '#F74FB8', '#B8F74F'];

export default function ParticleOverlay({ analysis }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(true);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const types = analysis.result?.types || [];
  const hasRegions = types.some((tp) => tp.regions?.length > 0);

  if (!hasRegions) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">{t('overlay.noRegions')}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{t('overlay.title')}</span>
        <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
          {visible ? t('overlay.hide') : t('overlay.show')}
        </Button>
      </div>

      <div className="relative inline-block w-full">
        <img
          src={analysis.image_url}
          alt={analysis.name}
          className="w-full rounded-lg border border-border"
          onLoad={(e) => setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
        />
        {visible && naturalSize.w > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {types.map((tp, i) => {
              const color = COLORS[i % COLORS.length];
              return (tp.regions || []).map((r, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={(r.x / naturalSize.w) * 100}
                  y={(r.y / naturalSize.h) * 100}
                  width={(r.width / naturalSize.w) * 100}
                  height={(r.height / naturalSize.h) * 100}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.3"
                  rx="0.2"
                />
              ));
            })}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {types.map((tp, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted-foreground">{tp.type_name}</span>
            <span className="text-foreground font-medium">({tp.regions?.length || 0})</span>
          </div>
        ))}
      </div>
    </div>
  );
}