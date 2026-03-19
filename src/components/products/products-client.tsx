'use client';

import type { ProductType } from '@prisma/client';
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  PackageSearch,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  bulkUpdateProducts,
  deleteProductAction,
  upsertProduct,
} from '@/app/products/actions';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { Trans } from '@/components/trans';
import { toast } from 'sonner';

import { z } from 'zod';
import { ImageUpload } from '@/components/ui/image-upload';
import { ProductCard } from './product-card';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { DeviceQRScanner } from './device-qr-scanner';
import { EmptyStatePanel } from '@/components/ui/empty-state-panel';

type Product = {
  id: string;
  sku: string;
  brand: string;
  name: string;
  flavor: string | null;
  size: string | null;
  quantity: number;
  cost: number;
  price?: number;
  active: boolean;
  updatedAt: string | Date;
  fulfillmentMode: 'limited' | 'on-demand';
  images: string | null;
  isBundle?: boolean;
  bundleItems?: { productId: string; quantity: number }[];
  supplierId?: string;
  attributes?: {
    shakerCount?: number;
  };
  type?: ProductType;
};

type EditableProduct = Omit<Product, 'updatedAt' | 'images' | 'attributes'> & {
  fulfillmentMode: 'limited' | 'on-demand';
  imageUrl: string;
  shakerCount?: number;
};

// Client-side validation schema
const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  brand: z.string().trim().min(1, 'Brand is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  flavor: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().int().nonnegative('Quantity must be 0 or more'),
  cost: z.number().nonnegative('Cost must be 0 or more'),
  price: z.number().nonnegative('Price must be 0 or more').optional(),
  active: z.boolean(),
  fulfillmentMode: z.enum(['limited', 'on-demand']),
  isBundle: z.boolean().optional(),
  bundleItems: z
    .array(
      z.object({
        productId: z.string().cuid('Select a valid bundle item'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      }),
    )
    .optional(),
  supplierId: z.string().optional(),
  shakerCount: z.number().optional(),
  type: z.enum([
    'PROTEIN_POWDER',
    'CREATINE',
    'PRE_WORKOUT',
    'AMINO_ACIDS',
    'VITAMINS',
    'ACCESSORIES',
    'OTHER',
  ]).optional(),
});

function validateProductPayload(
  payload: z.infer<typeof productSchema>,
  editingId?: string,
) {
  const result = productSchema.safeParse(payload);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        errors[issue.path[0] as string] = issue.message;
      }
    });
    return errors;
  }

  const errors: Record<string, string> = {};
  const bundleItems = payload.bundleItems ?? [];

  if (payload.isBundle) {
    if (bundleItems.length === 0) {
      errors.bundleItems = 'Add at least one item to this bundle.';
    } else if (
      new Set(bundleItems.map((item) => item.productId)).size !==
      bundleItems.length
    ) {
      errors.bundleItems = 'Bundle items must be unique.';
    } else if (
      editingId &&
      bundleItems.some((item) => item.productId === editingId)
    ) {
      errors.bundleItems = 'A bundle cannot include itself.';
    }
  }

  if (
    !payload.isBundle &&
    payload.fulfillmentMode === 'on-demand' &&
    !payload.supplierId
  ) {
    errors.supplierId = 'Select an agent for on-demand fulfillment.';
  }

  return errors;
}

