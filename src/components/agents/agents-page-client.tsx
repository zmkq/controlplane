'use client';

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

  return (
    <div className="space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span className="tracking-widest uppercase">{t('agents.hero.neuralNetwork', 'Neural Network')}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('agents.heroSubtitle', 'Agent Roster')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('agents.heroBody', 'Manage your distributed fulfillment nodes. Monitor reliability and lead times.')}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('agents.metrics.activeNodes', 'Active Nodes')}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {activeAgents}
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('agents.metrics.managedSkus', 'Managed SKUs')}
            </p>
            <p className="text-2xl font-bold text-cyan-400 text-shadow-glow">
              {totalSkusManaged}
            </p>
          </div>
        </div>
      </div>

      <AgentsClient agents={agents} />
    </div>
  );
}
