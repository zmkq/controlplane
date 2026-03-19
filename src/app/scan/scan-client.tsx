'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/qr/qr-scanner';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScanPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify session is valid
    if (!sessionId) {
      setSessionValid(false);
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`/api/qr-scan/session?sessionId=${sessionId}`);
        if (!response.ok) {
          setSessionValid(false);
          return;
        }

        const data = await response.json();
        if (data.status === 'EXPIRED' || data.status === 'CANCELLED' || data.status === 'COMPLETED') {
          setSessionValid(false);
          toast.error('This scan session is no longer valid');
          return;
        }

        setSessionValid(true);
      } catch (error) {
        console.error('[Scan] Session verification error:', error);
        setSessionValid(false);
      }
    };

    verifySession();
  }, [sessionId]);

  const handleScan = async (value: string) => {
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/qr-scan/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, value }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit scan');
        return;
      }

      toast.success('Scan sent to desktop!');

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('[Scan] Submit error:', error);
      toast.error('Failed to submit scan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (error: Error) => {
    toast.error('Camera error: ' + error.message);
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold">Invalid Scan Request</h1>
        <p className="text-muted-foreground max-w-md">
          This page requires a valid scan session. Please initiate a scan from the desktop app.
        </p>
        <Button onClick={() => router.push('/')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Session Expired</h1>
        <p className="text-muted-foreground max-w-md">
          This scan session has expired or is no longer valid.
        </p>
        <Button onClick={() => router.push('/')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </div>
    );
  }

  if (sessionValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 p-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Scan QR Code</h1>
            <p className="text-sm text-muted-foreground">
              Point your camera at the product barcode
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Scanner */}
      <div className="flex flex-1 items-center justify-center p-4">
        <QRScanner
          onScan={handleScan}
          onError={handleError}
          className="aspect-square w-full max-w-2xl"
        />
      </div>
    </div>
  );
}
