'use client';

import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface OrderStepperProps {
  steps: Step[];
  currentStep: number;
}

export function OrderStepper({ steps, currentStep }: OrderStepperProps) {
  return (
    <div className="glass-panel rounded-3xl border border-border/60 bg-background/40 px-4 py-3 sm:px-6">
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          return (
            <li key={step.label} className="flex flex-1 items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition-all',
                  isActive && 'brand-glow border-transparent text-primary-foreground',
                  isComplete && 'border-primary/60 bg-primary/20 text-primary-foreground',
                  !isActive && !isComplete && 'border-border/70 bg-background/30 text-muted-foreground'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {index + 1}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
