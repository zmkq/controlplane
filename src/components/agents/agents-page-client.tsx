'use client';

import { Clock3, Sparkles, Workflow } from 'lucide-react';
import { AgentsClient } from '@/components/agents/agents-client';
import { useTranslations } from '@/lib/i18n';

type AgentWithProducts = {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  terms: string | null;
  defaultLeadTimeDays: number | null;
  createdAt: Date;
  updatedAt: Date;
  products: {
    id: string;
    product: {
      name: string;
    };
  }[];
};

type AgentsPageClientProps = {
  agents: AgentWithProducts[];
  activeAgents: number;
  totalSkusManaged: number;
};

export function AgentsPageClient({
  agents,
  activeAgents,
  totalSkusManaged,
}: AgentsPageClientProps) {
  const { t } = useTranslations();
  const averageSkus =
    activeAgents > 0 ? (totalSkusManaged / activeAgents).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-10">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_58%)] lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
                {t('agents.hero.neuralNetwork', 'Neural Network')}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {agents.length > 0
                  ? t('agents.heroNetworkState', 'Roster synced')
                  : t('agents.heroNetworkEmpty', 'Awaiting first node')}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                <span className="text-foreground">
                  {t('agents.heroSubtitle', 'Agent Roster')}
                </span>{' '}
                <span className="text-holographic">
                  {t('agents.heroSurface', 'Partner Mesh')}
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  'agents.heroBody',
                  'Manage your distributed fulfillment nodes. Monitor reliability and lead times.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                {activeAgents} active nodes online
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                {totalSkusManaged} SKUs routed through partner ops
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                {averageSkus} SKUs per node
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[36rem]">
            <SignalCard
              icon={Workflow}
              label={t('agents.metrics.activeNodes', 'Active Nodes')}
              value={activeAgents.toString()}
              tone="primary"
            />
            <SignalCard
              icon={Sparkles}
              label={t('agents.metrics.managedSkus', 'Managed SKUs')}
              value={totalSkusManaged.toString()}
              tone="accent"
            />
            <SignalCard
              icon={Clock3}
              label={t('agents.metricAverage', 'Avg SKUs / Node')}
              value={averageSkus}
              tone="neutral"
            />
          </div>
        </div>
      </section>

      <AgentsClient agents={agents} />
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Workflow;
  label: string;
  value: string;
  tone: 'primary' | 'accent' | 'neutral';
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-cyan-300 border-cyan-400/20 bg-cyan-400/10'
      : tone === 'neutral'
        ? 'text-foreground border-white/10 bg-white/5'
        : 'text-primary border-primary/20 bg-primary/10';

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
