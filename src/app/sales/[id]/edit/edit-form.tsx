'use client';

import { useState, useTransition, useMemo } from 'react';
import { useTranslations } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getImgBBThumbnail } from '@/lib/imgbb';
import { toast } from '@/lib/toast';
import {
  addOrderLine,
  updateOrderLine,
  removeOrderLine,
  addOrderExpense,
  removeOrderExpense,
  updateOrderTotals,
  updateOrderHeader,
} from '../edit-actions';
import { Trash2, Plus, Save, X, DollarSign, Package, TrendingUp } from 'lucide-react';

type OrderExpenseCategory =
  | 'SHAKER'
  | 'PACKAGING'
  | 'HANDLING'
  | 'GIFT_WRAP'
  | 'RUSH_FEE'
  | 'MISC';

type ShippingMeta = {
  contactNumber?: string;
  address?: string;
  deliveryFee?: number;
  notes?: string;
};

type Product = {
  id: string;
  name: string;
  flavor: string | null;
  size: string | null;
  cost: number;
  price: number | null;
  images: string | null;
  quantity: number;
  isBundle: boolean;
};

type OrderLine = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  cogs: number | null;
  product: Product;
};

type OrderExpense = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
};

type Sale = {
  id: string;
  orderNo: string;
  status: string;
  fulfillmentMode: string;
  subtotal: number;
  total: number;
  customCostOverride: number | null;
  customProfitOverride: number | null;
  shippingAddress: unknown;
  customer: {
    name: string;
    phone: string;
    addressLine1: string | null;
  };
  lines: OrderLine[];
  orderExpenses: OrderExpense[];
};

type Props = {
  sale: Sale;
  products: Product[];
};



