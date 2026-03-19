'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Calendar,
  Settings,
  Printer,
  Search,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslations } from '@/lib/i18n';

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  avgCost: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  lots: Array<{
    quantity: number;
    cost: number;
    value: number;
    date: Date;
  }>;
};

type SaleItem = {
  id: string;
  orderNo: string;
  date: Date;
  customerName: string;
  channel: string;
  revenue: number;
  cogs: number;
  orderExpenses: number;
  deliveryFee: number;
  profit: number;
  margin: number;
  items: Array<{
    product: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    cogs: number;
    profit: number;
    image: string | null;
  }>;
};
type ExpenseItem = {
  id: string;
  category: string;
  amount: number;
  date: Date;
  notes: string | null;
};

type ReportsClientProps = {
  inventoryData: InventoryItem[];
  salesData: SaleItem[];
  expensesData: ExpenseItem[];
};

export function ReportsClient({
  inventoryData,
  salesData,
  expensesData,
}: ReportsClientProps) {
  const { t, lang } = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState('all');
  const [includeInventory, setIncludeInventory] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Custom date range state
  // Custom date range state
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [inventoryDateFrom, setInventoryDateFrom] = useState('');

  // Manual Report State
  const [reportMode, setReportMode] = useState<'auto' | 'manual'>('auto');
  const [manualItems, setManualItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = inventoryData
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase().includes(query.toLowerCase())),
      )
      .slice(0, 5);

    setSearchResults(results);
  };

  const addToManualReport = (item: InventoryItem) => {
    if (!manualItems.find((i) => i.id === item.id)) {
      setManualItems([...manualItems, { ...item }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromManualReport = (id: string) => {
    setManualItems(manualItems.filter((item) => item.id !== id));
  };

  const updateManualItem = (
    id: string,
    field: 'quantity' | 'avgCost',
    value: number,
  ) => {
    setManualItems(
      manualItems.map((item) => {
        if (item.id === id) {
          const updates = { [field]: value };
          const newQuantity = field === 'quantity' ? value : item.quantity;
          const newCost = field === 'avgCost' ? value : item.avgCost;
          return {
            ...item,
            ...updates,
            totalValue: newQuantity * newCost,
          };
        }
        return item;
      }),
    );
  };

  const periodOptions = [
    { value: 'week', label: t('reports.periods.week', 'Last Week') },
    { value: 'month', label: t('reports.periods.month', 'Last Month') },
    { value: 'year', label: t('reports.periods.year', 'Last Year') },
    { value: 'all', label: t('reports.periods.all', 'All Time') },
    { value: 'custom', label: t('reports.periods.custom', 'Custom Range') },
  ];

  const filterByPeriod = (items: Array<{ date: string | Date }>) => {
    // If custom dates are set, use them
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      return items.filter((item) => {
        const itemDate = new Date(item.date);
        if (fromDate && toDate) {
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (fromDate) {
          return itemDate >= fromDate;
        } else if (toDate) {
          return itemDate <= toDate;
        }
        return true;
      });
    }

    if (period === 'all') return items;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return items;
    }

    // Set start date to beginning of that day
    startDate.setHours(0, 0, 0, 0);
    return items.filter((item) => new Date(item.date) >= startDate);
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === 'custom') {
      setShowCustomDates(true);
      setPeriod(newPeriod);
    } else {
      setShowCustomDates(false);
      setDateFrom('');
      setDateTo('');
      setPeriod(newPeriod);
    }
  };

  const handleApplyCustomDates = () => {
    // Custom dates are already set, just close the inputs
    // The filtering will happen automatically via filterByPeriod
  };

  const handleClearCustomDates = () => {
    setDateFrom('');
    setDateTo('');
    setShowCustomDates(false);
    setPeriod('all');
  };

  const filteredSales = filterByPeriod(salesData) as SaleItem[];
  const filteredExpenses = (
    includeExpenses ? filterByPeriod(expensesData) : []
  ) as ExpenseItem[];

  const filteredInventory =
    reportMode === 'auto'
      ? inventoryData.filter((item) => {
          if (!inventoryDateFrom) return true;
          const filterDate = new Date(inventoryDateFrom);
          // Check if product was created after date OR has stock added after date OR was updated after date
          const isNewProduct = new Date(item.createdAt) >= filterDate;
          const hasNewStock = item.lots.some(
            (lot) => new Date(lot.date) >= filterDate,
          );
          const isRecentlyUpdated = new Date(item.updatedAt) >= filterDate;

          return isNewProduct || hasNewStock || isRecentlyUpdated;
        })
      : manualItems;

  const totalInventoryValue = filteredInventory.reduce(
    (sum, item) => sum + item.totalValue,
    0,
  );
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + sale.revenue,
    0,
  );
  const totalGeneralExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  const totalProfit = includeExpenses
    ? filteredSales.reduce((sum, sale) => sum + sale.profit, 0) -
      totalGeneralExpenses
    : filteredSales.reduce((sum, sale) => sum + (sale.revenue - sale.cogs), 0);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#000000', // Dark background
        logging: false,
        windowWidth: 2480, // A4 width at 300 DPI approx
        onclone: (clonedDoc) => {
          // You can manipulate the cloned document here if needed
          // e.g. make sure fonts are loaded
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `business-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(
        `${t('reports.error', 'Failed to generate PDF report')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-3 w-3" />
            {t('reports.backToDashboard', 'Dashboard')}
          </Link>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="text-foreground">PDF</span>{' '}
            <span className="text-premium-gradient">
              {t('reports.pdfReports', 'Reports')}
            </span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground/80">
            {t(
              'reports.pdfSubtitle',
              'Generate comprehensive business reports with inventory valuation and sales analysis',
            )}
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t('reports.configTitle', 'Report Configuration')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('reports.configSubtitle', 'Customize your report settings')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Report Mode Selection */}
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setReportMode('auto')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                reportMode === 'auto'
                  ? 'bg-primary text-black shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t('reports.modeAuto', 'Automatic Filter')}
            </button>
            <button
              onClick={() => setReportMode('manual')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                reportMode === 'manual'
                  ? 'bg-primary text-black shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t('reports.modeManual', 'Manual Builder')}
            </button>
          </div>

          {/* Manual Builder UI */}
          {reportMode === 'manual' && includeInventory && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t(
                    'reports.searchPlaceholder',
                    'Search products to add...',
                  )}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addToManualReport(item)}
                        disabled={!!manualItems.find((i) => i.id === item.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5 disabled:opacity-50">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Items List */}
              {manualItems.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('reports.selectedItems', 'Selected Items')}
                  </p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {manualItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end gap-1">
                            <label className="text-[10px] text-muted-foreground">
                              {t('reports.qty', 'Qty')}
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateManualItem(
                                  item.id,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                              className="w-16 rounded border border-white/10 bg-transparent px-2 py-1 text-right text-xs text-foreground focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <label className="text-[10px] text-muted-foreground">
                              {t('reports.cost', 'Cost')}
                            </label>
                            <input
                              type="number"
                              value={item.avgCost}
                              onChange={(e) =>
                                updateManualItem(
                                  item.id,
                                  'avgCost',
                                  Number(e.target.value),
                                )
                              }
                              className="w-20 rounded border border-white/10 bg-transparent px-2 py-1 text-right text-xs text-foreground focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removeFromManualReport(item.id)}
                            className="ml-2 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white/5 p-4 text-center text-muted-foreground">
                  {t('reports.noItems', 'No items added to manual report.')}
                </div>
              )}
            </div>
          )}

          {/* Period Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <Calendar className="mr-2 inline h-4 w-4" />
              {t('reports.timePeriod', 'Time Period')}
            </label>
            {showCustomDates ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground">
                  {lang === 'ar' ? 'إلى' : 'to'}
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleApplyCustomDates}
                  className="rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/20">
                  {t('common.buttons.apply', 'Apply')}
                </button>
                <button
                  onClick={handleClearCustomDates}
                  className="rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground">
                  {t('common.buttons.clear', 'Clear')}
                </button>
              </div>
            ) : (
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20">
                {periodOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-black">
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Report Sections */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              {t('reports.includeTitle', 'Include in Report')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={(e) => setIncludeInventory(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-foreground">
                  {t('reports.includeInventory', 'Inventory Valuation')}
                </span>
              </label>

              {reportMode === 'auto' && includeInventory && (
                <div className="ml-8">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t(
                      'reports.filterInfo',
                      'Showing products added/updated after:',
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={inventoryDateFrom}
                      onChange={(e) => setInventoryDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {inventoryDateFrom && (
                      <button
                        onClick={() => setInventoryDateFrom('')}
                        className="rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground">
                        {t('common.buttons.clear', 'Clear')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includeSales}
                  onChange={(e) => setIncludeSales(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-foreground">
                  {t('reports.includeSales', 'Sales Analysis')}
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={includeExpenses}
                  onChange={(e) => setIncludeExpenses(e.target.checked)}
                  disabled={!includeSales}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-primary focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <span className="text-sm text-foreground">
                  {t(
                    'reports.includeExpenses',
                    'Include Expenses in Profit Calculation',
                  )}
                  {!includeSales && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t('reports.requiresSales', '(requires sales)')}
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="glass-panel rounded-[1.5rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t('reports.inventoryValue', 'Inventory Value')}
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            JOD {totalInventoryValue.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredInventory.length} {t('reports.products', 'products')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="glass-panel rounded-[1.5rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t('reports.totalRevenue', 'Total Revenue')}
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            JOD {totalRevenue.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredSales.length} {t('reports.orders', 'orders')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="glass-panel rounded-[1.5rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t('reports.netProfit', 'Net Profit')}
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${totalProfit > 0 ? 'text-emerald-400' : 'text-destructive'}`}>
            JOD {totalProfit.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {includeExpenses
              ? t('reports.withExpenses', 'With expenses')
              : t('reports.withoutExpenses', 'Without expenses')}
          </p>
        </motion.div>
      </div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center">
        <motion.button
          onClick={generatePDF}
          disabled={isGenerating || (!includeInventory && !includeSales)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative overflow-hidden rounded-[2rem] bg-primary px-8 py-4 text-lg font-bold text-black transition-all hover:shadow-[0_0_40px_rgba(219,236,10,0.3)] disabled:opacity-50 disabled:hover:scale-100">
          <div className="relative z-10 flex items-center gap-3">
            {isGenerating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                {t('reports.generating', 'Generating PDF...')}
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                {t('reports.generateButton', 'Generate PDF Report')}
              </>
            )}
          </div>
          <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] opacity-0 transition-opacity group-hover:animate-shimmer group-hover:opacity-100" />
        </motion.button>
      </motion.div>

      {/* Hidden Report Template for PDF Generation */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: 'hidden',
        }}>
        <div
          ref={reportRef}
          dir="ltr"
          style={{
            width: '210mm',
            minHeight: '297mm',
            backgroundColor: '#030303', // Deepest black
            color: '#ffffff',
            fontFamily: 'Instrument Sans, system-ui, sans-serif', // Assuming custom font or fallback
            position: 'relative',
            overflow: 'hidden',
          }}>
          {/* Decorative Background Elements */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '600px',
              height: '600px',
              background:
                'radial-gradient(circle at 50% 50%, rgba(219,236,10,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '500px',
              height: '500px',
              background:
                'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.05) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Header Band */}
          <div
            style={{
              padding: '40px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '99px',
                  backgroundColor: 'rgba(219,236,10,0.1)',
                  border: '1px solid rgba(219,236,10,0.2)',
                  color: '#dbec0a',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}>
                {t('reports.confidential', 'Confidential Report')}
              </div>
              <h1
                style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: '#fff',
                  margin: 0,
                  lineHeight: '1',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}>
                DR
                <br />
                <span style={{ color: '#dbec0a' }}>ISO PRO</span>
              </h1>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  marginBottom: '4px',
                  fontSize: '11px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                {t('reports.generatedOn', 'Generated On')}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#fff',
                  marginBottom: '12px',
                }}>
                {new Date().toLocaleDateString(
                  lang === 'ar' ? 'ar-JO' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </div>

              <div
                style={{
                  marginBottom: '4px',
                  fontSize: '11px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                {t('reports.timePeriod', 'Period Scope')}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#dbec0a',
                }}>
                {showCustomDates && (dateFrom || dateTo)
                  ? `${dateFrom || 'Start'} — ${dateTo || 'End'}`
                  : periodOptions.find((p) => p.value === period)?.label}
              </div>
            </div>
          </div>

          <div style={{ padding: '40px' }}>
            {/* Executive Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '48px',
              }}>
              {/* Revenue Card */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}>
                    {t('reports.totalRevenue', 'Total Revenue')}
                  </p>
                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#fff',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                    <span
                      style={{
                        fontSize: '16px',
                        color: '#666',
                        fontWeight: '500',
                        verticalAlign: 'top',
                        marginRight: '4px',
                      }}>
                      JOD
                    </span>
                    {totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '100%',
                    height: '4px',
                    background:
                      'linear-gradient(90deg, #dbec0a 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Profit Card */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}>
                    {t('reports.netProfit', 'Net Profit')}
                  </p>
                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#34d399',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                    <span
                      style={{
                        fontSize: '16px',
                        color: 'rgba(52,211,153,0.5)',
                        fontWeight: '500',
                        verticalAlign: 'top',
                        marginRight: '4px',
                      }}>
                      JOD
                    </span>
                    {totalProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '6px',
                    }}>
                    {t('reports.margin', 'Margin')}:{' '}
                    {totalRevenue > 0
                      ? ((totalProfit / totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '100%',
                    height: '4px',
                    background:
                      'linear-gradient(90deg, #34d399 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Inventory Card */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}>
                    {t('reports.inventoryValue', 'Stock Valuation')}
                  </p>
                  <p
                    style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#fff',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                    <span
                      style={{
                        fontSize: '16px',
                        color: '#666',
                        fontWeight: '500',
                        verticalAlign: 'top',
                        marginRight: '4px',
                      }}>
                      JOD
                    </span>
                    {totalInventoryValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '6px',
                    }}>
                    {filteredInventory.length}{' '}
                    {t('products.metrics.skus', 'Active SKUs')}
                  </p>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '100%',
                    height: '4px',
                    background:
                      'linear-gradient(90deg, #fff 0%, transparent 100%)',
                  }}
                />
              </div>
            </div>

            {/* Inventory Section */}
            {includeInventory && filteredInventory.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <div
                  style={{
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#dbec0a',
                      boxShadow: '0 0 10px rgba(219,236,10,0.5)',
                    }}
                  />
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}>
                    {t('reports.includeInventory', 'Inventory Valuation')}
                  </h2>
                </div>

                <div
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th
                          style={{
                            padding: '16px 20px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.productList', 'Product Details')}
                        </th>
                        <th
                          style={{
                            padding: '16px 20px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.qty', 'Stock Qty')}
                        </th>
                        <th
                          style={{
                            padding: '16px 20px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.cost', 'Avg Cost')}
                        </th>
                        <th
                          style={{
                            padding: '16px 20px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.inventoryValue', 'Total Value')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item, i) => (
                        <tr
                          key={item.id}
                          style={{
                            borderTop: '1px solid rgba(255,255,255,0.03)',
                          }}>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: lang === 'ar' ? 'right' : 'left',
                            }}>
                            <div
                              style={{
                                fontWeight: '600',
                                color: '#fff',
                                fontSize: '13px',
                              }}>
                              {item.name}
                            </div>
                            {item.sku && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#666',
                                  fontFamily: 'monospace',
                                  marginTop: '4px',
                                }}>
                                {item.sku}
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: lang === 'ar' ? 'left' : 'right',
                              color: '#ccc',
                              fontSize: '13px',
                              fontWeight: '500',
                            }}>
                            {item.quantity}
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: lang === 'ar' ? 'left' : 'right',
                              color: '#888',
                              fontSize: '13px',
                            }}>
                            {item.avgCost.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: '16px 20px',
                              textAlign: lang === 'ar' ? 'left' : 'right',
                              color: '#dbec0a',
                              fontSize: '13px',
                              fontWeight: '700',
                            }}>
                            {item.totalValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales Section */}
            {includeSales && filteredSales.length > 0 && (
              <div
                style={{
                  pageBreakBefore:
                    filteredInventory.length > 8 ? 'always' : 'auto',
                }}>
                <div
                  style={{
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#34d399',
                      boxShadow: '0 0 10px rgba(52,211,153,0.5)',
                    }}
                  />
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}>
                    {t('reports.includeSales', 'Sales Performance')}
                  </h2>
                </div>

                <div
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.orders', 'Order ID')}
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.salesDetail', 'Details')}
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                            width: '30%',
                          }}>
                          {t('reports.selectedItems', 'Items')}
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.revenue', 'Revenue')}
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontSize: '10px',
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '700',
                          }}>
                          {t('reports.profit', 'Profit')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale, i) => {
                        const calculatedProfit = includeExpenses
                          ? sale.profit
                          : sale.revenue - sale.cogs;

                        return (
                          <tr
                            key={sale.id}
                            style={{
                              borderTop: '1px solid rgba(255,255,255,0.03)',
                            }}>
                            <td
                              style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div
                                style={{
                                  fontFamily: 'monospace',
                                  color: '#888',
                                  fontSize: '11px',
                                  background: 'rgba(255,255,255,0.05)',
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}>
                                {sale.orderNo}
                              </div>
                            </td>
                            <td
                              style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div
                                style={{
                                  color: '#fff',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  marginBottom: '4px',
                                }}>
                                {sale.customerName}
                              </div>
                              <div style={{ color: '#666', fontSize: '11px' }}>
                                {new Date(sale.date).toLocaleDateString()}
                              </div>
                              {includeExpenses && sale.orderExpenses > 0 && (
                                <div
                                  style={{
                                    color: '#f87171',
                                    fontSize: '10px',
                                    marginTop: '4px',
                                  }}>
                                  - Exp: {sale.orderExpenses.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td
                              style={{ padding: '16px', verticalAlign: 'top' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}>
                                {sale.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                    }}>
                                    {item.image ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={item.image}
                                        alt=""
                                        crossOrigin="anonymous"
                                        style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '6px',
                                          objectFit: 'cover',
                                          background: '#222',
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '6px',
                                          background: '#222',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}>
                                        <div
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#333',
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <div
                                        style={{
                                          fontSize: '12px',
                                          fontWeight: '500',
                                          color: '#ececec',
                                          lineHeight: '1.2',
                                        }}>
                                        {item.product}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '10px',
                                          color: '#888',
                                          marginTop: '1px',
                                        }}>
                                        {item.quantity} x{' '}
                                        {item.price.toFixed(2)}
                                        <span
                                          style={{
                                            margin: '0 6px',
                                            color: '#333',
                                          }}>
                                          |
                                        </span>
                                        <span style={{ color: '#34d399' }}>
                                          +{item.profit.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: '16px',
                                textAlign: 'right',
                                verticalAlign: 'top',
                              }}>
                              <div
                                style={{
                                  color: '#fff',
                                  fontWeight: '600',
                                  fontSize: '13px',
                                }}>
                                {sale.revenue.toFixed(2)}
                              </div>
                              <div
                                style={{
                                  color: '#666',
                                  fontSize: '10px',
                                  marginTop: '2px',
                                }}>
                                {t(
                                  'newSale.fulfillment.deliveryLabel',
                                  'delivery',
                                )}
                                : {sale.deliveryFee.toFixed(2)}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: '16px',
                                textAlign: 'right',
                                verticalAlign: 'top',
                              }}>
                              <div
                                style={{
                                  color:
                                    calculatedProfit > 0
                                      ? '#34d399'
                                      : '#f87171',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                }}>
                                {calculatedProfit.toFixed(2)}
                              </div>
                              <div
                                style={{
                                  color: '#888',
                                  fontSize: '10px',
                                  marginTop: '2px',
                                }}>
                                {(sale.revenue > 0
                                  ? (calculatedProfit / sale.revenue) * 100
                                  : 0
                                ).toFixed(1)}
                                %
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General Expenses Section */}
            {includeExpenses && filteredExpenses.length > 0 && (
              <div style={{ pageBreakBefore: 'auto', marginTop: '40px' }}>
                <div
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                  <span
                    style={{
                      height: '28px',
                      width: '4px',
                      borderRadius: '9999px',
                      backgroundColor: '#f87171',
                    }}
                  />
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      margin: 0,
                    }}>
                    {t('reports.orderExpenses', 'General Expenses')}
                  </h2>
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}>
                  <table
                    style={{
                      width: '100%',
                      fontSize: '11px',
                      borderCollapse: 'collapse',
                    }}>
                    <thead
                      style={{
                        backgroundColor: 'rgba(248,113,113,0.1)',
                        color: '#d1d5db',
                      }}>
                      <tr>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontWeight: '600',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                          {t('expenses.table.date', 'Date')}
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontWeight: '600',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                          {t('expenses.table.category', 'Category')}
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            fontWeight: '600',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                          {t('expenses.table.vendorNotes', 'Notes')}
                        </th>
                        <th
                          style={{
                            padding: '12px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            fontWeight: '600',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                          {t('expenses.table.amount', 'Amount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp, i) => (
                        <tr
                          key={exp.id}
                          style={{
                            backgroundColor:
                              i % 2 === 0
                                ? 'transparent'
                                : 'rgba(255,255,255,0.02)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                          }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: '#9ca3af',
                              textAlign: lang === 'ar' ? 'right' : 'left',
                            }}>
                            {new Date(exp.date).toLocaleDateString(
                              lang === 'ar' ? 'ar-JO' : 'en-US',
                            )}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: '#ffffff',
                              textTransform: 'capitalize',
                              textAlign: lang === 'ar' ? 'right' : 'left',
                            }}>
                            {t(
                              `expenses.categories.${exp.category}`,
                              exp.category.toLowerCase().replace('_', ' '),
                            )}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: '#6b7280',
                              textAlign: lang === 'ar' ? 'right' : 'left',
                            }}>
                            {exp.notes || '-'}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: lang === 'ar' ? 'left' : 'right',
                              fontWeight: '500',
                              color: '#f87171',
                            }}>
                            JOD {exp.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr
                        style={{
                          backgroundColor: 'rgba(248,113,113,0.15)',
                          fontWeight: 'bold',
                          borderTop: '2px solid rgba(248,113,113,0.3)',
                        }}>
                        <td
                          colSpan={3}
                          style={{
                            padding: '14px 12px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            color: '#f87171',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                          {t('expenses.totalExpenses', 'TOTAL EXPENSES')}
                        </td>
                        <td
                          style={{
                            padding: '14px 12px',
                            textAlign: lang === 'ar' ? 'left' : 'right',
                            color: '#f87171',
                            fontSize: '13px',
                          }}>
                          JOD {totalGeneralExpenses.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Stays at bottom of last page mostly, but here relative so flows naturally.
              For fixed footer on every page, PDF generation logic needs to handle it manually (addPage), 
              but standard flow is safer for variable length content. 
          */}
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              marginTop: '40px',
            }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#333',
                }}
              />
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#333',
                }}
              />
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#333',
                }}
              />
            </div>
            <p
              style={{
                fontSize: '10px',
                color: '#444',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}>
              Generated by Cortex Business Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
