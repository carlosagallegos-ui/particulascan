import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

export default function ParticleUpload({ onAnalyze, analyzing }) {
  const { t } = useLang();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="max-h-56 mx-auto rounded-lg shadow-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium">{t('upload.dragDrop')}</p>
            <p className="text-xs text-muted-foreground">{t('upload.formats')}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sample-name">{t('upload.sampleName')}</Label>
        <Input
          id="sample-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('upload.placeholder')}
          className="bg-card"
        />
      </div>

      <Button
        onClick={() => onAnalyze(file, name)}
        disabled={!file || !name || analyzing}
        className="w-full h-11 text-sm font-semibold"
        size="lg"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('upload.analyzing')}
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4 mr-2" />
            {t('upload.analyze')}
          </>
        )}
      </Button>
    </div>
  );
}