import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AnalysisResultCard from '@/components/AnalysisResultCard';
import ParticlePieChart from '@/components/ParticlePieChart';
import ExportButtons from '@/components/ExportButtons';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function AnalysisDetail() {
  const { t } = useLang();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Analysis
      .get(id)
      .then((data) => setAnalysis(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-10 max-w-5xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">{t('detail.notFound')}</p>
        <Link to="/dashboard" className="text-primary text-sm hover:underline mt-2 inline-block">
          {t('detail.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t('detail.back')}
      </Link>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">{analysis.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('home.analyzedImage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={analysis.image_url} alt={analysis.name} className="w-full rounded-lg border border-border" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('home.distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ParticlePieChart result={analysis.result} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">{t('home.detailedResults')}</CardTitle>
          <ExportButtons analysis={analysis} />
        </CardHeader>
        <CardContent>
          <AnalysisResultCard result={analysis.result} />
        </CardContent>
      </Card>
    </div>
  );
}