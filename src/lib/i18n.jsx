import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  es: {
    // Layout
    'app.name': 'ParticleVision',
    'app.tagline': 'Analizador de partículas',
    'nav.new': 'Nuevo Análisis',
    'nav.history': 'Historial',
    'app.version': 'v1.0 · Visión artificial',

    // Home
    'home.title': 'Nuevo Análisis de Partículas',
    'home.subtitle': 'Sube una imagen de partículas sobre fondo contrastante para segmentar, clasificar y medir automáticamente.',
    'home.analyzedImage': 'Imagen analizada',
    'home.distribution': 'Distribución por tipo',
    'home.detailedResults': 'Resultados detallados',
    'home.errorDefault': 'Error al analizar la imagen. Intenta de nuevo.',

    // Upload
    'upload.dragDrop': 'Arrastra una imagen o haz clic para subir',
    'upload.formats': 'PNG, JPG · Partículas sobre fondo contrastante',
    'upload.sampleName': 'Nombre de la muestra',
    'upload.placeholder': 'Ej: Muestra A - Lote 23',
    'upload.analyzing': 'Analizando partículas...',
    'upload.analyze': 'Analizar partículas',

    // Result card
    'result.totalParticles': 'Total de partículas',
    'result.totalArea': 'Área total (px)',
    'result.fibers': '% Fibras',
    'result.type': 'Tipo',
    'result.count': 'Cantidad',
    'result.area': 'Área (px)',
    'result.notes': 'Notas',

    // Dashboard
    'dashboard.title': 'Historial de Análisis',
    'dashboard.subtitle': 'Selecciona dos o más muestras para comparar su distribución de partículas.',
    'dashboard.exportAll': 'Exportar todo a PDF',
    'dashboard.empty': 'Aún no hay análisis registrados.',
    'dashboard.createFirst': 'Crear primer análisis',
    'dashboard.noResults': 'No hay análisis que coincidan con los filtros.',
    'dashboard.particles': 'partículas',
    'dashboard.types': 'tipos',
    'dashboard.viewDetail': 'Ver detalle',
    'dashboard.comparison': 'Comparativa',
    'dashboard.samples': 'muestras',
    'dashboard.selectMore': 'Selecciona una muestra más para habilitar la comparativa.',

    // Filters
    'filters.title': 'Filtrar:',
    'filters.from': 'Desde',
    'filters.to': 'Hasta',
    'filters.particleType': 'Tipo de partícula',
    'filters.allTypes': 'Todos los tipos',
    'filters.clear': 'Limpiar',

    // Analysis detail
    'detail.notFound': 'Análisis no encontrado.',
    'detail.back': 'Volver al historial',

    // Export
    'export.defaultName': 'analisis',

    // Calibration
    'calibration.title': 'Calibración de escala',
    'calibration.start': 'Calibrar escala',
    'calibration.mode': 'Haz clic en dos puntos de una barra de escala conocida',
    'calibration.point1': 'Punto 1 seleccionado · haz clic para el punto 2',
    'calibration.pixelDistance': 'Distancia en píxeles',
    'calibration.realDistance': 'Distancia real (µm)',
    'calibration.save': 'Guardar calibración',
    'calibration.clear': 'Quitar calibración',
    'calibration.recalibrate': 'Recalibrar',
    'calibration.cancel': 'Cancelar',
    'calibration.umPerPixel': 'µm/px',
    'result.totalAreaUm': 'Área total (µm²)',
    'result.areaUm': 'Área (µm²)',

    // Overlay
    'overlay.title': 'Evidencia visual del conteo',
    'overlay.hide': 'Ocultar',
    'overlay.show': 'Mostrar',
    'overlay.noRegions': 'El modelo no devolvió regiones detectadas',
  },
  en: {
    // Layout
    'app.name': 'ParticleVision',
    'app.tagline': 'Particle analyzer',
    'nav.new': 'New Analysis',
    'nav.history': 'History',
    'app.version': 'v1.0 · Computer Vision',

    // Home
    'home.title': 'New Particle Analysis',
    'home.subtitle': 'Upload an image of particles on a contrasting background to segment, classify, and measure automatically.',
    'home.analyzedImage': 'Analyzed image',
    'home.distribution': 'Distribution by type',
    'home.detailedResults': 'Detailed results',
    'home.errorDefault': 'Error analyzing the image. Please try again.',

    // Upload
    'upload.dragDrop': 'Drag an image or click to upload',
    'upload.formats': 'PNG, JPG · Particles on contrasting background',
    'upload.sampleName': 'Sample name',
    'upload.placeholder': 'E.g: Sample A - Lot 23',
    'upload.analyzing': 'Analyzing particles...',
    'upload.analyze': 'Analyze particles',

    // Result card
    'result.totalParticles': 'Total particles',
    'result.totalArea': 'Total area (px)',
    'result.fibers': '% Fibers',
    'result.type': 'Type',
    'result.count': 'Count',
    'result.area': 'Area (px)',
    'result.notes': 'Notes',

    // Dashboard
    'dashboard.title': 'Analysis History',
    'dashboard.subtitle': 'Select two or more samples to compare their particle distribution.',
    'dashboard.exportAll': 'Export all to PDF',
    'dashboard.empty': 'No analyses registered yet.',
    'dashboard.createFirst': 'Create first analysis',
    'dashboard.noResults': 'No analyses match the filters.',
    'dashboard.particles': 'particles',
    'dashboard.types': 'types',
    'dashboard.viewDetail': 'View details',
    'dashboard.comparison': 'Comparison',
    'dashboard.samples': 'samples',
    'dashboard.selectMore': 'Select one more sample to enable comparison.',

    // Filters
    'filters.title': 'Filter:',
    'filters.from': 'From',
    'filters.to': 'To',
    'filters.particleType': 'Particle type',
    'filters.allTypes': 'All types',
    'filters.clear': 'Clear',

    // Analysis detail
    'detail.notFound': 'Analysis not found.',
    'detail.back': 'Back to history',

    // Export
    'export.defaultName': 'analysis',

    // Calibration
    'calibration.title': 'Scale calibration',
    'calibration.start': 'Calibrate scale',
    'calibration.mode': 'Click two points on a known scale bar',
    'calibration.point1': 'Point 1 selected · click for point 2',
    'calibration.pixelDistance': 'Pixel distance',
    'calibration.realDistance': 'Real distance (µm)',
    'calibration.save': 'Save calibration',
    'calibration.clear': 'Remove calibration',
    'calibration.recalibrate': 'Recalibrate',
    'calibration.cancel': 'Cancel',
    'calibration.umPerPixel': 'µm/px',
    'result.totalAreaUm': 'Total area (µm²)',
    'result.areaUm': 'Area (µm²)',

    // Overlay
    'overlay.title': 'Visual counting evidence',
    'overlay.hide': 'Hide',
    'overlay.show': 'Show',
    'overlay.noRegions': 'The model did not return detected regions',
  },
};

const LanguageContext = createContext({
  lang: 'es',
  t: (key) => translations.es[key] || key,
  setLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.es[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}