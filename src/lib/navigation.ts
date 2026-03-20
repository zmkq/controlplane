import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings2,
  ShoppingCart,
  Users,
} from 'lucide-react';

export type NavigationItem = {
  href: string;
  labelKey: string;
  labelFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  accent: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

export const primaryNavigation: NavigationItem[] = [
  {
    href: '/dashboard',
    labelKey: 'sidebar.nav.dashboard',
    labelFallback: 'Dashboard',
    descriptionKey: 'nav.dashboardDescription',
    descriptionFallback:
      'Monitor revenue, stock pressure, and fulfillment momentum from one glance.',
    accent: '#06b6d4',
    icon: LayoutDashboard,
  },
  {
    href: '/sales',
    labelKey: 'sidebar.nav.sales',
    labelFallback: 'Sales',
    descriptionKey: 'nav.salesDescription',
    descriptionFallback:
      'Track the live ledger, channel mix, and fulfillment queue without losing context.',
    accent: '#10b981',
    icon: ShoppingCart,
    match: (pathname) =>
      pathname === '/sales' ||
      (pathname.startsWith('/sales/') && !pathname.startsWith('/sales/new')),
  },
  {
    href: '/products',
    labelKey: 'sidebar.nav.products',
    labelFallback: 'Products',
    descriptionKey: 'nav.productsDescription',
    descriptionFallback:
      'Review catalog health, low-stock risk, and fulfillment readiness in one surface.',
    accent: '#8b5cf6',
    icon: Boxes,
  },
  {
    href: '/expenses',
    labelKey: 'sidebar.nav.expenses',
    labelFallback: 'Expenses',
    descriptionKey: 'nav.expensesDescription',
    descriptionFallback:
      'Keep operating costs visible before they erode margin or cash velocity.',
    accent: '#f43f5e',
    icon: Receipt,
  },
  {
    href: '/agents',
    labelKey: 'sidebar.nav.agents',
    labelFallback: 'Agents',
    descriptionKey: 'nav.agentsDescription',
    descriptionFallback:
      'Manage partner nodes, contacts, and lead-time coverage for on-demand fulfillment.',
    accent: '#f97316',
    icon: Users,
  },
  {
    href: '/reports',
    labelKey: 'sidebar.nav.reports',
    labelFallback: 'Reports',
    descriptionKey: 'nav.reportsDescription',
    descriptionFallback:
      'Generate export-ready reporting snapshots for revenue, margin, and inventory value.',
    accent: '#3b82f6',
    icon: FileText,
  },
  {
    href: '/audit-logs',
    labelKey: 'sidebar.nav.audit',
    labelFallback: 'Audit Logs',
    descriptionKey: 'nav.auditDescription',
    descriptionFallback:
      'Inspect operational change history and trace critical actions with less guesswork.',
    accent: '#64748b',
    icon: ScrollText,
  },
  {
    href: '/settings',
    labelKey: 'sidebar.nav.settings',
    labelFallback: 'Settings',
    descriptionKey: 'nav.settingsDescription',
    descriptionFallback:
      'Adjust system defaults, exports, and workspace preferences without leaving the shell.',
    accent: '#71717a',
    icon: Settings2,
  },
];

export const mobileDockNavigation: NavigationItem[] = [
  primaryNavigation[0],
  primaryNavigation[1],
  {
    href: '/sales/new',
    labelKey: 'dock.addSr',
    labelFallback: 'New Order',
    descriptionKey: 'nav.newOrderDescription',
    descriptionFallback:
      'Launch the fast capture flow for a fresh order from anywhere.',
    accent: '#dbec0a',
    icon: FilePlus2,
    match: (pathname) => pathname === '/sales/new',
  },
  primaryNavigation[2],
  primaryNavigation[7],
];

export function isNavigationItemActive(
  pathname: string | null | undefined,
  item: NavigationItem,
) {
  if (!pathname) {
    return false;
  }

  if (item.match) {
    return item.match(pathname);
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findActiveNavigationItem(
  pathname: string | null | undefined,
  items: NavigationItem[] = primaryNavigation,
) {
  return items.find((item) => isNavigationItemActive(pathname, item));
}