export function EditOrderForm({ sale, products }: Props) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const EXPENSE_CATEGORIES = useMemo(() => [
    { value: 'SHAKER', label: t('editOrder.expenses.categories.shaker', 'Shaker') },
    { value: 'PACKAGING', label: t('editOrder.expenses.categories.packaging', 'Packaging') },
    { value: 'HANDLING', label: t('editOrder.expenses.categories.handling', 'Handling') },
    { value: 'GIFT_WRAP', label: t('editOrder.expenses.categories.giftWrap', 'Gift Wrap') },
    { value: 'RUSH_FEE', label: t('editOrder.expenses.categories.rushFee', 'Rush Fee') },
    { value: 'MISC', label: t('editOrder.expenses.categories.misc', 'Miscellaneous') },
  ], [t]);
  const [activeTab, setActiveTab] = useState<'lines' | 'expenses' | 'overrides' | 'customer'>(
    'lines'
  );

  // Line editing state
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [lineQuantity, setLineQuantity] = useState<Record<string, number>>({});
  const [linePrice, setLinePrice] = useState<Record<string, number>>({});
  const [lineCost, setLineCost] = useState<Record<string, number>>({});

  // New line state
  const [newProductId, setNewProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  // Expense state
  const [newExpenseCategory, setNewExpenseCategory] = useState('SHAKER');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState(0);

  // Override state
  const [customCost, setCustomCost] = useState<number | null>(sale.customCostOverride);
  const [customProfit, setCustomProfit] = useState<number | null>(sale.customProfitOverride);

  // Customer state
  const shipping = toShippingMeta(sale.shippingAddress);
  const [customerName, setCustomerName] = useState(sale.customer.name);
  const [contactNumber, setContactNumber] = useState(shipping.contactNumber ?? sale.customer.phone);
  const [address, setAddress] = useState(shipping.address ?? sale.customer.addressLine1 ?? '');
  const [deliveryFee, setDeliveryFee] = useState(shipping.deliveryFee ?? 0);
  const [notes, setNotes] = useState(shipping.notes ?? '');

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name}${p.flavor ? ` - ${p.flavor}` : ''}${p.size ? ` - ${p.size}` : ''}${
      p.isBundle ? ' 📦' : ''
    }`,
    cost: p.cost,
    price: p.price,
    imageUrl: p.images,
    quantity: p.quantity,
  }));

  // Calculations
  const totalCogs = sale.lines.reduce((sum, line) => sum + (line.cogs ?? 0), 0);
  const totalExpenses = sale.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const revenue = sale.subtotal;
  const actualCost = customCost ?? totalCogs;
  const actualProfit = customProfit ?? (revenue - actualCost - totalExpenses);
  const marginPercent = revenue > 0 ? (actualProfit / revenue) * 100 : 0;

  const handleAddLine = async () => {
    if (!newProductId || newQuantity <= 0 || newPrice <= 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Select a product with a valid quantity and unit price.',
      });
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading(
        t('editOrder.lines.addToOrder', 'Add to Order'),
        { description: 'Adding product to the order.' },
      );

      try {
        await addOrderLine({
          saleOrderId: sale.id,
          productId: newProductId,
          quantity: newQuantity,
          unitPrice: newPrice,
        });
        setNewProductId('');
        setNewQuantity(1);
        setNewPrice(0);
        toast.success(t('editOrder.lines.addToOrder', 'Add to Order'), {
          id: toastId,
          description: 'Order line added successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to add line.'),
        });
      }
    });
  };

  const handleUpdateLine = async (lineId: string) => {
    const qty = lineQuantity[lineId];
    const price = linePrice[lineId];
    const cost = lineCost[lineId];

    if (qty !== undefined && qty <= 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Quantity must be greater than zero.',
      });
      return;
    }

    if (price !== undefined && price <= 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Unit price must be greater than zero.',
      });
      return;
    }

    if (cost !== undefined && cost < 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Custom cost cannot be negative.',
      });
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading(t('common.buttons.save', 'Save'), {
        description: 'Updating order line.',
      });

      try {
        await updateOrderLine({
          lineId,
          ...(qty !== undefined && { quantity: qty }),
          ...(price !== undefined && { unitPrice: price }),
          ...(cost !== undefined && { customCost: cost }),
        });
        setEditingLineId(null);
        toast.success(t('common.buttons.save', 'Save'), {
          id: toastId,
          description: 'Order line updated successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to update line.'),
        });
      }
    });
  };

  const handleRemoveLine = async (lineId: string) => {
    if (!confirm('Remove this item from the order?')) return;

    startTransition(async () => {
      const toastId = toast.loading(t('editOrder.lines.title', 'Current Items'), {
        description: 'Removing order line.',
      });

      try {
        await removeOrderLine({ lineId });
        toast.success(t('editOrder.lines.title', 'Current Items'), {
          id: toastId,
          description: 'Order line removed successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to remove line.'),
        });
      }
    });
  };

  const handleAddExpense = async () => {
    if (newExpenseAmount <= 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Enter a valid expense amount before saving.',
      });
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading(
        t('editOrder.expenses.addButton', 'Add Expense'),
        { description: 'Saving order expense.' },
      );

      try {
        await addOrderExpense({
          saleOrderId: sale.id,
          category: newExpenseCategory as OrderExpenseCategory,
          description: newExpenseDescription || undefined,
          amount: newExpenseAmount,
        });
        setNewExpenseDescription('');
        setNewExpenseAmount(0);
        toast.success(t('editOrder.expenses.addButton', 'Add Expense'), {
          id: toastId,
          description: 'Order expense added successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to add expense.'),
        });
      }
    });
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!confirm('Remove this expense?')) return;

    startTransition(async () => {
      const toastId = toast.loading(t('editOrder.expenses.title', 'Order Expenses'), {
        description: 'Removing expense entry.',
      });

      try {
        await removeOrderExpense({ expenseId });
        toast.success(t('editOrder.expenses.title', 'Order Expenses'), {
          id: toastId,
          description: 'Expense removed successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to remove expense.'),
        });
      }
    });
  };

  const handleSaveOverrides = async () => {
    if (customCost !== null && customCost < 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Custom total cost cannot be negative.',
      });
      return;
    }

    if (customProfit !== null && customProfit < 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Custom profit cannot be negative.',
      });
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading(
        t('editOrder.overrides.saveButton', 'Save Overrides'),
        { description: 'Updating order overrides.' },
      );

      try {
        await updateOrderTotals({
          saleOrderId: sale.id,
          customCostOverride: customCost,
          customProfitOverride: customProfit,
        });
        toast.success(t('editOrder.overrides.saveButton', 'Save Overrides'), {
          id: toastId,
          description: 'Overrides saved successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(error, 'Failed to save overrides.'),
        });
      }
    });
  };

  const handleSaveCustomer = async () => {
    const trimmedName = customerName.trim();
    const trimmedContact = contactNumber.trim();

    if (!trimmedName) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Customer name is required.',
      });
      return;
    }

    if (trimmedContact.length < 4) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Contact number must be at least 4 characters.',
      });
      return;
    }

    if (deliveryFee < 0) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Delivery fee cannot be negative.',
      });
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading(
        t('editOrder.customer.saveButton', 'Save Customer Info'),
        { description: 'Updating customer details.' },
      );

      try {
        await updateOrderHeader({
          saleOrderId: sale.id,
          customerName: trimmedName,
          contactNumber: trimmedContact,
          address,
          deliveryFee,
          notes,
        });
        toast.success(t('editOrder.customer.saveButton', 'Save Customer Info'), {
          id: toastId,
          description: 'Customer information updated successfully.',
        });
        router.refresh();
      } catch (error) {
        toast.error(t('common.error', 'Something went wrong'), {
          id: toastId,
          description: getActionErrorMessage(
            error,
            'Failed to update customer information.',
          ),
        });
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Link href="/sales" className="transition-colors hover:text-foreground">
              {t('editOrder.header.tradingFloor', 'Trading Floor')}
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={`/sales/${sale.id}`}
              className="transition-colors hover:text-foreground"
            >
              ORD-{sale.orderNo}
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-primary">{t('editOrder.header.edit', 'Edit')}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-4xl">{t('editOrder.header.title', 'Edit Order')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('editOrder.header.subtitle', 'Modify line items, add expenses, or override calculations')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/sales/${sale.id}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-white/20 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            {t('common.buttons.cancel', 'Cancel')}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="flex overflow-x-auto border-b border-white/5">
          <button
            onClick={() => setActiveTab('lines')}
            className={cn(
              'whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all',
              activeTab === 'lines'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="mb-1 inline-block h-4 w-4" /> {t('editOrder.tabs.lines', 'Line Items')}
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              'whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all',
              activeTab === 'expenses'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <DollarSign className="mb-1 inline-block h-4 w-4" /> {t('editOrder.tabs.expenses', 'Expenses')}
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={cn(
              'whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all',
              activeTab === 'overrides'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingUp className="mb-1 inline-block h-4 w-4" /> {t('editOrder.tabs.overrides', 'Overrides')}
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={cn(
              'whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all',
              activeTab === 'customer'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('editOrder.tabs.customer', 'Customer Info')}
          </button>
        </div>

        <div className="p-5 sm:p-8">
          {/* LINE ITEMS TAB */}
          {activeTab === 'lines' && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t('editOrder.lines.title', 'Current Items')}
                </h2>
                <div className="space-y-3">
                  {sale.lines.map((line) => {
                    const isEditing = editingLineId === line.id;
                    const qty = lineQuantity[line.id] ?? line.quantity;
                    const price = linePrice[line.id] ?? line.unitPrice;
                    const cost = lineCost[line.id];
                    const imageUrl = line.product.images
                      ? getImgBBThumbnail(line.product.images)
                      : null;

                    return (
                      <div
                        key={line.id}
                        className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10 sm:flex-row sm:items-center"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          {imageUrl ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                              <Image
                                src={imageUrl}
                                alt={line.product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg">
                              📦
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {line.product.name}
                              {line.product.flavor && ` - ${line.product.flavor}`}
                            </p>
                            {!isEditing && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-mono text-foreground">{line.quantity}</span> ×
                                JOD {line.unitPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">{t('editOrder.lines.qty', 'Qty:')}</label>
                              <Input
                                type="number"
                                value={qty}
                                onChange={(e) =>
                                  setLineQuantity({
                                    ...lineQuantity,
                                    [line.id]: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20"
                                min="1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">{t('editOrder.lines.price', 'Price:')}</label>
                              <Input
                                type="number"
                                value={price}
                                onChange={(e) =>
                                  setLinePrice({
                                    ...linePrice,
                                    [line.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-24"
                                step="0.01"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">{t('editOrder.lines.cost', 'Cost:')}</label>
                              <Input
                                type="number"
                                value={cost ?? ''}
                                onChange={(e) =>
                                  setLineCost({
                                    ...lineCost,
                                    [line.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder={t('editOrder.lines.autoPlaceholder', 'Auto')}
                                className="w-24"
                                step="0.01"
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateLine(line.id)}
                              disabled={isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLineId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-bold text-foreground">
                              JOD {line.lineTotal.toFixed(2)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLineId(line.id);
                                setLineQuantity({ ...lineQuantity, [line.id]: line.quantity });
                                setLinePrice({ ...linePrice, [line.id]: line.unitPrice });
                              }}
                              disabled={isPending}
                            >
                              {t('common.buttons.edit', 'Edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveLine(line.id)}
                              disabled={isPending || sale.lines.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add new line */}
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
                  {t('editOrder.lines.addProduct', 'Add Product')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.lines.productLabel', 'Product')}</label>
                    <Combobox
                      options={productOptions}
                      value={newProductId}
                      onChange={(value) => {
                        setNewProductId(value);
                        const product = products.find((p) => p.id === value);
                        if (product) {
                          setNewPrice(product.price ?? product.cost * 1.5);
                        }
                      }}
                      placeholder={t('editOrder.lines.selectProduct', 'Select product...')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.lines.quantityLabel', 'Quantity')}</label>
                    <Input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.lines.unitPriceLabel', 'Unit Price')}</label>
                    <Input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                </div>
                <Button
                  className="mt-3"
                  onClick={handleAddLine}
                  disabled={isPending || !newProductId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('editOrder.lines.addToOrder', 'Add to Order')}
                </Button>
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t('editOrder.expenses.title', 'Order Expenses')}
                </h2>
                <div className="space-y-2">
                  {sale.orderExpenses.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {t('editOrder.expenses.empty', 'No expenses added yet')}
                    </p>
                  ) : (
                    sale.orderExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label}
                          </p>
                          {expense.description && (
                            <p className="text-xs text-muted-foreground">{expense.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-sm font-bold text-foreground">
                            JOD {expense.amount.toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveExpense(expense.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add expense */}
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
                  {t('editOrder.expenses.addTitle', 'Add Expense')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.expenses.categoryLabel', 'Category')}</label>
                    <select
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground backdrop-blur-md transition-colors focus:border-primary/50 focus:bg-white/10"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value} className="bg-zinc-900">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.expenses.amountLabel', 'Amount (JOD)')}</label>
                    <Input
                      type="number"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.expenses.descriptionLabel', 'Description (Optional)')}
                    </label>
                    <Input
                      type="text"
                      value={newExpenseDescription}
                      onChange={(e) => setNewExpenseDescription(e.target.value)}
                      placeholder={t('editOrder.expenses.descriptionPlaceholder', 'e.g., Free shaker')}
                    />
                  </div>
                </div>
                <Button className="mt-3" onClick={handleAddExpense} disabled={isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('editOrder.expenses.addButton', 'Add Expense')}
                </Button>
              </div>
            </div>
          )}

          {/* OVERRIDES TAB */}
          {activeTab === 'overrides' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-white/5 p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t('editOrder.overrides.summaryTitle', 'Financial Summary')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('editOrder.overrides.revenueLabel', 'Revenue (Subtotal)')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      JOD {revenue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('editOrder.overrides.cogsLabel', 'Calculated COGS')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      JOD {totalCogs.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('editOrder.overrides.expensesLabel', 'Order Expenses')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      JOD {totalExpenses.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('editOrder.overrides.profitLabel', 'Net Profit')}</p>
                    <p className="text-holographic text-2xl font-bold">
                      JOD {actualProfit.toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-400">{marginPercent.toFixed(1)}{t('editOrder.overrides.marginSuffix', '% margin')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-yellow-500/30 bg-yellow-500/5 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-500">
                  {t('editOrder.overrides.manualTitle', 'Manual Overrides')}
                </h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  {t('editOrder.overrides.manualDesc', 'Override automatic calculations for special cases. Leave empty to use calculated values.')}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.overrides.customCostLabel', 'Custom Total Cost (JOD)')}
                    </label>
                    <Input
                      type="number"
                      value={customCost ?? ''}
                      onChange={(e) =>
                        setCustomCost(e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder={`Auto: ${totalCogs.toFixed(2)}`}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.overrides.customProfitLabel', 'Custom Profit (JOD)')}
                    </label>
                    <Input
                      type="number"
                      value={customProfit ?? ''}
                      onChange={(e) =>
                        setCustomProfit(e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder={`Auto: ${(revenue - totalCogs - totalExpenses).toFixed(2)}`}
                      step="0.01"
                    />
                  </div>
                </div>
                <Button className="mt-3" onClick={handleSaveOverrides} disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('editOrder.overrides.saveButton', 'Save Overrides')}
                </Button>
              </div>
            </div>
          )}

          {/* CUSTOMER TAB */}
          {activeTab === 'customer' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-white/5 p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t('editOrder.customer.title', 'Customer Information')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.customer.nameLabel', 'Customer Name')}
                    </label>
                    <Input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.customer.contactLabel', 'Contact Number')}
                    </label>
                    <Input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.customer.addressLabel', 'Address')}</label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('editOrder.customer.feeLabel', 'Delivery Fee (JOD)')}
                    </label>
                    <Input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">{t('editOrder.customer.notesLabel', 'Notes')}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground backdrop-blur-md transition-colors focus:border-primary/50 focus:bg-white/10"
                      rows={3}
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={handleSaveCustomer} disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('editOrder.customer.saveButton', 'Save Customer Info')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-panel sticky bottom-6 rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('editOrder.summary.totalLabel', 'Order Total')}
            </p>
            <p className="text-holographic text-3xl font-bold">JOD {sale.total.toFixed(2)}</p>
            <p className="mt-1 text-xs text-emerald-400">
              {marginPercent.toFixed(1)}{t('editOrder.summary.margin', '% profit margin')} • JOD {actualProfit.toFixed(2)} {t('editOrder.summary.profit', 'profit')}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              {sale.lines.length} {sale.lines.length !== 1 ? t('editOrder.summary.items', 'items') : t('editOrder.summary.item', 'item')}
            </p>
            <p>
              {sale.orderExpenses.length} {sale.orderExpenses.length !== 1 ? t('editOrder.summary.expenses', 'expenses') : t('editOrder.summary.expense', 'expense')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toShippingMeta(value: unknown): ShippingMeta {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const shipping = value as Record<string, unknown>;

  return {
    contactNumber:
      typeof shipping.contactNumber === 'string'
        ? shipping.contactNumber
        : undefined,
    address: typeof shipping.address === 'string' ? shipping.address : undefined,
    deliveryFee:
      typeof shipping.deliveryFee === 'number' ? shipping.deliveryFee : undefined,
    notes: typeof shipping.notes === 'string' ? shipping.notes : undefined,
  };
}
