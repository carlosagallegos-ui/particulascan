import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ParticleUpload from '@/components/ParticleUpload';
import AnalysisResultCard from '@/components/AnalysisResultCard';
import ParticlePieChart from '@/components/ParticlePieChart';
import ExportButtons from '@/components/ExportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { exportAnalysisToPdf } from '@/lib/exportPdf';
import { useLang } from '@/lib/i18n';

const ANALYSIS_PROMPT = `Eres un analista experto en visión artificial especializado en el conteo y clasificación precisa de partículas en imágenes microscópicas. Recibirás una imagen con partículas dispersas sobre un fondo contrastante. Tu objetivo es devolver exclusivamente un objeto JSON válido, sin texto adicional, con resultados reproducibles y consistentes.

## METODOLOGÍA DE CONTEO (ejecuta paso a paso internamente antes de generar el JSON)

### Paso 1 — Segmentación determinista
- Ignora completamente el fondo, ruido, artefactos y reflejos.
- Una "partícula" es todo objeto conectado claramente diferenciado del fondo por color, brillo o borde.
- Si dos partículas se tocan pero tienen bordes reconocibles, cuéntalas como separadas.
- Si dos partículas están fusionadas sin borde visible, cuéntalas como una sola.

### Paso 2 — Conteo sistemático (CRÍTICO para consistencia)
- Divide mentalmente la imagen en una cuadrícula de 3 columnas × 3 filas (9 regiones).
- Cuenta las partículas región por región, de izquierda a derecha y de arriba abajo:
  1. Esquina superior izquierda → 2. Superior centro → 3. Superior derecha
  4. Medio izquierda → 5. Centro → 6. Medio derecha
  7. Inferior izquierda → 8. Inferior centro → 9. Inferior derecha
- Dentro de cada región, cuenta de izquierda a derecha, fila por fila, de arriba abajo.
- Lleva un conteo interno por región y súmalas al final. NO estimes ni redondees.

### Paso 3 — Clasificación
- Agrupa las partículas por tipo según color, forma y tamaño.
- Usa nombres descriptivos consistentes (ej: "esféricas oscuras", "alargadas claras", "fragmentos irregulares").
- Mantén entre 2 y 6 tipos como máximo.

### Paso 4 — Área
- Estima el área en píxeles de cada partícula individual y súmala por tipo.
- Suma todas las áreas para obtener el área total de partículas.

### Paso 5 — Porcentajes
- percentage_of_particle_area = (área del tipo / área total de partículas) × 100
- Redondea a 2 decimales. La suma de todos los porcentajes debe dar ~100.

### Paso 6 — Fibras
- Las fibras son partículas alargadas con relación de aspecto (largo/ancho) ≥ 3:1.
- Marca is_fiber=true en cada tipo que sea fibra; is_fiber=false en el resto.
- fiber_percentage = (área total de fibras / área total de partículas) × 100, redondeado a 2 decimales.

## REGLAS DE CONSISTENCIA
- Cuenta cada partícula exactamente una vez.
- El valor de total_particles debe ser igual a la suma de los "count" de todos los tipos.
- El valor de total_particle_area_pixels debe ser igual a la suma de los "total_area_pixels" de todos los tipos.
- Si hay ambigüedad en una región, cuenta la opción más conservadora.`;

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    total_particles: { type: 'number' },
    total_particle_area_pixels: { type: 'number' },
    types: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type_name: { type: 'string' },
          count: { type: 'number' },
          total_area_pixels: { type: 'number' },
          percentage_of_particle_area: { type: 'number' },
          is_fiber: { type: 'boolean' },
        },
      },
    },
    notes: { type: 'string' },
    fiber_percentage: { type: 'number' },
  },
};

export default function Home() {
  const { t } = useLang();
  const [analyzing, setAnalyzing] = useState(false);
  const [savedAnalysis, setSavedAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (file, name) => {
    setAnalyzing(true);
    setError(null);
    setSavedAnalysis(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: ANALYSIS_PROMPT,
        file_urls: [file_url],
        response_json_schema: ANALYSIS_SCHEMA,
      });

      const saved = await base44.entities.Analysis.create({
        name,
        image_url: file_url,
        result: analysisResult,
      });

      setSavedAnalysis(saved);

      try {
        await exportAnalysisToPdf({ ...saved, result: analysisResult });
      } catch (_) {
      }
    } catch (err) {
      setError(err.message || t('home.errorDefault'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('home.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('home.subtitle')}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ParticleUpload onAnalyze={handleAnalyze} analyzing={analyzing} />
        </CardContent>
      </Card>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedAnalysis && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('home.analyzedImage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={savedAnalysis.image_url}
                  alt={savedAnalysis.name}
                  className="w-full rounded-lg border border-border"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('home.distribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ParticlePieChart result={savedAnalysis.result} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">{t('home.detailedResults')}</CardTitle>
              <ExportButtons analysis={savedAnalysis} />
            </CardHeader>
            <CardContent>
              <AnalysisResultCard result={savedAnalysis.result} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}