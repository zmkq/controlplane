'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or WebP images.';
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      setIsUploading(true);

      try {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const nextReader = new FileReader();
          nextReader.onload = () => {
            const result = nextReader.result as string;
            const base64Data = result.replace(/^data:image\/\w+;base64,/, '');
            resolve(base64Data);
          };
          nextReader.onerror = reject;
          nextReader.readAsDataURL(file);
        });

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            type: file.type,
          }),
        });

        if (!response.ok) {
          const uploadError = await response.json();
          throw new Error(uploadError.error || 'Failed to upload image');
        }

        const data = await response.json();
        onChange(data.url);
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload image'
        );
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    onRemove?.();
  };

  if (preview) {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-background/40">
          <Image
            src={preview}
            alt="Product preview"
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            unoptimized={preview.startsWith('data:')}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="Remove uploaded image"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={isUploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-2xl transition-colors',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border/60 bg-background/40 hover:border-border hover:bg-background/60',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        id={inputId}
        disabled={isUploading}
      />
      <label
        htmlFor={inputId}
        className="flex flex-col items-center justify-center gap-3 p-8 cursor-pointer">
        {isUploading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="rounded-full border border-border/60 bg-background/50 p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Drop image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, or WebP (max {maxSizeMB}MB)
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Choose file
              </span>
            </Button>
          </>
        )}
      </label>
    </div>
  );
}
