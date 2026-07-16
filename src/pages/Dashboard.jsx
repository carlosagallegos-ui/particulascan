import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ComparisonBarChart from '@/components/ComparisonBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Check, Eye, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Historial de Análisis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona dos o más muestras para comparar su distribución de partículas.
        </p>
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
            <p className="text-sm text-muted-foreground">Aún no hay análisis registrados.</p>
            <Link to="/">
              <Button variant="outline" size="sm" className="mt-4">Crear primer análisis</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {analyses.map((a) => {
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
                      {a.result?.total_particles ?? '—'} partículas · {a.result?.types?.length ?? 0} tipos
                    </p>
                    <Link
                      to={`/analysis/${a.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      Ver detalle
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selected.length >= 2 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <GitCompare className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Comparativa · {selected.length} muestras
                  </h2>
                </div>
                <ComparisonBarChart analyses={selected} />
              </CardContent>
            </Card>
          ) : selected.length === 1 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Selecciona una muestra más para habilitar la comparativa.
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}