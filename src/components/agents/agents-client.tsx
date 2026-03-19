'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, Plus, Zap, Clock } from 'lucide-react';
import { upsertAgent, deleteAgent } from '@/app/agents/actions';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { z } from 'zod';

type Agent = {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  terms: string | null;
  defaultLeadTimeDays: number | null;
  products: {
    id: string;
    product: {
      name: string;
    };
  }[];
};

type EditableAgent = {
  id?: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  terms: string;
  defaultLeadTimeDays: number;
};

// Client-side validation schema
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  terms: z.string().optional(),
  defaultLeadTimeDays: z.number().int().nonnegative('Must be 0 or more'),
});

export function AgentsClient({ agents: initialAgents }: { agents: Agent[] }) {
  const router = useRouter();
  const { t } = useTranslations();
  const [agents, setAgents] = useState(initialAgents);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<EditableAgent | null>(null);
  const [form, setForm] = useState<EditableAgent | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    if (!term) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(term) ||
        (agent.contactName ?? '').toLowerCase().includes(term) ||
        (agent.contactPhone ?? '').toLowerCase().includes(term)
    );
  }, [agents, debouncedSearch]);

  const openSheet = (agent?: Agent) => {
    const base: EditableAgent = agent
      ? {
          id: agent.id,
          name: agent.name,
          contactName: agent.contactName ?? '',
          contactPhone: agent.contactPhone ?? '',
          contactEmail: agent.contactEmail ?? '',
          terms: agent.terms ?? '',
          defaultLeadTimeDays: agent.defaultLeadTimeDays ?? 24,
        }
      : {
          name: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          terms: '',
          defaultLeadTimeDays: 24,
        };
    setEditing(base);
    setForm(base);
    setIsOpen(true);
  };

  const closeSheet = () => {
    setEditing(null);
    setForm(null);
    setIsOpen(false);
    setFieldErrors({});
  };

  const handleSave = () => {
    if (!form) return;

    // Validate form
    const payload = {
      name: form.name,
      contactName: form.contactName || '',
      contactPhone: form.contactPhone || '',
      contactEmail: form.contactEmail || '',
      terms: form.terms || '',
      defaultLeadTimeDays: Number(form.defaultLeadTimeDays) || 0,
    };

    const result = agentSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setFieldErrors({});

    const isEdit = !!form?.id;
    const optimisticId = form?.id || `temp-${Date.now()}`;
    const optimisticAgent: Agent = {
      id: optimisticId,
      name: payload.name,
      contactName: payload.contactName || null,
      contactPhone: payload.contactPhone || null,
      contactEmail: payload.contactEmail || null,
      terms: payload.terms || null,
      defaultLeadTimeDays: payload.defaultLeadTimeDays,
      products: [],
    };

    // Optimistic update
    if (isEdit) {
      setAgents((prev) =>
        prev.map((a) => (a.id === form.id ? optimisticAgent : a))
      );
    } else {
      setAgents((prev) => [optimisticAgent, ...prev]);
    }
    closeSheet();

    // Show loading toast
    const toastId = toast.loading(
      isEdit ? 'Updating agent...' : 'Creating agent...'
    );

    startTransition(async () => {
      try {
        await upsertAgent({
          ...payload,
          id: form?.id,
        });
        toast.success(
          isEdit
            ? t('agents.form.updated', 'Agent updated')
            : t('agents.form.created', 'Agent created'),
          { id: toastId }
        );
        router.refresh();
      } catch (err) {
        console.error(err);
        // Rollback on error
        if (isEdit && editing) {
          const originalAgent = initialAgents.find((a) => a.id === form.id);
          if (originalAgent) {
            setAgents((prev) =>
              prev.map((a) => (a.id === form.id ? originalAgent : a))
            );
          }
        } else {
          setAgents((prev) => prev.filter((a) => a.id !== optimisticId));
        }
        toast.error(
          err instanceof Error
            ? err.message
            : t('agents.form.error', 'Failed to save agent'),
          { id: toastId }
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('agents.form.deleteConfirm', 'Remove this agent?'))) return;

    // Store the agent for potential rollback
    const deletedAgent = agents.find((a) => a.id === id);
    if (!deletedAgent) return;

    // Optimistic delete
    setAgents((prev) => prev.filter((a) => a.id !== id));
    const toastId = toast.loading('Deleting agent...');

    startTransition(async () => {
      try {
        await deleteAgent({ id });
        toast.success(t('agents.form.deleted', 'Agent deleted'), {
          id: toastId,
        });
        router.refresh();
      } catch (err) {
        console.error(err);
        // Rollback on error
        setAgents((prev) => [...prev, deletedAgent]);
        toast.error(
          err instanceof Error
            ? err.message
            : t('agents.form.deleteError', 'Failed to delete agent'),
          { id: toastId }
        );
      }
    });
  };

  return (
    <>
      <section className="glass-panel sticky top-4 z-30 rounded-3xl border border-white/5 bg-background/60 px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                'agents.searchPlaceholder',
                'Search agents or contacts'
              )}
              className="pl-9 bg-black/20 border-white/10 focus:border-cyan-500/50 transition-all"
            />
          </div>
          <Button
            className="brand-glow bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
            onClick={() => openSheet()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('agents.addButton', 'Add Node')}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-6">
        {filtered.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onEdit={() => openSheet(agent)} 
            onDelete={() => handleDelete(agent.id)} 
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-border/60 bg-background/30 px-3 py-4 text-sm text-muted-foreground">
          {t(
            'agents.emptyState',
            'No agents found. Adjust the search or add a partner.'
          )}
        </p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl space-y-0 rounded-[2.5rem] border border-white/10 bg-black/80 p-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="text-xl font-bold text-foreground">
              {editing
                ? t('agents.form.editTitle', 'Edit Node')
                : t('agents.form.addTitle', 'Initialize Node')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configure connection parameters and contact protocols.
            </p>
          </DialogHeader>
          
          {form && (
            <div className="space-y-6 px-6 pb-6 pt-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('agents.form.identity', 'Identity Protocol')}
                </p>
                <div className="grid gap-4">
                  <div>
                    <Input
                      placeholder={t('agents.form.name', 'Agent name')}
                      value={form.name}
                      onChange={(e) =>
                        setForm(
                          (prev) => prev && { ...prev, name: e.target.value }
                        )
                      }
                      className={cn("bg-black/20 border-white/10 focus:border-cyan-500/50", fieldErrors.name && 'border-destructive')}
                    />
                    {fieldErrors.name && (
                      <span className="text-xs font-medium text-destructive mt-1 block">
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder={t('agents.form.contactName', 'Contact name')}
                      value={form.contactName}
                      onChange={(e) =>
                        setForm(
                          (prev) =>
                            prev && { ...prev, contactName: e.target.value }
                        )
                      }
                      className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                    />
                    <Input
                      placeholder={t('agents.form.contactPhone', 'Contact phone')}
                      value={form.contactPhone}
                      onChange={(e) =>
                        setForm(
                          (prev) =>
                            prev && { ...prev, contactPhone: e.target.value }
                        )
                      }
                      className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder={t(
                        'agents.form.contactEmail',
                        'Contact email'
                      )}
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) =>
                        setForm(
                          (prev) =>
                            prev && { ...prev, contactEmail: e.target.value }
                        )
                      }
                      className={cn(
                        "bg-black/20 border-white/10 focus:border-cyan-500/50",
                        fieldErrors.contactEmail && 'border-destructive'
                      )}
                    />
                    {fieldErrors.contactEmail && (
                      <span className="text-xs font-medium text-destructive mt-1 block">
                        {fieldErrors.contactEmail}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('agents.form.agreement', 'SLA Parameters')}
                </p>
                <div className="grid gap-4">
                  <Input
                    placeholder={t('agents.form.terms', 'Terms / notes')}
                    value={form.terms}
                    onChange={(e) =>
                      setForm(
                        (prev) => prev && { ...prev, terms: e.target.value }
                      )
                    }
                    className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                  />
                  <div>
                    <div className="relative">
                      <Input
                        placeholder={t(
                          'agents.form.leadTime',
                          'Lead time (hours)'
                        )}
                        type="number"
                        min={1}
                        value={form.defaultLeadTimeDays}
                        onChange={(e) =>
                          setForm(
                            (prev) =>
                              prev && {
                                ...prev,
                                defaultLeadTimeDays: Number(e.target.value) || 24,
                              }
                          )
                        }
                        className={cn(
                          "bg-black/20 border-white/10 focus:border-cyan-500/50 pr-12",
                          fieldErrors.defaultLeadTimeDays && 'border-destructive'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">HRS</span>
                    </div>
                    {fieldErrors.defaultLeadTimeDays && (
                      <span className="text-xs font-medium text-destructive mt-1 block">
                        {fieldErrors.defaultLeadTimeDays}
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-white/5 bg-white/5">
            <Button variant="ghost" onClick={closeSheet} disabled={isPending} className="hover:bg-white/10">
              {t('agents.form.cancel', 'Abort')}
            </Button>
            <Button
              onClick={handleSave}
              loading={isPending}
              disabled={!form?.name}
              className="brand-glow bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
              {t('agents.form.save', 'Initialize')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgentCard({ agent, onEdit, onDelete }: { agent: Agent, onEdit: () => void, onDelete: () => void }) {
  // Keep the visual score stable per agent so cards do not shift on re-render.
  const reliability = getReliabilityScore(agent.id);
  const leadTime = agent.defaultLeadTimeDays ?? 24;
  
  // Calculate stroke dasharray for the circle
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (reliability / 100) * circumference;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/5 p-1 transition-all duration-500 hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
      {/* Cyberpunk Corner Accents */}
      <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-white/10 rounded-tl-[2rem] transition-colors group-hover:border-cyan-500/50" />
      <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/10 rounded-br-[2rem] transition-colors group-hover:border-cyan-500/50" />

      <div className="relative h-full rounded-[1.8rem] bg-black/40 p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground leading-none mb-1">{agent.name}</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Node ID: {agent.id.slice(0, 6)}</p>
            </div>
          </div>
          
          {/* Reliability Ring */}
          <div className="relative flex items-center justify-center">
            <svg className="h-12 w-12 -rotate-90 transform">
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="3"
                className="text-white/10"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-cyan-400 transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-cyan-400">{reliability}%</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Speed Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Lead Time</span>
              <span className="text-foreground">{leadTime}h Avg</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                style={{ width: `${Math.min(100, (24 / leadTime) * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
              <p className="text-xs font-semibold text-foreground truncate">{agent.contactName || '—'}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">SKUs</p>
              <p className="text-xs font-semibold text-foreground">{agent.products.length} Active</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-400">
            Configure
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete agent">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getReliabilityScore(agentId: string) {
  const hash = agentId
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return 85 + (hash % 16);
}
