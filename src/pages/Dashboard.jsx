import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ComparisonBarChart from '@/components/ComparisonBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Check, Eye, GitCompare, FileDown, Filter } from 'lucide-react';
import { exportAllAnalysesToPdf } from '@/lib/exportPdf';
import { cn } from '@/lib/utils';
import AnalysisFilters from '@/components/AnalysisFilters';
import { useLang } from '@/lib/i18n';

export default function Dashboard() {
  const { t } = useLang();
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', particleType: '' });

  const filteredAnalyses = analyses.filter((a) => {
    const created = a.created_date ? new Date(a.created_date) : null;
    if (filters.dateFrom && created) {
      const from = new Date(filters.dateFrom + 'T00:00:00');
      if (created < from) return false;
    }
    if (filters.dateTo && created) {
      const to = new Date(filters.dateTo + 'T23:59:59');
      if (created > to) return false;
    }
    if (filters.particleType) {
      const hasType = a.result?.types?.some((t) => t.type_name === filters.particleType);
      if (!hasType) return false;
    }
    return true;
  });

  useEffect(() => {
    base44.entities.Analysis
      .list('-created_date', 50)
      .then((data) => setAnalyses(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (analysis) => {
    setSelected((prev) => {
      const exists = prev.find((a) => a.id === analysis.id);
      if (exists) return prev.filter((a) => a.id !== analysis.id);
      return [...prev, analysis];
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8 relative">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard.subtitle')}
        </p>
        {analyses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="absolute right-6 top-6 md:right-10 md:top-10"
            onClick={() => exportAllAnalysesToPdf(analyses)}
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            {t('dashboard.exportAll')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('dashboard.empty')}</p>
            <Link to="/">
              <Button variant="outline" size="sm" className="mt-4">{t('dashboard.createFirst')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <AnalysisFilters
            analyses={analyses}
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({ dateFrom: '', dateTo: '', particleType: '' })}
          />

          {filteredAnalyses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredAnalyses.map((a) => {
                const isSelected = selected.find((s) => s.id === a.id);
                return (
                <Card
                  key={a.id}
                  className={cn(
                    'cursor-pointer transition-all overflow-hidden',
                    isSelected ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/40'
                  )}
                  onClick={() => toggleSelect(a)}
                >
                  <div className="relative">
                    <img
                      src={a.image_url}
                      alt={a.name}
                      className="w-full h-36 object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-foreground truncate">{a.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.result?.total_particles ?? '—'} {t('dashboard.particles')} · {a.result?.types?.length ?? 0} {t('dashboard.types')}
                    </p>
                    <Link
                      to={`/analysis/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      {t('dashboard.viewDetail')}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}

          {selected.length >= 2 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <GitCompare className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.comparison')} · {selected.length} {t('dashboard.samples')}
                  </h2>
                </div>
                <ComparisonBarChart analyses={selected} />
              </CardContent>
            </Card>
          ) : selected.length === 1 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t('dashboard.selectMore')}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}