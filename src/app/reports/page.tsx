import { prisma } from '@/lib/prisma';
import { ReportsClient } from '@/components/reports/reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  // Fetch all products with stock (either in lots or direct quantity)
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { quantity: { gt: 0 } }, // Direct quantity
        { 
          inventoryLots: {
            some: { quantity: { gt: 0 } }
          }
        }
      ],
    },
    include: {
      inventoryLots: {
        where: {
          quantity: { gt: 0 },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Calculate inventory valuation
  const inventoryData = products.map(product => {
    // Check if using inventory lots or direct quantity
    const hasLots = product.inventoryLots.length > 0;
    
    if (hasLots) {
      // Use FIFO costing from inventory lots
      const totalQuantity = product.inventoryLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalValue = product.inventoryLots.reduce((sum, lot) => sum + (lot.quantity * lot.cost), 0);
      const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: totalQuantity,
        avgCost,
        totalValue,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        lots: product.inventoryLots.map(lot => ({
          quantity: lot.quantity,
          cost: lot.cost,
          value: lot.quantity * lot.cost,
          date: lot.createdAt,
        })),
      };
    } else {
      // Use direct product quantity and cost
      const totalValue = product.quantity * product.cost;
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        avgCost: product.cost,
        totalValue,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        lots: [],
      };
    }
  }).filter(item => item.quantity > 0); // Only include items with actual stock

  // Fetch all sales with details
  const sales = await prisma.saleOrder.findMany({
    where: {
      status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
    },
    include: {
      customer: {
        select: { name: true },
      },
      lines: {
        include: {
          product: {
            select: { name: true, sku: true, images: true },
          },
        },
      },
      orderExpenses: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Calculate sales data
  const salesData = sales.map(sale => {
    const revenue = sale.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const cogs = sale.lines.reduce((sum, line) => sum + (line.cogs || 0), 0);
    const orderExpenses = sale.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const actualCost = sale.customCostOverride ?? cogs;
    const profit = sale.customProfitOverride ?? (revenue - actualCost - orderExpenses);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Calculate gross profit from lines before expenses/overrides
    const rawGrossProfit = sale.lines.reduce((sum, line) => sum + (line.lineTotal - (line.cogs || 0)), 0);
    
    // Calculate the total adjustment needed (Expenses + Cost Override Diff + Profit Override Diff)
    // adjustment = ActualProfit - Sum(LineRevenue - LineCogs)
    const adjustment = profit - rawGrossProfit;

    // Extract delivery fee from shipping metadata
    const shippingMeta = sale.shippingAddress as any;
    const deliveryFee = shippingMeta?.deliveryFee || 0;

    return {
      id: sale.id,
      orderNo: sale.orderNo,
      date: sale.date,
      customerName: sale.customer?.name || 'N/A',
      channel: sale.channel,
      revenue,
      cogs: actualCost,
      orderExpenses,
      deliveryFee,
      profit,
      margin,
      items: sale.lines.map(line => {
        // Distribute the adjustment proportional to line revenue
        // If revenue is 0, we can't distribute by revenue (edge case), so we fallback to 0 adjustment or count? 
        // Using revenue is standard.
        const weight = revenue > 0 ? (line.lineTotal / revenue) : (1 / sale.lines.length);
        const lineAdjustment = adjustment * weight;
        const lineRawProfit = line.lineTotal - (line.cogs || 0);

        return {
          product: line.product?.name || 'Unknown',
          sku: line.product?.sku || '',
          quantity: line.quantity,
          price: line.unitPrice,
          total: line.lineTotal,
          cogs: line.cogs || 0,
          profit: lineRawProfit + lineAdjustment,
          image: line.product?.images || null,
        };
      }),
    };
  });

  // Fetch all general expenses
  const expenses = await prisma.expense.findMany({
    orderBy: {
      date: 'desc',
    },
  });

  const expensesData = expenses.map(expense => ({
    id: expense.id,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    notes: expense.notes,
  }));

  return (
    <ReportsClient 
      inventoryData={inventoryData}
      salesData={salesData}
      expensesData={expensesData}
    />
  );
}
