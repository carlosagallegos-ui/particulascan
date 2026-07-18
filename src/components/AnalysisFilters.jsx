import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function AnalysisFilters({ analyses, filters, onChange, onClear }) {
  const { t } = useLang();
  const particleTypes = useMemo(() => {
    const set = new Set();
    analyses.forEach((a) => {
      a.result?.types?.forEach((tp) => {
        if (tp.type_name) set.add(tp.type_name);
      });
    });
    return Array.from(set).sort();
  }, [analyses]);

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.particleType;

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>{t('filters.title')}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground">{t('filters.from')}</label>
        <Input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="h-8 w-[150px] text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground">{t('filters.to')}</label>
        <Input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="h-8 w-[150px] text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground">{t('filters.particleType')}</label>
        <Select
          value={filters.particleType || 'all'}
          onValueChange={(v) => onChange({ ...filters, particleType: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder={t('filters.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
            {particleTypes.map((tp) => (
              <SelectItem key={tp} value={tp}>{tp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" />
          {t('filters.clear')}
        </Button>
      )}
    </div>
  );
}