import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Crosshair, Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

export default function ScaleCalibration({ analysis, onUpdate }) {
  const { t } = useLang();
  const [calibrating, setCalibrating] = useState(false);
  const [points, setPoints] = useState([]);
  const [realDistance, setRealDistance] = useState('');
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  const calibration = analysis.calibration;
  const hasCalibration = !!calibration?.scale_factor_um_per_px;

  const handleImageClick = (e) => {
    if (!calibrating || !imgRef.current) return;
    setError(null);
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setPoints((prev) => {
      if (prev.length >= 2) return [{ x, y }];
      return [...prev, { x, y }];
    });
  };

  const pixelDistance =
    points.length === 2
      ? Math.sqrt((points[1].x - points[0].x) ** 2 + (points[1].y - points[0].y) ** 2)
      : 0;

  const handleSave = async () => {
    const real = parseFloat(realDistance);
    if (!real || real <= 0 || pixelDistance === 0) {
      setError(t('calibration.realDistance'));
      return;
    }
    const scale = real / pixelDistance;
    await onUpdate({
      scale_factor_um_per_px: scale,
      method: 'scale_bar',
      real_distance_um: real,
      pixel_distance: pixelDistance,
    });
    setCalibrating(false);
    setPoints([]);
    setRealDistance('');
    setError(null);
  };

  const handleClear = async () => {
    await onUpdate(null);
  };

  const startCalibration = () => {
    setCalibrating(true);
    setPoints([]);
    setRealDistance('');
    setError(null);
  };

  const cancelCalibration = () => {
    setCalibrating(false);
    setPoints([]);
    setRealDistance('');
    setError(null);
  };

  const toPct = (coord, dim) => (dim ? (coord / dim) * 100 : 0);
  const natW = imgRef.current?.naturalWidth;
  const natH = imgRef.current?.naturalHeight;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t('calibration.title')}</span>
          {hasCalibration && (
            <span className="text-xs text-accent font-medium px-2 py-0.5 rounded-full bg-accent/10">
              {calibration.scale_factor_um_per_px.toFixed(4)} {t('calibration.umPerPixel')}
            </span>
          )}
        </div>
        {!calibrating && (
          hasCalibration ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startCalibration}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                {t('calibration.recalibrate')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="w-3.5 h-3.5 mr-1" />
                {t('calibration.clear')}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={startCalibration}>
              <Crosshair className="w-3.5 h-3.5 mr-1" />
              {t('calibration.start')}
            </Button>
          )
        )}
      </div>

      {(calibrating || hasCalibration) && (
        <div className="relative inline-block w-full">
          <img
            ref={imgRef}
            src={analysis.image_url}
            alt={analysis.name}
            className={cn(
              'w-full rounded-lg border border-border',
              calibrating && 'cursor-crosshair'
            )}
            onClick={handleImageClick}
          />
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {points.length >= 1 && (
              <circle
                cx={toPct(points[0].x, natW)}
                cy={toPct(points[0].y, natH)}
                r="0.8"
                fill="#4F8EF7"
                stroke="white"
                strokeWidth="0.3"
              />
            )}
            {points.length >= 2 && (
              <>
                <line
                  x1={toPct(points[0].x, natW)}
                  y1={toPct(points[0].y, natH)}
                  x2={toPct(points[1].x, natW)}
                  y2={toPct(points[1].y, natH)}
                  stroke="#4F8EF7"
                  strokeWidth="0.5"
                  strokeDasharray="1 1"
                />
                <circle
                  cx={toPct(points[1].x, natW)}
                  cy={toPct(points[1].y, natH)}
                  r="0.8"
                  fill="#3ECFA4"
                  stroke="white"
                  strokeWidth="0.3"
                />
              </>
            )}
          </svg>
        </div>
      )}

      {calibrating && (
        <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground">
            {points.length === 0 && t('calibration.mode')}
            {points.length === 1 && t('calibration.point1')}
            {points.length === 2 && `${t('calibration.pixelDistance')}: ${pixelDistance.toFixed(1)} px`}
          </p>
          {points.length === 2 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">{t('calibration.realDistance')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={realDistance}
                  onChange={(e) => setRealDistance(e.target.value)}
                  placeholder="ej. 50"
                  className="h-8"
                />
              </div>
              <Button size="sm" onClick={handleSave} disabled={!realDistance}>
                <Check className="w-3.5 h-3.5 mr-1" />
                {t('calibration.save')}
              </Button>
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button variant="ghost" size="sm" onClick={cancelCalibration}>
            {t('calibration.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}