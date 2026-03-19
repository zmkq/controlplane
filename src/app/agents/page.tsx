import { prisma } from '@/lib/prisma';
import { AgentsPageClient } from '@/components/agents/agents-page-client';

export default async function AgentsPage() {
  const agents = await prisma.supplier.findMany({
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  type AgentWithProducts = typeof agents[number];

  const serialized = agents.map((agent: AgentWithProducts) => ({
    ...agent,
    products: agent.products.map((item: AgentWithProducts['products'][number]) => ({
      id: item.id,
      product: {
        name: item.product.name,
      },
    })),
  }));

  const activeAgents = agents.length;
  const totalSkusManaged = agents.reduce((acc, agent) => acc + agent.products.length, 0);

  return (
    <AgentsPageClient
      agents={serialized}
      activeAgents={activeAgents}
      totalSkusManaged={totalSkusManaged}
    />
  );
}
