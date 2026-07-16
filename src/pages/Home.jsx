import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ParticleUpload from '@/components/ParticleUpload';
import AnalysisResultCard from '@/components/AnalysisResultCard';
import ParticlePieChart from '@/components/ParticlePieChart';
import ExportButtons from '@/components/ExportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const ANALYSIS_PROMPT = `Eres un analista experto en visión artificial especializado en partículas. Recibirás una imagen con partículas dispersas sobre un fondo contrastante. Tu tarea es procesarla y devolver exclusivamente un objeto JSON válido, sin ningún texto adicional, siguiendo las reglas a continuación.

## Pasos a realizar (internamente)
1. Segmenta con precisión todas las partículas de la imagen, ignorando fondo y ruido.
2. Clasifícalas en tipos según color, forma y tamaño. Define cada tipo con un nombre descriptivo (ej: "rojo circular pequeño", "azul alargado grande").
3. Calcula el área en píxeles de cada partícula y suma las áreas por tipo.
4. Calcula el porcentaje que ocupa cada tipo respecto al área total de todas las partículas (suma total de áreas de todos los tipos).
5. Si hay partículas aglomeradas o superpuestas, intenta separarlas; si no es posible, indícalo brevemente en el campo "notes".`;

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
        },
      },
    },
    notes: { type: 'string' },
  },
};

export default function Home() {
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
    } catch (err) {
      setError(err.message || 'Error al analizar la imagen. Intenta de nuevo.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Nuevo Análisis de Partículas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube una imagen de partículas sobre fondo contrastante para segmentar, clasificar y medir automáticamente.
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
                <CardTitle className="text-sm">Imagen analizada</CardTitle>
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
                <CardTitle className="text-sm">Distribución por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ParticlePieChart result={savedAnalysis.result} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">Resultados detallados</CardTitle>
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