export function ProductsClient({
  products: initialProducts,
  suppliers,
  currentQuery = '',
  currentType = '',
  currentSupplier = '',
  currentFulfillmentMode = '',
  currentStatus = '',
  currentStock = '',
}: {
  products: Product[];
  suppliers: { id: string; name: string }[];
  currentQuery?: string;
  currentType?: string;
  currentSupplier?: string;
  currentFulfillmentMode?: string;
  currentStatus?: string;
  currentStock?: string;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const [products, setProducts] = useState(initialProducts);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [formState, setFormState] = useState<EditableProduct | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [notificationTesterState, setNotificationTesterState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Sync state with props when pagination changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const limitedThreshold = 5;
  const showNotificationTester = false; // Disabled as client-side search is removed

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'JOD',
        maximumFractionDigits: 2,
      }),
    []
  );

  // Group products by type
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {
      'Special Offers (Bundles)': [],
      'Protein Powder': [],
      'Creatine': [],
      'Pre-Workout': [],
      'Amino Acids': [],
      'Vitamins': [],
      'Accessories': [],
      'Other': [],
    };

    products.forEach((product) => {
      if (product.isBundle) {
        groups['Special Offers (Bundles)'].push(product);
      } else {
        switch (product.type) {
          case 'PROTEIN_POWDER':
            groups['Protein Powder'].push(product);
            break;
          case 'CREATINE':
            groups['Creatine'].push(product);
            break;
          case 'PRE_WORKOUT':
            groups['Pre-Workout'].push(product);
            break;
          case 'AMINO_ACIDS':
            groups['Amino Acids'].push(product);
            break;
          case 'VITAMINS':
            groups['Vitamins'].push(product);
            break;
          case 'ACCESSORIES':
            groups['Accessories'].push(product);
            break;
          default:
            groups['Other'].push(product);
        }
      }
    });

    return groups;
  }, [products]);

  const hasActiveFilters = Boolean(
    currentQuery ||
      currentType ||
      currentSupplier ||
      currentFulfillmentMode ||
      currentStatus ||
      currentStock
  );
  const activeSupplierName =
    suppliers.find((supplier) => supplier.id === currentSupplier)?.name ??
    currentSupplier;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    router.push(query ? `/products?${query}` : '/products');
  };

  const resetFilters = () => {
    router.push('/products');
  };

  const handleBulkAction = async (
    action: 'activate' | 'deactivate' | 'delete',
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedIds.length} products?`,
      )
    ) {
      return;
    }

    const toastId = toast.loading(`Processing bulk ${action}...`);

    try {
      await bulkUpdateProducts({ ids: selectedIds, action });

      if (action === 'delete') {
        setProducts((prev) => prev.filter((product) => !selectedIds.includes(product.id)));
      } else {
        setProducts((prev) =>
          prev.map((product) =>
            selectedIds.includes(product.id)
              ? { ...product, active: action === 'activate' }
              : product,
          ),
        );
      }

      toast.success(`Bulk ${action} complete`, { id: toastId });
      setSelectedIds([]);
      setIsSelectionMode(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : `Failed to perform bulk ${action}`,
        { id: toastId },
      );
    }
  };

  useEffect(() => {
    if (!showNotificationTester) {
      setNotificationTesterState('idle');
      setNotificationMessage(null);
    }
  }, [showNotificationTester]);

  const triggerTestNotification = async () => {
    setNotificationTesterState('loading');
    setNotificationMessage(null);
    const now = new Date();
    const title = `Test ping · ${now.toLocaleTimeString()}`;
    const body = 'Triggered from the Products notification tester.';

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });

      if (!res.ok) {
        throw new Error('Failed to dispatch notification');
      }

      await res.json();
      setNotificationTesterState('success');
      setNotificationMessage(
        'Notification sent to all registered devices! Check the bell icon to confirm delivery.'
      );
    } catch (err) {
      console.error(err);
      setNotificationTesterState('error');
      setNotificationMessage('Could not send notification. Try again.');
    }
  };

  const updateFormField = (
    field: keyof EditableProduct,
    value: EditableProduct[keyof EditableProduct]
  ) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddBundleItem = () => {
    setFieldErrors((prev) => {
      if (!prev.bundleItems) return prev;
      const next = { ...prev };
      delete next.bundleItems;
      return next;
    });
    setFormState(prev => {
      if (!prev) return null;
      const currentItems = prev.bundleItems || [];
      return {
        ...prev,
        bundleItems: [...currentItems, { productId: '', quantity: 1 }]
      };
    });
  };

  const handleRemoveBundleItem = (index: number) => {
    setFieldErrors((prev) => {
      if (!prev.bundleItems) return prev;
      const next = { ...prev };
      delete next.bundleItems;
      return next;
    });
    setFormState(prev => {
      if (!prev) return null;
      const currentItems = prev.bundleItems || [];
      return {
        ...prev,
        bundleItems: currentItems.filter((_, i) => i !== index)
      };
    });
  };

  const handleUpdateBundleItem = (
    index: number,
    field: 'productId' | 'quantity',
    value: string | number,
  ) => {
    setFieldErrors((prev) => {
      if (!prev.bundleItems) return prev;
      const next = { ...prev };
      delete next.bundleItems;
      return next;
    });
    setFormState(prev => {
      if (!prev) return null;
      const currentItems = [...(prev.bundleItems || [])];
      if (currentItems[index]) {
        currentItems[index] = { ...currentItems[index], [field]: value };
      }
      return {
        ...prev,
        bundleItems: currentItems
      };
    });
  };

  const renderForm = () => {
    if (!formState) return null;
    const current = formState;
    const isBundle = current.isBundle;

    return (
      <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 pb-6 custom-scrollbar">
        {/* Offer Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-foreground">Create Offer (Bundle)</label>
            <p className="text-xs text-muted-foreground">Combine multiple products into a single SKU.</p>
          </div>
          <Switch
            checked={isBundle}
            onCheckedChange={(checked: boolean) => {
              updateFormField('isBundle', checked);
              if (checked) {
                updateFormField('fulfillmentMode', 'limited');
                updateFormField('supplierId', undefined);
                updateFormField('quantity', 0);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-0.5">
            <label className="text-sm font-bold text-foreground">Catalog Status</label>
            <p className="text-xs text-muted-foreground">
              Inactive products stay searchable but can be filtered out of active operations.
            </p>
          </div>
          <Switch
            checked={current.active}
            onCheckedChange={(checked: boolean) => updateFormField('active', checked)}
          />
        </div>

        {!isBundle && (
          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Fulfillment Mode
            </p>
            <div className="grid gap-3">
              {(['limited', 'on-demand'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setFormState((prev) =>
                      prev
                        ? {
                            ...prev,
                            fulfillmentMode: mode,
                            supplierId: mode === 'on-demand' ? prev.supplierId : undefined,
                            quantity: mode === 'on-demand' ? 0 : prev.quantity,
                          }
                        : prev
                    )
                  }
                  className={cn(
                    'relative overflow-hidden rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-300 sm:flex sm:items-center sm:justify-between group',
                    current.fulfillmentMode === mode
                      ? 'brand-glow border-transparent text-primary-foreground'
                      : 'border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5 hover:border-white/20'
                  )}>
                  <div className="relative z-10">
                    <p className={cn("font-bold text-base", current.fulfillmentMode === mode ? "text-primary-foreground" : "text-foreground")}>
                      {mode === 'limited'
                        ? 'Limited Stock Run'
                        : 'On-Demand Partner'}
                    </p>
                    <p className={cn("text-xs mt-1", current.fulfillmentMode === mode ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {mode === 'limited'
                        ? 'Use the micro batches already stocked.'
                        : 'Kick to your trusted partner instantly.'}
                    </p>
                  </div>
                  {current.fulfillmentMode === mode && (
                    <div className="relative z-10 mt-3 sm:mt-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Active
                      </span>
                    </div>
                  )}
                  {current.fulfillmentMode === mode && (
                     <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Agent Selection for On-Demand */}
        {!isBundle && current.fulfillmentMode === 'on-demand' && (
          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Fulfillment Agent
              </p>
            </div>
            <Combobox
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              value={current.supplierId || ''}
              onChange={(val) => updateFormField('supplierId', val)}
              placeholder="Select Agent..."
              className="w-full bg-black/20 border-white/10"
            />
            {fieldErrors.supplierId && (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.supplierId}
              </p>
            )}
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            SKU Identity
          </p>
          <div className="grid gap-4">
            <FormField
              label="Product image"
              description="Upload a product photo (optional)">
              <ImageUpload
                value={current.imageUrl}
                onChange={(url) => updateFormField('imageUrl', url)}
                onRemove={() => updateFormField('imageUrl', '')}
              />
            </FormField>
            <FormField label="Brand / Supplier" error={fieldErrors.brand}>
              <Input
                placeholder="e.g. Optimum Nutrition"
                value={current.brand}
                onChange={(e) => updateFormField('brand', e.target.value)}
                className={cn("bg-black/20 border-white/10 focus:border-primary/50", fieldErrors.brand && 'border-destructive')}
              />
            </FormField>
            <FormField label="Product Type">
              <select
                value={current.type || 'OTHER'}
                onChange={(e) => updateFormField('type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PROTEIN_POWDER">Protein Powder</option>
                <option value="CREATINE">Creatine</option>
                <option value="PRE_WORKOUT">Pre-Workout</option>
                <option value="AMINO_ACIDS">Amino Acids</option>
                <option value="VITAMINS">Vitamins</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Product name" error={fieldErrors.name}>
              <Input
                placeholder="Gold Standard Whey 5lb"
                value={current.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                className={cn("bg-black/20 border-white/10 focus:border-primary/50", fieldErrors.name && 'border-destructive')}
              />
            </FormField>
            <FormField label="SKU / barcode" error={fieldErrors.sku}>
              <DeviceQRScanner
                value={current.sku}
                onChange={(value) => updateFormField('sku', value)}
                error={fieldErrors.sku}
              />
            </FormField>
            
            {!isBundle && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Flavor">
                  <Input
                    placeholder="Flavor"
                    value={current.flavor ?? ''}
                    onChange={(e) => updateFormField('flavor', e.target.value)}
                    className="bg-black/20 border-white/10 focus:border-primary/50"
                  />
                </FormField>
                <FormField label="Size / packaging">
                  <Input
                    placeholder="5lb tub"
                    value={current.size ?? ''}
                    onChange={(e) => updateFormField('size', e.target.value)}
                    className="bg-black/20 border-white/10 focus:border-primary/50"
                  />
                </FormField>
              </div>
            )}
          </div>
        </section>

        {/* Bundle Items Section */}
        {isBundle && (
          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Bundle Items
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddBundleItem} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>
            {fieldErrors.bundleItems && (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.bundleItems}
              </p>
            )}
            
            <div className="space-y-3">
              {current.bundleItems?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Combobox
                      options={products.filter(p => !p.isBundle).map(p => ({ 
                        value: p.id, 
                        label: `${p.name} (${p.flavor || 'N/A'})` 
                      }))}
                      value={item.productId}
                      onChange={(val) => handleUpdateBundleItem(index, 'productId', val)}
                      placeholder="Select product..."
                      className="w-full bg-black/20 border-white/10"
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdateBundleItem(index, 'quantity', Number(e.target.value))}
                    className="w-20 bg-black/20 border-white/10 text-center"
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleRemoveBundleItem(index)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!current.bundleItems || current.bundleItems.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4">No items in bundle.</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/5">
               <FormField label="Shaker Count">
                  <Input
                    type="number"
                    min={0}
                    value={current.shakerCount ?? 0}
                    onChange={(e) => updateFormField('shakerCount', Number(e.target.value))}
                    className="bg-black/20 border-white/10"
                  />
               </FormField>
            </div>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Inventory & Pricing
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {!isBundle && (
              <FormField
                label={t('products.form.quantity', 'Qty on hand')}
                error={fieldErrors.quantity}>
                <Input
                  type="number"
                  min={0}
                  disabled={current.fulfillmentMode === 'on-demand'}
                  value={
                    current.fulfillmentMode === 'on-demand' ? 0 : current.quantity
                  }
                  onChange={(e) =>
                    updateFormField('quantity', Number(e.target.value) || 0)
                  }
                  className={cn("bg-black/20 border-white/10 focus:border-primary/50", fieldErrors.quantity && 'border-destructive')}
                />
              </FormField>
            )}
            <FormField
              label={isBundle ? "Bundle Cost (JOD)" : t('products.form.cost', 'Unit cost (JOD)')}
              error={fieldErrors.cost}>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={current.cost ?? 0}
                onChange={(e) =>
                  updateFormField('cost', Number(e.target.value) || 0)
                }
                className={cn("bg-black/20 border-white/10 focus:border-primary/50", fieldErrors.cost && 'border-destructive')}
              />
            </FormField>
            {isBundle && (
               <FormField
                label="Offer Price (JOD)"
                description="Override calculated price"
                error={fieldErrors.price}>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={current.price ?? 0}
                  onChange={(e) =>
                    updateFormField('price', Number(e.target.value) || 0)
                  }
                  className={cn("bg-black/20 border-white/10 focus:border-primary/50", fieldErrors.price && 'border-destructive')}
                />
              </FormField>
            )}
          </div>
          {!isBundle && (
            <p className="text-xs text-muted-foreground">
              Limited SKUs decrement quantity. On-demand items leave qty at zero
              automatically.
            </p>
          )}
        </section>
      </div>
    );
  };

  const openSheet = (product?: Product | null) => {
    const fulfillmentMode =
      product?.fulfillmentMode === 'on-demand' ? 'on-demand' : 'limited';
    setEditing(
      product
        ? {
            ...product,
            flavor: product.flavor ?? '',
            size: product.size ?? '',
            cost: Number(product.cost ?? 0),
            price: product.price ? Number(product.price) : undefined,
            fulfillmentMode,
            imageUrl: product.images || '',
            isBundle: product.isBundle,
            bundleItems: product.bundleItems,
            supplierId: product.supplierId,
            shakerCount: product.attributes?.shakerCount
          }
        : null
    );
    setFormState(
      product
        ? {
            ...product,
            flavor: product.flavor ?? '',
            size: product.size ?? '',
            cost: Number(product.cost ?? 0),
            price: product.price ? Number(product.price) : undefined,
            fulfillmentMode,
            imageUrl: product.images || '',
            isBundle: product.isBundle,
            bundleItems: product.bundleItems,
            supplierId: product.supplierId,
            shakerCount: product.attributes?.shakerCount
          }
        : {
            id: '',
            name: '',
            brand: '',
            sku: '',
            flavor: '',
            size: '',
            quantity: 0,
            cost: 0,
            active: true,
            fulfillmentMode: 'limited',
            imageUrl: '',
            isBundle: false,
            bundleItems: [],
            shakerCount: 0,
            type: 'OTHER'
          }
    );
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setFormState(null);
    setFieldErrors({});
  };

  const handleSubmit = () => {
    if (!formState) return;

    // Validate form
    const payload = {
      name: formState.name.trim(),
      brand: formState.brand.trim(),
      sku: formState.sku.trim().toUpperCase(),
      flavor: formState.flavor || '',
      size: formState.size || '',
      quantity: Number(formState.quantity),
      cost: Number(formState.cost ?? 0),
      price: formState.price ? Number(formState.price) : undefined,
      active: formState.active,
      fulfillmentMode: formState.fulfillmentMode,
      imageUrl: formState.imageUrl || '',
      isBundle: formState.isBundle || false,
      bundleItems: formState.bundleItems ?? [],
      supplierId: formState.supplierId,
      shakerCount: formState.shakerCount,
      type: formState.type
    };

    const errors = validateProductPayload(payload, editing?.id);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setFieldErrors({});

    const isEdit = !!editing?.id;
    const optimisticId = editing?.id || `temp-${Date.now()}`;
    const optimisticProduct: Product = {
      ...payload,
      id: optimisticId,
      updatedAt: new Date().toISOString(),
      flavor: payload.flavor || null,
      size: payload.size || null,
      images: payload.imageUrl || null,
      attributes: payload.shakerCount ? { shakerCount: payload.shakerCount } : undefined,
    };

    // Optimistic update
    if (isEdit) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? optimisticProduct : p))
      );
    } else {
      setProducts((prev) => [optimisticProduct, ...prev]);
    }
    closeSheet();

    // Show loading toast
    const toastId = toast.loading(
      isEdit ? 'Updating product...' : 'Creating product...'
    );

    startTransition(async () => {
      try {
        await upsertProduct({
          ...payload,
          id: editing?.id || undefined,
        });
        toast.success(
          isEdit
            ? t('products.form.updated', 'Product updated')
            : t('products.form.created', 'Product created'),
          { id: toastId }
        );
        router.refresh();
      } catch (err) {
        console.error(err);
        // Rollback on error
        if (isEdit && editing) {
          const originalProduct = initialProducts.find(
            (p) => p.id === editing.id
          );
          if (originalProduct) {
            setProducts((prev) =>
              prev.map((p) => (p.id === editing.id ? originalProduct : p))
            );
          }
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== optimisticId));
        }
        toast.error(
          err instanceof Error
            ? err.message
            : t('products.form.error', 'Failed to save product'),
          { id: toastId }
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;

    // Store the product for potential rollback
    const deletedProduct = products.find((p) => p.id === id);
    if (!deletedProduct) return;

    // Optimistic delete
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const toastId = toast.loading('Deleting product...');

    startTransition(async () => {
      try {
        await deleteProductAction({ id });
        toast.success(t('products.form.deleted', 'Product deleted'), {
          id: toastId,
        });
        router.refresh();
      } catch (err) {
        console.error(err);
        // Rollback on error
        setProducts((prev) => [...prev, deletedProduct]);
        toast.error(
          err instanceof Error
            ? err.message
            : t('products.form.deleteError', 'Failed to delete product'),
          { id: toastId }
        );
      }
    });
  };

  return (
    <>

      {showNotificationTester && (
        <section className="rounded-3xl border border-dashed border-border/70 bg-background/50 px-4 py-4 text-sm text-muted-foreground">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">
                Notification lab
              </p>
              <p className="text-sm text-foreground">
                Fire a dummy push to verify devices are still paired with
                Controlplane.
              </p>
              {notificationMessage && (
                <p
                  className={cn(
                    'text-xs',
                    notificationTesterState === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}>
                  {notificationMessage}
                </p>
              )}
            </div>
            <Button
              className="brand-glow"
              disabled={notificationTesterState === 'loading'}
              onClick={triggerTestNotification}>
              {notificationTesterState === 'loading'
                ? 'Sending...'
                : notificationTesterState === 'success'
                ? 'Notification sent'
                : 'Send test notification'}
            </Button>
          </div>
        </section>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-[calc(6.5rem+var(--safe-bottom))] left-1/2 z-50 -translate-x-1/2 transform md:bottom-6">
          <div className="flex items-center gap-4 rounded-full border border-white/10 bg-black/80 px-6 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-sm font-medium text-white">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('activate')}
              className="h-8 text-xs text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200">
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('deactivate')}
              className="h-8 text-xs hover:bg-white/10 hover:text-white">
              Deactivate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300">
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds([])}
              className="ml-2 h-6 w-6 rounded-full hover:bg-white/20">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <section className="space-y-8">
        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                Refine view
              </div>

              <select
                value={currentType}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:border-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="PROTEIN_POWDER">Protein Powder</option>
                <option value="CREATINE">Creatine</option>
                <option value="PRE_WORKOUT">Pre-Workout</option>
                <option value="AMINO_ACIDS">Amino Acids</option>
                <option value="VITAMINS">Vitamins</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                value={currentSupplier}
                onChange={(e) => updateFilter('supplier', e.target.value)}
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:border-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <select
                value={currentFulfillmentMode}
                onChange={(e) =>
                  updateFilter('fulfillmentMode', e.target.value)
                }
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:border-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Fulfillment</option>
                <option value="limited">Limited Stock</option>
                <option value="on-demand">On-Demand</option>
              </select>

              <select
                value={currentStatus}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:border-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={currentStock}
                onChange={(e) => updateFilter('stock', e.target.value)}
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground hover:border-white/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="border border-white/10 bg-white/5 hover:bg-white/10">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}

              <Button
                variant={isSelectionMode ? 'secondary' : 'outline'}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds([]); // Clear selection when exiting
                }}
                className="border-white/10 bg-white/5 hover:bg-white/10">
                {isSelectionMode ? 'Cancel Selection' : 'Select'}
              </Button>

              <Button onClick={() => openSheet(null)} className="brand-glow">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {currentQuery && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Search: {currentQuery}
                </span>
              )}
              {currentType && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  Type: {currentType.replaceAll('_', ' ')}
                </span>
              )}
              {currentSupplier && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  Supplier: {activeSupplierName}
                </span>
              )}
              {currentFulfillmentMode && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  Fulfillment:{' '}
                  {currentFulfillmentMode === 'on-demand'
                    ? 'On-Demand'
                    : 'Limited Stock'}
                </span>
              )}
              {currentStatus && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  Status: {currentStatus === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              )}
              {currentStock && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  Stock: {currentStock.replaceAll('-', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grouped Products */}
        <div className="space-y-12">
          {Object.entries(groupedProducts).map(([groupName, groupProducts]) => {
            if (groupProducts.length === 0) return null;
            
            return (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">{groupName}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {groupProducts.length} items
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupProducts.map((product) => (
                    <div key={product.id} className="relative group">
                      <div className="absolute left-3 top-3 z-10">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, product.id]);
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== product.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-white/20 bg-black/50 text-primary focus:ring-0 focus:ring-offset-0"
                          />
                        )}
                      </div>
                      <ProductCard
                        id={product.id}
                        brand={product.brand}
                        name={product.name}
                        sku={product.sku}
                        flavor={product.flavor}
                        size={product.size}
                        quantity={product.quantity}
                        cost={product.cost}
                        active={product.active}
                        fulfillmentMode={product.fulfillmentMode}
                        imageUrl={product.images}
                        lowStock={
                          product.fulfillmentMode === 'limited' &&
                          product.quantity > 0 &&
                          product.quantity <= limitedThreshold
                        }
                        currencyFormatter={currencyFormatter}
                        onEdit={() => openSheet(product)}
                        onDelete={() => handleDelete(product.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <EmptyStatePanel
              icon={PackageSearch}
              eyebrow="Inventory view"
              title={
                hasActiveFilters
                  ? 'No products match the current filters'
                  : 'No products added yet'
              }
              description={
                hasActiveFilters
                  ? 'Clear one or more filters to widen the list, or add a new SKU directly from here.'
                  : 'Start with your first SKU to populate inventory cards, low-stock monitoring, and quick edit actions.'
              }>
              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => openSheet(null)} className="brand-glow">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </EmptyStatePanel>
          )}
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full border-l border-white/10 bg-black/90 backdrop-blur-xl sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-foreground">
              {editing ? (
                <Trans k="products.form.editTitle" fallback="Edit Product" />
              ) : (
                <Trans k="products.form.addTitle" fallback="Add New Product" />
              )}
            </SheetTitle>
            <SheetDescription>
              <Trans
                k="products.form.description"
                fallback="Configure product details, inventory, and fulfillment settings."
              />
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8">{renderForm()}</div>
          <SheetFooter className="mt-6 flex-row justify-end gap-3 sm:justify-end">
            <Button
              variant="ghost"
              onClick={closeSheet}
              className="text-muted-foreground hover:text-foreground">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="brand-glow">
              {isPending
                ? t('common.saving', 'Saving...')
                : editing
                ? t('products.form.save', 'Save Changes')
                : t('products.form.create', 'Create Product')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FormField({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className={cn("text-xs font-bold uppercase tracking-wider text-muted-foreground", error && "text-destructive")}>
          {label}
        </Label>
        {description && (
          <span className="text-[10px] text-muted-foreground/70">
            {description}
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
