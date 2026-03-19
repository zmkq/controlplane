'use client';

import { Input } from '@/components/ui/input';

export interface AgentFormState {
  id?: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  terms: string;
  defaultLeadTimeDays: number;
}

interface AgentSheetProps {
  form: AgentFormState;
  setForm: (fn: (prev: AgentFormState) => AgentFormState) => void;
}

export function AgentSheetForm({ form, setForm }: AgentSheetProps) {
  const updateField = (field: keyof AgentFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Partner identity</p>
        <div className="mt-4 grid gap-3">
          <Input
            placeholder="Agent name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Input
            placeholder="Contact name"
            value={form.contactName}
            onChange={(e) => updateField('contactName', e.target.value)}
          />
          <Input
            placeholder="Contact phone"
            value={form.contactPhone}
            onChange={(e) => updateField('contactPhone', e.target.value)}
          />
          <Input
            placeholder="Contact email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => updateField('contactEmail', e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Agreement</p>
        <div className="mt-4 grid gap-3">
          <Input
            placeholder="Terms / notes"
            value={form.terms}
            onChange={(e) => updateField('terms', e.target.value)}
          />
          <Input
            placeholder="Lead time (hours)"
            type="number"
            min={1}
            value={form.defaultLeadTimeDays}
            onChange={(e) => updateField('defaultLeadTimeDays', Number(e.target.value) || 24)}
          />
        </div>
      </div>
    </div>
  );
}
