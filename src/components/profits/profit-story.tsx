'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Package, Truck, Receipt } from 'lucide-react';

type ProfitStoryProps = {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  data: {
    revenue: number;
    cogs: number;
    expenses: number;
    orderExpenses: number;
    netProfit: number;
    salesCount: number;
    storySales: Array<{
      id: string;
      orderNo: string;
      revenue: number;
      profit: number;
    }>;
  };
};

export function ProfitStory({ isOpen, onClose, period, data }: ProfitStoryProps) {
  const [step, setStep] = useState(0);
  
  // Reset step when opened
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      // Auto-advance steps - Extended durations for "every order" visualization
      const timers = [
        setTimeout(() => setStep(1), 2000), // Intro -> Revenue
        setTimeout(() => setStep(2), 10000), // Revenue -> COGS (8s for orders)
        setTimeout(() => setStep(3), 15000), // COGS -> Expenses
        setTimeout(() => setStep(4), 20000), // Expenses -> Final
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => 
    `JOD ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate stagger delay to fit all orders within ~6 seconds
  const staggerDelay = Math.min(0.1, 6 / Math.max(1, data.storySales.length));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute right-8 top-8 z-50 rounded-full bg-white/10 p-2 text-white/50 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Background Ambient Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -left-1/4 -top-1/4 h-[150vh] w-[150vh] rounded-full bg-primary/5 blur-[100px]"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{ duration: 15, repeat: Infinity, delay: 2 }}
              className="absolute -bottom-1/4 -right-1/4 h-[150vh] w-[150vh] rounded-full bg-emerald-500/5 blur-[100px]"
            />
          </div>

          <div className="relative z-10 w-full max-w-6xl px-6 text-center">
            {/* STEP 0: INTRO */}
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                className="space-y-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-400 shadow-[0_0_50px_rgba(219,236,10,0.3)]"
                >
                  <TrendingUp className="h-12 w-12 text-black" />
                </motion.div>
                <h2 className="text-5xl font-bold text-white">
                  Profit Story
                </h2>
                <p className="text-xl text-gray-400">
                  Analyzing {period === 'all' ? 'All Time' : `Last ${period}`} Performance...
                </p>
              </motion.div>
            )}

            {/* STEP 1: REVENUE */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 text-lg font-medium text-emerald-400"
                  >
                    Step 1: Revenue Generation
                  </motion.p>
                  <motion.h3 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-bold text-white"
                  >
                    {formatCurrency(data.revenue)}
                  </motion.h3>
                  <p className="mt-4 text-gray-400">
                    Generated from <span className="text-white">{data.salesCount}</span> orders
                  </p>
                </div>

                {/* Visualizing Orders */}
                <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="flex flex-wrap content-start justify-center gap-3 overflow-y-auto scrollbar-hide h-full">
                    {data.storySales.map((sale, i) => (
                      <motion.div
                        key={sale.id}
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ 
                          delay: i * staggerDelay,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        <span className="text-emerald-200/70">#{sale.orderNo}</span>
                        <span className="font-bold text-emerald-400">+{formatCurrency(sale.revenue)}</span>
                      </motion.div>
                    ))}
                    {data.salesCount > data.storySales.length && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-gray-400"
                      >
                        <span>+{data.salesCount - data.storySales.length} more...</span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Overlay Gradient to fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                </div>
              </motion.div>
            )}

            {/* STEP 2: COGS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="mb-2 text-lg font-medium text-orange-400">Step 2: Cost of Goods</p>
                  <div className="flex items-center justify-center gap-8">
                    <div className="opacity-50 grayscale">
                      <p className="text-sm text-gray-400">Revenue</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(data.revenue)}</p>
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-4xl font-bold text-orange-500"
                    >
                      - {formatCurrency(data.cogs)}
                    </motion.div>
                  </div>
                  <p className="mt-4 text-gray-400">
                    Product costs and manufacturing
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="rounded-xl bg-white/5 p-6"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                      <Package className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-gray-400">Product Cost</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(data.cogs)}</p>
                  </motion.div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-white/5 p-6"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-gray-400">Gross Profit</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {formatCurrency(data.revenue - data.cogs)}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EXPENSES */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="mb-2 text-lg font-medium text-red-400">Step 3: Expenses & Fees</p>
                  <div className="flex items-center justify-center gap-8">
                    <div className="opacity-50 grayscale">
                      <p className="text-sm text-gray-400">Gross Profit</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(data.revenue - data.cogs)}</p>
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-4xl font-bold text-red-500"
                    >
                      - {formatCurrency(data.expenses + data.orderExpenses)}
                    </motion.div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-48 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center"
                  >
                    <Receipt className="mx-auto mb-2 h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-300">General Expenses</p>
                    <p className="font-bold text-white">{formatCurrency(data.expenses)}</p>
                  </motion.div>
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-48 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center"
                  >
                    <Truck className="mx-auto mb-2 h-6 w-6 text-red-400" />
                    <p className="text-sm text-red-300">Order Expenses</p>
                    <p className="font-bold text-white">{formatCurrency(data.orderExpenses)}</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: FINAL REVEAL */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative">
                  {/* Celebration Burst */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1.2], opacity: [1, 0, 0] }}
                    transition={{ duration: 1 }}
                    className="absolute left-1/2 top-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-emerald-400 blur-[100px]"
                  />
                  
                  <p className="mb-4 text-xl font-medium text-primary">Net Profit</p>
                  <motion.h1 
                    initial={{ scale: 0.5, filter: 'blur(20px)' }}
                    animate={{ scale: 1, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className={`text-8xl font-black ${data.netProfit > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-shimmer bg-[length:200%_100%]' : 'text-red-500'}`}
                  >
                    {formatCurrency(data.netProfit)}
                  </motion.h1>
                </div>

                <div className="grid grid-cols-4 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <div>
                    <p className="text-xs text-gray-400">Revenue</p>
                    <p className="font-bold text-white">{formatCurrency(data.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">COGS</p>
                    <p className="font-bold text-red-400">-{formatCurrency(data.cogs)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Expenses</p>
                    <p className="font-bold text-red-400">-{formatCurrency(data.expenses + data.orderExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Margin</p>
                    <p className="font-bold text-primary">
                      {data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="rounded-full bg-white px-8 py-3 font-bold text-black shadow-lg hover:bg-gray-200"
                >
                  Awesome!
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
