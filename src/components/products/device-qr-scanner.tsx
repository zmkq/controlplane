'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { QrCode, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  lastSeen: Date;
}

interface DeviceQRScannerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

type ScanState = 'idle' | 'selecting' | 'scanning' | 'completed' | 'error' | 'timeout';

export function DeviceQRScanner({ value, onChange, error }: DeviceQRScannerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [manualMode, setManualMode] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Fetch registered mobile devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/devices');
        if (!response.ok) return;
        
        const data = await response.json();
        const mobileDevices = data.filter(
          (d: Device) => d.deviceType === 'mobile' || d.deviceType === 'tablet'
        );
        setDevices(mobileDevices);

        // Auto-select first device if only one
        if (mobileDevices.length === 1) {
          setSelectedDeviceId(mobileDevices[0].id);
        }
      } catch (error) {
        console.error('[Device Scanner] Failed to fetch devices:', error);
      }
    };

    fetchDevices();
  }, []);

  const startScan = async () => {
    if (!selectedDeviceId) {
      toast.error('Please select a device');
      return;
    }

    setScanState('scanning');

    try {
      // Create scan session
      const response = await fetch('/api/qr-scan/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDeviceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create scan session');
      }

      const { sessionId } = await response.json();

      // Connect to SSE stream for real-time updates
      const es = new EventSource(`/api/qr-scan/stream?sessionId=${sessionId}`);
      setEventSource(es);

      es.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'completed') {
            onChange(data.value);
            setScanState('completed');
            toast.success('QR code scanned!');
            es.close();
            setEventSource(null);
          } else if (data.type === 'expired') {
            setScanState('timeout');
            toast.error('Scan timeout - please try again');
            es.close();
            setEventSource(null);
          } else if (data.type === 'cancelled') {
            setScanState('idle');
            toast.info('Scan cancelled');
            es.close();
            setEventSource(null);
          } else if (data.type === 'error') {
            setScanState('error');
            toast.error(data.message || 'Scan error');
            es.close();
            setEventSource(null);
          }
        } catch (error) {
          console.error('[Device Scanner] SSE parse error:', error);
        }
      });

      es.onerror = () => {
        setScanState('error');
        toast.error('Connection error');
        es.close();
        setEventSource(null);
      };

      toast.success('Notification sent to device!');
    } catch (error) {
      console.error('[Device Scanner] Scan error:', error);
      setScanState('error');
      toast.error('Failed to initiate scan');
    }
  };

  const cancelScan = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setScanState('idle');
  };

  const resetScan = () => {
    setScanState('idle');
  };

  if (manualMode) {
    return (
      <div className="space-y-2">
        <Input
          placeholder="SKU / barcode"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('bg-black/20 border-white/10 focus:border-primary/50', error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setManualMode(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Use QR Scanner
        </Button>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-500">
            No mobile devices registered. Enable notifications on your phone to use QR scanning.
          </p>
        </div>
        <Input
          placeholder="SKU / barcode (manual entry)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('bg-black/20 border-white/10 focus:border-primary/50', error && 'border-destructive')}
        />
      </div>
    );
  }

  if (scanState === 'scanning') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Waiting for scan...</p>
              <p className="text-xs text-muted-foreground">
                Check your phone for the notification
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelScan}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (scanState === 'completed') {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-500">Scanned: {value}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetScan}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Scan different code
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scanState === 'timeout') {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-500">Scan timeout</p>
              <p className="text-xs text-muted-foreground">The scan request expired</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetScan}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (scanState === 'error') {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Scan failed</p>
              <p className="text-xs text-muted-foreground">Please try again</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetScan}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Combobox
          options={devices.map((d) => ({
            value: d.id,
            label: d.deviceName || `${d.deviceType || 'Device'} (${new Date(d.lastSeen).toLocaleDateString()})`,
          }))}
          value={selectedDeviceId}
          onChange={setSelectedDeviceId}
          placeholder="Select device..."
          className="flex-1 bg-black/20 border-white/10"
        />
        <Button
          type="button"
          onClick={startScan}
          disabled={!selectedDeviceId}
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          Scan
        </Button>
      </div>

      {value && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/20 border-white/10"
          placeholder="Scanned value will appear here"
        />
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setManualMode(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Enter manually instead
      </Button>
    </div>
  );
}
