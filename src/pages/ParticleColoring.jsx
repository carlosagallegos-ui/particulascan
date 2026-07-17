import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

const COLOR_PALETTE = [
  '#4F8EF7', '#3ECFA4', '#F7B84F', '#A84FF7',
  '#F7584F', '#4FF7D8', '#F74FB8', '#B8F74F',
  '#4FF7F7', '#F7A84F',
];

const COLORING_PROMPT = `Eres un experto en visión artificial. Analiza la imagen de partículas y identifica cada partícula individual. Para cada una, devuelve su posición y tamaño como porcentaje de las dimensiones totales de la imagen (0 a 100), junto con su tipo de partícula.

Clasifica las partículas en tipos según su color, forma y tamaño. Usa nombres descriptivos y consistentes (ej: "esféricas oscuras", "alargadas claras").

Devuelve exclusivamente un JSON con un array "particles" donde cada elemento tiene:
- type_name: nombre del tipo de partícula
- x: posición X del centro como porcentaje (0-100)
- y: posición Y del centro como porcentaje (0-100)  
- width: ancho como porcentaje (0-100)
- height: alto como porcentaje (0-100)

Cuenta cada partícula exactamente una vez. Las coordenadas deben estar en el sistema de imágenes estándar (0,0 = esquina superior izquierda).`;

const COLORING_SCHEMA = {
  type: 'object',
  properties: {
    particles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type_name: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
  },
};

export default function ParticleColoring() {
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [particles, setParticles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());

  useEffect(() => {
    base44.entities.Analysis
      .list('-created_date', 50)
      .then((data) => setAnalyses(data))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (analysis) => {
    setSelected(analysis);
    setParticles(null);
    setHiddenTypes(new Set());
    setProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: COLORING_PROMPT,
        file_urls: [analysis.image_url],
        response_json_schema: COLORING_SCHEMA,
      });
      setParticles(result.particles || []);
    } catch {
      setParticles([]);
    } finally {
      setProcessing(false);
    }
  };

  const typeColors = useMemo(() => {
    const map = {};
    if (!particles) return map;
    const types = [...new Set(particles.map((p) => p.type_name))];
    types.forEach((t, i) => { map[t] = COLOR_PALETTE[i % COLOR_PALETTE.length]; });
    return map;
  }, [particles]);

  const toggleType = (type) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          Coloreo de Partículas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona un análisis para visualizar cada partícula coloreada según su tipo.
        </p>
      </div>

      {!selected ? (
        analyses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay análisis disponibles.</p>
              <Link to="/">
                <Button variant="outline" size="sm" className="mt-4">Crear un análisis</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((a) => (
              <Card
                key={a.id}
                className="cursor-pointer transition-all overflow-hidden hover:border-primary/40 hover:ring-1 hover:ring-primary/20"
                onClick={() => handleSelect(a)}
              >
                <div className="relative">
                  <img src={a.image_url} alt={a.name} className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-foreground truncate">{a.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.result?.total_particles ?? '—'} partículas
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setParticles(null); }}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Volver
            </Button>
            <h2 className="text-sm font-medium text-foreground truncate">{selected.name}</h2>
          </div>

          {processing ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Detectando y coloreando partículas...</p>
              </CardContent>
            </Card>
          ) : particles && particles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="relative w-full">
                      <img
                        src={selected.image_url}
                        alt={selected.name}
                        className="w-full rounded-lg"
                      />
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        {particles.map((p, i) => {
                          if (hiddenTypes.has(p.type_name)) return null;
                          const color = typeColors[p.type_name] || '#4F8EF7';
                          const x = Math.max(0, p.x - p.width / 2);
                          const y = Math.max(0, p.y - p.height / 2);
                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={y}
                                width={Math.min(p.width, 100 - x)}
                                height={Math.min(p.height, 100 - y)}
                                fill={color}
                                fillOpacity="0.35"
                                stroke={color}
                                strokeWidth="0.3"
                                rx="0.5"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Leyenda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(typeColors).map(([type, color]) => {
                      const count = particles.filter((p) => p.type_name === type).length;
                      const isHidden = hiddenTypes.has(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className="flex items-center gap-2 w-full text-left p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                        >
                          <span
                            className="w-4 h-4 rounded shrink-0 border border-white/20"
                            style={{ backgroundColor: color, opacity: isHidden ? 0.2 : 1 }}
                          />
                          <span className="text-xs text-foreground truncate flex-1">{type}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                          {isHidden ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                      Click en un tipo para mostrar/ocultar
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No se pudieron detectar partículas en esta imagen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}