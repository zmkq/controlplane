'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Package,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ProgressStep =
  | 'validating'
  | 'checking-inventory'
  | 'calculating-costs'
  | 'processing-items'
  | 'finalizing'
  | 'success'
  | 'error';

interface OrderProgressModalProps {
  isOpen: boolean;
  currentStep: ProgressStep;
  error?: string;
  onClose?: () => void;
}

type StepDefinition = {
  label: string;
  icon: LucideIcon;
  order: number;
};

const stepConfig = {
  validating: {
    label: 'Validating order details',
    icon: Check,
    order: 1,
  },
  'checking-inventory': {
    label: 'Checking inventory',
    icon: Search,
    order: 2,
  },
  'calculating-costs': {
    label: 'Calculating costs (FIFO)',
    icon: Loader2,
    order: 3,
  },
  'processing-items': {
    label: 'Processing items and bundles',
    icon: Package,
    order: 4,
  },
  finalizing: {
    label: 'Finalizing order',
    icon: Check,
    order: 5,
  },
  success: {
    label: 'Order created successfully',
    icon: CheckCircle2,
    order: 6,
  },
  error: {
    label: 'Error creating order',
    icon: AlertCircle,
    order: 0,
  },
} satisfies Record<ProgressStep, StepDefinition>;

const confettiParticles = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index * 17) % 100}%`,
  delay: `${(index % 6) * 0.08}s`,
  duration: `${2.4 + (index % 5) * 0.18}s`,
  color: ['#dbec0a', '#62c3ff', '#ff6b9d', '#ffd93d'][index % 4],
  rotate: `${index * 19}deg`,
}));

export function OrderProgressModal({
  isOpen,
  currentStep,
  error,
  onClose,
}: OrderProgressModalProps) {
  if (!isOpen) return null;

  const currentOrder = stepConfig[currentStep].order;
  const isError = currentStep === 'error';
  const isSuccess = currentStep === 'success';
  const canClose = isError || isSuccess;
  const StepIcon = stepConfig[currentStep].icon;
  const showConfetti = isSuccess;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiParticles.map((particle, index) => (
            <div
              key={`${particle.left}-${index}`}
              className="absolute animate-confetti"
              style={{
                left: particle.left,
                top: '-10%',
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            >
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: particle.color,
                  transform: `rotate(${particle.rotate})`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative mx-4 w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
        <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div
              className={cn(
                'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300',
                isError &&
                  'border border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]',
                isSuccess &&
                  'border border-primary/50 bg-primary/10 text-primary shadow-[0_0_30px_rgba(219,236,10,0.3)] animate-bounce',
                !isError &&
                  !isSuccess &&
                  'border border-white/10 bg-white/5 text-foreground animate-pulse'
              )}
            >
              <StepIcon className="h-9 w-9" />
            </div>
            <h2
              className={cn(
                'text-xl font-bold',
                isError && 'text-red-400',
                isSuccess && 'text-primary'
              )}
            >
              {stepConfig[currentStep].label}
            </h2>
            {error && <p className="mt-2 text-sm text-red-300/80">{error}</p>}
          </div>

          {!isError && (
            <div className="space-y-3">
              {Object.entries(stepConfig)
                .filter(([key]) => key !== 'error' && key !== 'success')
                .sort(([, a], [, b]) => a.order - b.order)
                .map(([key, config]) => {
                  const stepKey = key as ProgressStep;
                  const stepOrder = config.order;
                  const isComplete = currentOrder > stepOrder;
                  const isCurrent = currentStep === stepKey;
                  const isPending = currentOrder < stepOrder;

                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 transition-all duration-300',
                        isComplete &&
                          'border-primary/30 bg-primary/5 opacity-100',
                        isCurrent &&
                          'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(219,236,10,0.15)]',
                        isPending &&
                          'border-white/5 bg-white/5 opacity-40'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                          isComplete &&
                            'border-primary/50 bg-primary text-primary-foreground',
                          isCurrent &&
                            'border-primary/30 bg-primary/20 text-primary',
                          isPending &&
                            'border-white/10 bg-white/5 text-muted-foreground'
                        )}
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">{stepOrder}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            (isComplete || isCurrent) && 'text-foreground',
                            isPending && 'text-muted-foreground'
                          )}
                        >
                          {config.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {canClose && onClose && (
            <div className="mt-6">
              <Button
                onClick={onClose}
                className={cn(
                  'w-full rounded-xl py-6 font-bold transition-all',
                  isSuccess &&
                    'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(219,236,10,0.4)] hover:shadow-[0_0_50px_rgba(219,236,10,0.6)]',
                  isError && 'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                {isSuccess ? 'View order' : 'Try again'}
              </Button>
            </div>
          )}

          {!canClose && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Please wait...</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
