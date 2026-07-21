import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const TEST_IMAGE = 'https://media.base44.com/images/public/6a596b84c6d788906422fb3d/762a522ce_Imagen1.jpg';

const LLM_PROMPT = `Eres un analista experto en visión artificial. Cuenta TODAS las partículas en esta imagen (oscuras, claras y fibras). Divide la imagen en una cuadrícula 3x3 y cuenta región por región. Devuelve solo JSON: { "total_particles": number, "dark_particles": number, "light_particles": number, "fibers": number, "total_area_pixels": number, "notes": string }`;

const LLM_SCHEMA = {
  type: 'object',
  properties: {
    total_particles: { type: 'number' },
    dark_particles: { type: 'number' },
    light_particles: { type: 'number' },
    fibers: { type: 'number' },
    total_area_pixels: { type: 'number' },
    notes: { type: 'string' },
  },
};

const METHODOLOGIES = [
  { key: 'sobel', name: 'Sobel + Hole Fill', desc: 'Detección de bordes + relleno de huecos. Detecta oscuras y claras.', color: 'text-chart-1' },
  { key: 'otsu', name: 'Otsu (baseline)', desc: 'Threshold global. Solo partículas oscuras de alto contraste.', color: 'text-chart-5' },
  { key: 'multi', name: 'Multi-threshold', desc: 'Doble threshold: oscuras (Otsu) + claras (bright-side stats).', color: 'text-chart-3' },
  { key: 'erosion', name: 'Progressive Erosion', desc: 'Sobel + erosión progresiva para separar partículas tocadas.', color: 'text-chart-2' },
];

export default function MethodologyTest() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    runAll();
  }, []);

  const runAll = async () => {
    setLoading(true);
    setResults(null);
    setErrors({});

    // Import methodologies dynamically
    const { classicalParticleCount, otsuParticleCount, multiThresholdCount, progressiveErosionCount } = await import('@/lib/classicalCV');

    const runners = {
      sobel: () => classicalParticleCount(TEST_IMAGE),
      otsu: () => otsuParticleCount(TEST_IMAGE),
      multi: () => multiThresholdCount(TEST_IMAGE),
      erosion: () => progressiveErosionCount(TEST_IMAGE),
    };

    // Run all classical CV methods in parallel
    const cvPromises = Object.entries(runners).map(async ([key, fn]) => {
      try {
        const result = await fn();
        return [key, result];
      } catch (err) {
        return [key, null];
      }
    });

    // Run 3 LLM analyses in parallel
    const llmPromises = Array.from({ length: 3 }, () =>
      base44.integrations.Core.InvokeLLM({
        prompt: LLM_PROMPT,
        file_urls: [TEST_IMAGE],
        response_json_schema: LLM_SCHEMA,
      }).catch(() => null)
    );

    const [cvResults, llmResults] = await Promise.all([
      Promise.all(cvPromises),
      Promise.all(llmPromises),
    ]);

    const cvMap = {};
    const errMap = {};
    for (const [key, result] of cvResults) {
      if (result) cvMap[key] = result;
      else errMap[key] = true;
    }

    const validLlm = llmResults.filter((r) => r != null);
    const llmCounts = validLlm.map((r) => r.total_particles || 0);
    const sortedLlm = [...llmCounts].sort((a, b) => a - b);
    const llmMedian = sortedLlm.length > 0 ? sortedLlm[Math.floor(sortedLlm.length / 2)] : null;
    const llmMean = llmCounts.length > 0 ? llmCounts.reduce((a, b) => a + b, 0) / llmCounts.length : null;
    const llmStd = llmCounts.length > 1
      ? Math.sqrt(llmCounts.reduce((s, c) => s + (c - llmMean) ** 2, 0) / llmCounts.length)
      : 0;

    setResults({
      cv: cvMap,
      errors: errMap,
      llm: {
        runs: llmCounts,
        median: llmMedian,
        mean: Math.round(llmMean * 100) / 100,
        std: Math.round(llmStd * 100) / 100,
        details: validLlm[0],
      },
    });
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Test de Metodologías</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comparación de todas las metodologías de conteo clásico vs LLM ensemble (3 corridas).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Imagen de prueba</CardTitle></CardHeader>
          <CardContent>
            <img src={TEST_IMAGE} alt="Test" className="w-full rounded-lg border border-border" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">LLM Ensemble (referencia)</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Ejecutando 3 corridas...
              </div>
            ) : results?.llm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background/50 p-3 border border-border text-center">
                    <p className="text-xs text-muted-foreground">Mediana</p>
                    <p className="text-2xl font-bold text-primary tabular-nums">{results.llm.median}</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-border text-center">
                    <p className="text-xs text-muted-foreground">Media</p>
                    <p className="text-2xl font-bold text-accent tabular-nums">{results.llm.mean}</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-border text-center">
                    <p className="text-xs text-muted-foreground">Std Dev</p>
                    <p className="text-2xl font-bold text-chart-3 tabular-nums">±{results.llm.std}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Corridas: {results.llm.runs.join(', ')}
                </div>
                {results.llm.details?.notes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
                    {results.llm.details.notes}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center"><span className="text-muted-foreground">Oscuras:</span> <span className="font-bold">{results.llm.details?.dark_particles ?? '—'}</span></div>
                  <div className="text-center"><span className="text-muted-foreground">Claras:</span> <span className="font-bold">{results.llm.details?.light_particles ?? '—'}</span></div>
                  <div className="text-center"><span className="text-muted-foreground">Fibras:</span> <span className="font-bold">{results.llm.details?.fibers ?? '—'}</span></div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Resultados por metodología</CardTitle>
            <button onClick={runAll} disabled={loading} className="text-xs text-primary hover:underline disabled:opacity-50">
              {loading ? 'Ejecutando...' : 'Re-ejecutar'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {METHODOLOGIES.map((m) => {
                const result = results?.cv[m.key];
                const hasError = results?.errors[m.key];
                const llmMedian = results?.llm?.median;
                const diff = result && llmMedian ? Math.abs(result.count - llmMedian) : null;
                const diffPct = result && llmMedian ? Math.round((diff / llmMedian) * 100) : null;

                return (
                  <div key={m.key} className="flex items-center gap-4 rounded-lg border border-border p-4">
                    <div className="flex-1">
                      <p className={`font-medium ${m.color}`}>{m.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      {m.key === 'erosion' && result?.countsByLevel && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Niveles: {result.countsByLevel.join(' → ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {hasError ? (
                        <div className="flex items-center gap-1.5 text-destructive">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Error</span>
                        </div>
                      ) : result ? (
                        <div>
                          <p className="text-3xl font-bold text-foreground tabular-nums">{result.count}</p>
                          {diffPct != null && (
                            <p className={`text-xs ${diffPct <= 10 ? 'text-accent' : diffPct <= 25 ? 'text-chart-3' : 'text-destructive'}`}>
                              Δ {diffPct}% vs LLM
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && results && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-accent">
            <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
            <strong>Mejor metodología:</strong> la que tenga menor Δ% vs LLM. Las que detectan ambas polaridades (Sobel, Multi-threshold, Progressive Erosion) deberían superar a Otsu.
          </p>
        </div>
      )}
    </div>
  );
}