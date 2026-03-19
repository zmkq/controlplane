'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { cn } from '@/lib/utils';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (value: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function QRScanner({ onScan, onError, className }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    const videoElement = videoRef.current;

    const startScanning = async () => {
      try {
        if (!videoElement) return;

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use rear camera on mobile
          },
        });

        setHasPermission(true);

        // Start decoding from video stream
        await reader.decodeFromVideoDevice(
          null, // Use default video device
          videoElement,
          (result, error) => {
            if (result) {
              const value = result.getText();
              console.log('[QR Scanner] Scanned:', value);
              setScanned(true);
              setIsScanning(false);
              
              // Stop the stream
              stream.getTracks().forEach((track) => track.stop());
              
              onScan(value);
            }

            // Ignore NotFoundException (no QR code in frame)
            if (error && !(error instanceof NotFoundException)) {
              console.error('[QR Scanner] Error:', error);
            }
          }
        );

        setIsScanning(true);
      } catch (error) {
        console.error('[QR Scanner] Failed to start:', error);
        setHasPermission(false);
        if (onError) {
          onError(error as Error);
        }
      }
    };

    startScanning();

    // Cleanup
    return () => {
      reader.reset();
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScan, onError]);

  if (hasPermission === false) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}>
        <XCircle className="h-16 w-16 text-destructive" />
        <h3 className="text-lg font-bold">Camera Access Denied</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Please enable camera permissions in your browser settings to scan QR codes.
        </p>
      </div>
    );
  }

  if (scanned) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}>
        <CheckCircle2 className="h-16 w-16 text-green-500 animate-pulse" />
        <h3 className="text-lg font-bold">Scanned Successfully!</h3>
        <p className="text-sm text-muted-foreground">
          Sending to desktop...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-black', className)}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Scan area frame */}
        <div className="relative h-64 w-64">
          {/* Corner borders */}
          <div className="absolute left-0 top-0 h-12 w-12 border-l-4 border-t-4 border-primary" />
          <div className="absolute right-0 top-0 h-12 w-12 border-r-4 border-t-4 border-primary" />
          <div className="absolute bottom-0 left-0 h-12 w-12 border-b-4 border-l-4 border-primary" />
          <div className="absolute bottom-0 right-0 h-12 w-12 border-b-4 border-r-4 border-primary" />

          {/* Scanning line animation */}
          <div className="absolute inset-x-0 top-0 h-1 bg-primary shadow-lg shadow-primary animate-scan" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <p className="text-sm font-medium">
            {isScanning ? 'Point camera at QR code' : 'Initializing camera...'}
          </p>
        </div>
      </div>
    </div>
  );
}
