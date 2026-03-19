'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Truck, CloudLightning } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LiveActivityFeedProps {
  activities?: {
    id: string;
    type: 'sale' | 'delivery' | 'system';
    message: string;
    time: string;
    amount?: number;
    user?: string;
  }[];
  className?: string;
}

// Mock initial data if none provided to show "Life" in the dash
const MOCK_ACTIVITIES: { id: string; type: 'sale' | 'delivery' | 'system'; message: string; time: string; amount?: number; user?: string }[] = [
  { id: '1', type: 'sale', message: 'New order from Ahmad', time: 'Just now', amount: 45.5, user: 'AH' },
  { id: '2', type: 'delivery', message: 'Order #1234 delivered', time: '2m ago', user: 'DR' },
  { id: '3', type: 'sale', message: 'New order from Sarah', time: '5m ago', amount: 120.0, user: 'SA' },
  { id: '4', type: 'system', message: 'Inventory update synced', time: '10m ago' },
];

export function LiveActivityFeed({ activities = MOCK_ACTIVITIES, className }: LiveActivityFeedProps) {
  const { t } = useTranslations();

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ShoppingBag className="h-3 w-3 text-emerald-400" />;
      case 'delivery': return <Truck className="h-3 w-3 text-blue-400" />;
      default: return <CloudLightning className="h-3 w-3 text-purple-400" />;
    }
  };

  return (
    <div className={cn('h-full w-full flex flex-col', className)}>
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('dashboard.live.title', 'Live Feed')}
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
         <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background/50 to-transparent z-10" />
         
         <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {activities.map((item, i) => (
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id}
                  className="group flex items-center justify-between rounded-xl p-3 text-xs transition-all hover:bg-white/10 border border-transparent hover:border-white/10 hover:shadow-lg hover:scale-[1.02]"
               >
                  <div className="flex items-center gap-3">
                     <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shadow-inner ring-1 ring-inset",
                        item.type === 'sale' ? "bg-emerald-500/10 ring-emerald-500/20" : 
                        item.type === 'delivery' ? "bg-blue-500/10 ring-blue-500/20" : "bg-purple-500/10 ring-purple-500/20"
                     )}>
                        {getIcon(item.type)}
                     </div>
                     <div>
                        <p className="font-medium text-foreground group-hover:text-glow transition-colors">{item.message}</p>
                        <p className="text-[10px] text-muted-foreground">{item.time}</p>
                     </div>
                  </div>
                  {item.amount && (
                     <div className="text-right">
                        <span className="block font-mono font-medium text-emerald-400 text-glow">+JOD {item.amount}</span>
                     </div>
                  )}
               </motion.div>
            ))}
         </div>
         
         <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10" />
      </div>
    </div>
  );
}
