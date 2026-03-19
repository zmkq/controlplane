'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface InventoryDistributionProps {
  data: { name: string; value: number }[];
  className?: string;
}

const COLORS = [
  '#10b981',  // Healthy (Emerald-500)
  '#f59e0b',  // Low Stock (Amber-500)
  '#ef4444'   // Critical (Red-500)
];

export function InventoryDistribution({ data, className }: InventoryDistributionProps) {
  const { t } = useTranslations();

  // Mock data segmentation logic if real data isn't categorized this way
  // Or assuming 'data' comes in as [{name: 'Healthy', value: 80}, {name: 'Low', value: 15}, {name: 'Out', value: 5}]
  
  return (
    <div className={cn('h-full w-full flex flex-col', className)}>
      <div className="mb-4 flex items-center gap-2 px-2">
         <div className="rounded-full bg-primary/10 p-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
         </div>
         <div>
            <h3 className="text-sm font-semibold text-foreground">
               {t('dashboard.inventory.title', 'Inventory Health')}
            </h3>
         </div>
      </div>

      <div className="relative flex-1 h-full min-h-[300px] sm:min-h-[160px] select-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-xs backdrop-blur">
                        <span className="font-medium text-white">{data.name}</span>
                        <span className="ml-2 text-white/60">{data.value} items</span>
                      </div>
                    );
                  }
                  return null;
               }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="relative flex flex-col items-center justify-center">
              {/* Decorative Ring */}
              <div className="absolute inset-0 -m-8 rounded-full border border-primary/10 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 -m-8 rounded-full border border-t-primary/30 rotate-45" />
              
              <span className="block text-3xl font-bold text-foreground text-holographic">
                 {data.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Total</span>
           </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
         {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
               <span>{item.name}</span>
            </div>
         ))}
      </div>
    </div>
  );
}
