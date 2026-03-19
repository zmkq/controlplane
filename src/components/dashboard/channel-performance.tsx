'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Facebook, Instagram, Phone, Globe, MessageCircle, Store, Zap } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ChannelPerformanceProps {
  data: { name: string; value: number; revenue: number }[];
  className?: string;
}

const BRAND_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  whatsapp: '#25D366',
  tiktok: '#000000', // tiktok black usually needs white background, maybe use pink/blue accent? Let's use #FE2C55
  snapchat: '#FFFC00',
  offline: '#8338ec', // Vibrant Purple
  store: '#8338ec',
  website: '#dbec0a',
  other: '#A0A0A0'
};

const getColor = (name: string) => {
  const n = name.toLowerCase();
  for (const key of Object.keys(BRAND_COLORS)) {
    if (n.includes(key)) return BRAND_COLORS[key];
  }
  return BRAND_COLORS.other;
};

const getIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('facebook')) return <Facebook size={16} fill="currentColor" strokeWidth={0} />;
  if (n.includes('insta')) return <Instagram size={16} />;
  if (n.includes('whats') || n.includes('phone')) return <MessageCircle size={16} />;
  if (n.includes('offline') || n.includes('store')) return <Store size={16} />;
  if (n.includes('tiktok')) return <Zap size={16} />;
  return <Globe size={16} />;
};

export function ChannelPerformance({ data, className }: ChannelPerformanceProps) {
  const { t } = useTranslations();
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={cn('h-full w-full flex flex-col relative overflow-hidden', className)}>
       {/* Ambient Glow */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="mb-4 flex items-center gap-2 px-2 relative z-10">
         <div className="rounded-full bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-md">
            <Globe className="h-4 w-4 text-indigo-400" />
         </div>
         <div>
            <h3 className="text-sm font-semibold text-foreground">
               {t('dashboard.channels.title', 'Sales Channels')}
            </h3>
         </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 relative z-10">
        {/* Donut Chart */}
        <div className="relative h-[180px] w-[180px] flex-shrink-0 group">
          <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]" />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.name)}
                    className="stroke-transparent outline-none transition-all duration-300 hover:opacity-80"
                    style={{ filter: `drop-shadow(0 0 8px ${getColor(entry.name)}40)` }}
                  />
                ))}
              </Pie>
              <Tooltip 
                 content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const color = getColor(d.name);
                      return (
                        <div className="glass-panel rounded-xl p-3 text-xs border-l-4" style={{ borderLeftColor: color }}>
                          <span className="font-bold text-white capitalize text-base">{d.name}</span>
                          <div className="mt-1 space-y-0.5">
                             <p className="text-white/80">{d.value} orders</p>
                             <p className="font-mono text-emerald-400">JOD {d.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                 }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Brand */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{sortedData.reduce((a, b) => a + b.value, 0)}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Orders</span>
             </div>
          </div>
        </div>

        {/* Legend / List */}
        <div className="flex-1 w-full space-y-3 pr-1 overflow-y-auto max-h-[200px] scrollbar-hide">
           {sortedData.map((item, i) => {
              const color = getColor(item.name);
              return (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.05] hover:border-white/10 hover:shadow-lg hover:scale-[1.02]"
                >
                   <div className="flex items-center gap-3">
                      <div 
                        className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] transition-transform group-hover:rotate-6"
                        style={{ backgroundColor: `${color}20`, color: color }}
                      >
                         {getIcon(item.name)}
                      </div>
                      <div>
                         <p className="font-semibold text-sm text-foreground capitalize group-hover:text-white transition-colors">
                           {item.name}
                         </p>
                         <div className="flex items-center gap-2">
                            <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                               <div className="h-full rounded-full" style={{ width: `${(item.value / sortedData[0].value) * 100}%`, backgroundColor: color }} />
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block font-bold text-sm text-white">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground">
                          {((item.value / sortedData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%
                      </span>
                   </div>
                </motion.div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
