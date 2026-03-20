'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Combobox } from '@/components/ui/combobox';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/hooks/use-debounce';

import { createSale } from './actions';

import { OrderStepper } from '@/components/orders/order-stepper';

import { OrderSummary } from '@/components/orders/order-summary';

import {
  Instagram,
  MessageCircle,
  Facebook,
  Store,
  Plus,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import {
  OrderProgressModal,
  type ProgressStep,
} from '@/components/orders/order-progress-modal';

interface LineItem {
  id: string;

  productId: string;

  quantity: number;

  unitPrice: number;

  unitCost: number;
}

type ChannelOption = {
  value: string;

  label: string;

  icon: LucideIcon;
};

const channelOptions: ChannelOption[] = [
  { value: 'instagram', label: 'Instagram DM', icon: Instagram },

  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },

  { value: 'facebook', label: 'Facebook', icon: Facebook },

  { value: 'offline', label: 'Retail / pop-up', icon: Store },
];

type Option = { value: string; label: string };

type ProductOption = Option & {
  cost: number;
  imageUrl?: string | null;
  isBundle?: boolean;
  price?: number;
};

type AgentOption = Option & { leadTime: number };
type DuplicateOrderResponse = {
  lines?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
  }>;
};

type RedirectLikeError = {
  digest?: string;
};

const NEW_SALE_DRAFT_KEY = 'controlplane:new-sale-draft:v1';

type NewSaleDraft = {
  version: 1;
  savedAt: string;
  currentStep: number;
  channel: string;
  customerName: string;
  city: string;
  orderReference: string;
  contactNumber: string;
  lineItems: LineItem[];
  fulfillmentType: 'limited' | 'on-demand';
  partner: string;
  deliveryDate?: string;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryFee: number;
  address: string;
  pickupLocation: string;
  notes: string;
  acknowledged: boolean;
  isExpedited: boolean;
};

function parseDraft(rawDraft: string): NewSaleDraft | null {
  try {
    const parsed = JSON.parse(rawDraft) as Partial<NewSaleDraft>;

    if (parsed.version !== 1 || typeof parsed.savedAt !== 'string') {
      return null;
    }

    return {
      version: 1,
      savedAt: parsed.savedAt,
      currentStep:
        typeof parsed.currentStep === 'number' ? parsed.currentStep : 0,
      channel: typeof parsed.channel === 'string' ? parsed.channel : 'instagram',
      customerName:
        typeof parsed.customerName === 'string' ? parsed.customerName : '',
      city: typeof parsed.city === 'string' ? parsed.city : '',
      orderReference:
        typeof parsed.orderReference === 'string' ? parsed.orderReference : '',
      contactNumber:
        typeof parsed.contactNumber === 'string' ? parsed.contactNumber : '',
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      fulfillmentType:
        parsed.fulfillmentType === 'on-demand' ? 'on-demand' : 'limited',
      partner: typeof parsed.partner === 'string' ? parsed.partner : '',
      deliveryDate:
        typeof parsed.deliveryDate === 'string' ? parsed.deliveryDate : undefined,
      deliveryMethod:
        parsed.deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
      deliveryFee:
        typeof parsed.deliveryFee === 'number' ? parsed.deliveryFee : 2,
      address: typeof parsed.address === 'string' ? parsed.address : '',
      pickupLocation:
        typeof parsed.pickupLocation === 'string' ? parsed.pickupLocation : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      acknowledged: Boolean(parsed.acknowledged),
      isExpedited: Boolean(parsed.isExpedited),
    };
  } catch {
    return null;
  }
}

export default function NewSaleForm({
  products,

  agents,
  initialData,
}: {
  products: ProductOption[];

  agents: AgentOption[];
  initialData?: { [key: string]: string | string[] | undefined };
}) {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const data = initialData || Object.fromEntries(searchParams.entries());
  const duplicateId =
    typeof data.duplicate === 'string' ? data.duplicate : null;

  // Dynamic step configuration using translations
  const stepConfig = useMemo(
    () => [
      {
        label: t('newSale.steps.step1Label', 'Channel & customer'),
        description: t('newSale.steps.step1Desc', 'Where did the order start?'),
      },
      {
        label: t('newSale.steps.step2Label', 'Items'),
        description: t('newSale.steps.step2Desc', 'Build the stack'),
      },
      {
        label: t('newSale.steps.step3Label', 'Fulfillment'),
        description: t('newSale.steps.step3Desc', 'Limited vs on-demand'),
      },
      {
        label: t('newSale.steps.step4Label', 'Review & confirm'),
        description: t('newSale.steps.step4Desc', 'Payment & alerts'),
      },
    ],
    [t],
  );

  // Dynamic channel hints using translations
  const channelHints: Record<string, string> = useMemo(
    () => ({
      instagram: t('newSale.channel.hints.instagram', 'Stories & drop pools'),
      whatsapp: t('newSale.channel.hints.whatsapp', 'Direct chat'),
      facebook: t('newSale.channel.hints.facebook', 'Page inbox'),
      offline: t('newSale.channel.hints.offline', 'Events / walk-ins'),
    }),
    [t],
  );

  // Dynamic channel labels using translations
  const channelLabels: Record<string, string> = useMemo(
    () => ({
      instagram: t('newSale.channel.options.instagram', 'Instagram DM'),
      whatsapp: t('newSale.channel.options.whatsapp', 'WhatsApp'),
      facebook: t('newSale.channel.options.facebook', 'Facebook'),
      offline: t('newSale.channel.options.offline', 'Retail / pop-up'),
    }),
    [t],
  );

  const cities = useMemo(
    () => [
      {
        value: 'Amman',
        label: `${t('newSale.fulfillment.cities.amman', 'Amman')} (2.00 JOD)`,
      },
      {
        value: 'Zarqa',
        label: `${t('newSale.fulfillment.cities.zarqa', 'Zarqa')} (2.50 JOD)`,
      },
      {
        value: 'Irbid',
        label: `${t('newSale.fulfillment.cities.irbid', 'Irbid')} (2.50 JOD)`,
      },
      {
        value: 'Aqaba',
        label: `${t('newSale.fulfillment.cities.aqaba', 'Aqaba')} (2.50 JOD)`,
      },
      {
        value: 'As-Salt',
        label: `${t('newSale.fulfillment.cities.salt', 'As-Salt')} (2.50 JOD)`,
      },
      {
        value: 'Madaba',
        label: `${t('newSale.fulfillment.cities.madaba', 'Madaba')} (2.50 JOD)`,
      },
      {
        value: 'Jerash',
        label: `${t('newSale.fulfillment.cities.jerash', 'Jerash')} (2.50 JOD)`,
      },
      {
        value: "Ma'an",
        label: `${t('newSale.fulfillment.cities.maan', "Ma'an")} (2.50 JOD)`,
      },
      {
        value: 'Karak',
        label: `${t('newSale.fulfillment.cities.karak', 'Karak')} (2.50 JOD)`,
      },
      {
        value: 'Tafilah',
        label: `${t('newSale.fulfillment.cities.tafilah', 'Tafilah')} (2.50 JOD)`,
      },
      {
        value: 'Mafraq',
        label: `${t('newSale.fulfillment.cities.mafraq', 'Mafraq')} (2.50 JOD)`,
      },
      {
        value: 'Ajloun',
        label: `${t('newSale.fulfillment.cities.ajloun', 'Ajloun')} (2.50 JOD)`,
      },
    ],
    [t],
  );

  const [currentStep, setCurrentStep] = useState(0);

  const [channel, setChannel] = useState(
    (typeof data.channel === 'string' ? data.channel : 'instagram') ||
      'instagram',
  );

  const [customerName, setCustomerName] = useState(
    typeof data.customerName === 'string' ? data.customerName : '',
  );

  const [city, setCity] = useState(
    typeof data.city === 'string' ? data.city : '',
  );

  // Track if delivery fee was manually edited to avoid overriding it automatically
  const [isdeliveryFeeManuallyEdited, setIsDeliveryFeeManuallyEdited] =
    useState(false);

  const [orderReference, setOrderReference] = useState(
    typeof data.orderReference === 'string' ? data.orderReference : '',
  );

  const [contactNumber, setContactNumber] = useState(
    typeof data.contactNumber === 'string' ? data.contactNumber : '',
  );

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [unitPrice, setUnitPrice] = useState(0);

  const [fulfillmentType, setFulfillmentType] = useState<
    'limited' | 'on-demand'
  >(
    (typeof data.fulfillmentType === 'string'
      ? data.fulfillmentType
      : 'limited') as 'limited' | 'on-demand',
  );

  const [partner, setPartner] = useState(() => {
    if (typeof data.partnerId === 'string' && data.partnerId) {
      return data.partnerId;
    }
    return agents[0]?.value ?? '';
  });

  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    typeof data.deliveryDate === 'string'
      ? new Date(data.deliveryDate)
      : undefined,
  );

  const deliveryWindow = deliveryDate ? format(deliveryDate, 'PPP') : '';

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>(
    (typeof data.deliveryMethod === 'string'
      ? data.deliveryMethod
      : 'delivery') as 'delivery' | 'pickup',
  );

  const [deliveryFee, setDeliveryFee] = useState(
    typeof data.deliveryFee === 'string'
      ? parseFloat(data.deliveryFee) || 2
      : 2,
  );

  const [address, setAddress] = useState(
    typeof data.address === 'string' ? data.address : '',
  );

  const [pickupLocation, setPickupLocation] = useState(
    typeof data.pickupLocation === 'string' ? data.pickupLocation : '',
  );

  const [notes, setNotes] = useState(
    typeof data.notes === 'string' ? data.notes : '',
  );

  const [acknowledged, setAcknowledged] = useState(false);

  const [isExpedited, setIsExpedited] = useState(
    typeof data.isExpedited === 'string' ? data.isExpedited === 'true' : false,
  );

  const [isPending, startTransition] = useTransition();
  const [loadingDuplicate, setLoadingDuplicate] = useState(!!duplicateId);

  // Progress modal state
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('validating');
  const [progressError, setProgressError] = useState<string>();
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  const hasSearchPrefill = useMemo(
    () =>
      [
        'channel',
        'customerName',
        'city',
        'orderReference',
        'contactNumber',
        'deliveryMethod',
        'deliveryFee',
        'address',
        'pickupLocation',
        'notes',
        'isExpedited',
        'partnerId',
        'fulfillmentType',
        'deliveryDate',
      ].some((key) => {
        const value = data[key];
        if (Array.isArray(value)) {
          return value.length > 0;
        }

        return typeof value === 'string' && value.length > 0;
      }),
    [data],
  );

  const clearDraftStorage = () => {
    localStorage.removeItem(NEW_SALE_DRAFT_KEY);
    setDraftSavedAt(null);
  };

  const resetDraftAndReload = () => {
    clearDraftStorage();
    window.location.assign('/sales/new');
  };

  const productLookup = useMemo(() => {
    const map = new Map<string, ProductOption>();

    products.forEach((product) => map.set(product.value, product));

    return map;
  }, [products]);

  const handleProductSelect = (value: string) => {
    setSelectedProduct(value);

    if (!value) {
      setUnitPrice(0);

      return;
    }

    const meta = productLookup.get(value);

    if (meta && (!unitPrice || unitPrice === 0)) {
      if (meta.isBundle && meta.price) {
        setUnitPrice(meta.price);
      } else {
        const suggested = Number((meta.cost * 1.35).toFixed(2));
        setUnitPrice(suggested > 0 ? suggested : 0);
      }
    }
  };

  useEffect(() => {
    if (agents.length === 0) {
      setPartner('');

      return;
    }

    const stillValid = agents.some((agent) => agent.value === partner);

    if (!stillValid) {
      setPartner(agents[0].value);
    }
  }, [agents, partner]);

  // Auto-update delivery fee when city changes
  useEffect(() => {
    if (isdeliveryFeeManuallyEdited) return;

    if (city === 'Amman') {
      setDeliveryFee(2.0);
    } else if (city) {
      setDeliveryFee(2.5);
    }
  }, [city, isdeliveryFeeManuallyEdited]);

  // Load duplicate order line items
  useEffect(() => {
    if (!duplicateId || !loadingDuplicate) return;

    const loadDuplicate = async () => {
      try {
        const response = await fetch(`/api/sales/${duplicateId}/duplicate`);
        if (!response.ok) throw new Error('Failed to load order');
        const data = (await response.json()) as DuplicateOrderResponse;

        if (data.lines && Array.isArray(data.lines)) {
          const items: LineItem[] = data.lines.map(
            (line, index: number) => ({
              id: `duplicate-${index}-${Date.now()}`,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              unitCost: line.unitCost ?? 0,
            }),
          );
          setLineItems(items);
        }
      } catch (error) {
        console.error('Failed to load duplicate order:', error);
      } finally {
        setLoadingDuplicate(false);
      }
    };

    loadDuplicate();
  }, [duplicateId, loadingDuplicate]);

  const selectedProductMeta = selectedProduct
    ? (productLookup.get(selectedProduct) ?? null)
    : null;

  const subtotal = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
  }, [lineItems]);

  const total = subtotal;

  const totalCost = useMemo(
    () =>
      lineItems.reduce((acc, item) => acc + item.quantity * item.unitCost, 0),

    [lineItems],
  );

  const profitValue = subtotal - totalCost;

  const marginPercent = subtotal > 0 ? (profitValue / subtotal) * 100 : 0;

  const summaryItems = useMemo(
    () =>
      lineItems.map((item) => ({
        productId: item.productId,

        name: productLookup.get(item.productId)?.label ?? 'Product',

        quantity: item.quantity,

        unitPrice: item.unitPrice,

        unitCost: item.unitCost,
      })),

    [lineItems, productLookup],
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.value === partner),

    [agents, partner],
  );

  const draftSnapshot = useMemo<NewSaleDraft>(
    () => ({
      version: 1,
      savedAt: new Date().toISOString(),
      currentStep,
      channel,
      customerName,
      city,
      orderReference,
      contactNumber,
      lineItems,
      fulfillmentType,
      partner,
      deliveryDate: deliveryDate?.toISOString(),
      deliveryMethod,
      deliveryFee,
      address,
      pickupLocation,
      notes,
      acknowledged,
      isExpedited,
    }),
    [
      acknowledged,
      address,
      channel,
      city,
      contactNumber,
      currentStep,
      customerName,
      deliveryDate,
      deliveryFee,
      deliveryMethod,
      fulfillmentType,
      isExpedited,
      lineItems,
      notes,
      orderReference,
      partner,
      pickupLocation,
    ],
  );

  const debouncedDraftSnapshot = useDebounce(draftSnapshot, 600);
  const hasMeaningfulDraftData =
    currentStep > 0 ||
    lineItems.length > 0 ||
    Boolean(customerName.trim()) ||
    Boolean(contactNumber.trim()) ||
    Boolean(orderReference.trim()) ||
    Boolean(address.trim()) ||
    Boolean(city.trim()) ||
    Boolean(pickupLocation.trim()) ||
    Boolean(notes.trim());

  useEffect(() => {
    if (draftReady) {
      return;
    }

    const shouldSkipRestore = duplicateId || hasSearchPrefill;

    if (shouldSkipRestore) {
      setDraftReady(true);
      return;
    }

    const rawDraft = localStorage.getItem(NEW_SALE_DRAFT_KEY);

    if (!rawDraft) {
      setDraftReady(true);
      return;
    }

    const parsedDraft = parseDraft(rawDraft);
    if (!parsedDraft) {
      localStorage.removeItem(NEW_SALE_DRAFT_KEY);
      setDraftReady(true);
      return;
    }

    setCurrentStep(parsedDraft.currentStep);
    setChannel(parsedDraft.channel);
    setCustomerName(parsedDraft.customerName);
    setCity(parsedDraft.city);
    setOrderReference(parsedDraft.orderReference);
    setContactNumber(parsedDraft.contactNumber);
    setLineItems(parsedDraft.lineItems);
    setFulfillmentType(parsedDraft.fulfillmentType);
    setPartner(parsedDraft.partner || agents[0]?.value || '');
    setDeliveryDate(
      parsedDraft.deliveryDate ? new Date(parsedDraft.deliveryDate) : undefined,
    );
    setDeliveryMethod(parsedDraft.deliveryMethod);
    setDeliveryFee(parsedDraft.deliveryFee);
    setAddress(parsedDraft.address);
    setPickupLocation(parsedDraft.pickupLocation);
    setNotes(parsedDraft.notes);
    setAcknowledged(parsedDraft.acknowledged);
    setIsExpedited(parsedDraft.isExpedited);
    setDraftSavedAt(new Date(parsedDraft.savedAt));
    setDraftReady(true);
    toast.info(t('newSale.draft.restored', 'Draft restored'), {
      description: format(new Date(parsedDraft.savedAt), 'PP p'),
    });
  }, [agents, draftReady, duplicateId, hasSearchPrefill, t]);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    if (!hasMeaningfulDraftData) {
      clearDraftStorage();
      return;
    }

    localStorage.setItem(
      NEW_SALE_DRAFT_KEY,
      JSON.stringify(debouncedDraftSnapshot),
    );
    setDraftSavedAt(new Date(debouncedDraftSnapshot.savedAt));
  }, [debouncedDraftSnapshot, draftReady, hasMeaningfulDraftData]);

  const canAdvance = () => {
    if (currentStep === 0) {
      return Boolean(customerName.trim()) && Boolean(contactNumber.trim());
    }

    if (currentStep === 1) {
      return lineItems.length > 0;
    }

    if (currentStep === 2) {
      if (fulfillmentType === 'limited') return true;

      return partner.length > 0 && Boolean(selectedAgent);
    }

    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) return;

    setCurrentStep((prev) => Math.min(prev + 1, stepConfig.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const addLineItem = () => {
    if (!selectedProduct || quantity <= 0 || unitPrice <= 0) return;

    const meta = productLookup.get(selectedProduct);

    if (!meta) return;

    setLineItems((prev) => [
      ...prev,

      {
        id: `${selectedProduct}-${Date.now()}`,

        productId: selectedProduct,

        quantity,

        unitPrice,

        unitCost: meta.cost ?? 0,
      },
    ]);

    setSelectedProduct('');

    setQuantity(1);

    setUnitPrice(0);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !contactNumber.trim() || lineItems.length === 0) {
      toast.error(t('newSale.draft.missingRequired', 'Complete the customer and item details first.'));
      return;
    }

    if (deliveryMethod === 'delivery' && (!city || !address.trim())) {
      toast.error(t('newSale.fulfillment.completeDelivery', 'Choose a city and full delivery address.'));
      return;
    }

    if (deliveryMethod === 'pickup' && !pickupLocation.trim()) {
      toast.error(t('newSale.fulfillment.completePickup', 'Add a pickup location before submitting.'));
      return;
    }

    // Show progress modal
    setShowProgress(true);
    setProgressStep('validating');
    setProgressError(undefined);

    startTransition(async () => {
      try {
        // Quick visual feedback for steps
        setProgressStep('checking-inventory');
        await new Promise((resolve) => setTimeout(resolve, 150));

        setProgressStep('calculating-costs');
        await new Promise((resolve) => setTimeout(resolve, 150));

        setProgressStep('processing-items');
        await new Promise((resolve) => setTimeout(resolve, 150));

        setProgressStep('finalizing');

        // Make the actual API call (this will redirect on success)
        await createSale({
          customerName: customerName.trim(),
          contactNumber: contactNumber.trim(),
          address: address.trim(),
          deliveryMethod,
          deliveryFee: deliveryMethod === 'delivery' ? deliveryFee : 0,
          deliveryWindow,
          city: city.trim(),
          isExpedited,
          lineItems: lineItems.map(({ productId, quantity, unitPrice }) => ({
            productId,
            quantity,
            unitPrice,
          })),
          subtotal,
          total,
          channel: channel.trim(),
          orderReference: orderReference.trim() || undefined,
          fulfillmentType,
          partnerId:
            fulfillmentType === 'on-demand' && selectedAgent
              ? partner
              : undefined,
          pickupLocation:
            deliveryMethod === 'pickup'
              ? pickupLocation.trim() || undefined
              : undefined,
          notes: notes.trim() || undefined,
        });

        // If we reach here, show success (redirect() will throw, so this may not run)
        setProgressStep('success');
      } catch (error) {
        // Check if it's a Next.js redirect (which is expected)
        if (
          error &&
          typeof error === 'object' &&
          'digest' in error &&
          typeof (error as RedirectLikeError).digest === 'string' &&
          (error as RedirectLikeError).digest?.includes('NEXT_REDIRECT')
        ) {
          // This is expected - the redirect is happening
          setProgressStep('success');
          clearDraftStorage();
          // Let the redirect happen
          throw error;
        }

        // Real error occurred
        console.error('Order creation failed:', error);
        setProgressStep('error');
        setProgressError(
          error instanceof Error
            ? error.message
            : t(
                'newSale.fulfillment.failedToCreateOrder',
                'Failed to create order. Please try again.',
              ),
        );
      }
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 sm:space-y-6">
            <div>
              <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t('newSale.channel.title', 'Channel Origin')}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {channelOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = channel === option.value;
                  const label = channelLabels[option.value];

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChannel(option.value)}
                      className={cn(
                        'group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300',
                        isActive
                          ? 'glass-active border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(219,236,10,0.15)]'
                          : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10',
                      )}
                      aria-pressed={isActive}>
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300',
                          isActive
                            ? 'border-primary/50 bg-primary text-primary-foreground shadow-[0_0_15px_rgba(219,236,10,0.4)]'
                            : 'border-white/10 bg-white/5 text-muted-foreground group-hover:scale-110 group-hover:text-foreground',
                        )}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="space-y-1">
                        <p
                          className={cn(
                            'font-bold transition-colors',
                            isActive ? 'text-primary' : 'text-foreground',
                          )}>
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {channelHints[option.value]}
                        </p>
                      </div>

                      {isActive && (
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div className="group relative">
                  <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('newSale.customer.identityLabel', 'Customer Identity')}
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={t(
                        'newSale.customer.namePlaceholder',
                        'Full name or handle',
                      )}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-14 rounded-2xl border-white/10 bg-white/5 pl-4 text-lg backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                    />
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-focus-within:opacity-100" />
                  </div>
                </div>

                <div className="group relative">
                  <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('newSale.customer.contactLabel', 'Contact Signal')}
                  </label>
                  <Input
                    type="tel"
                    placeholder={t(
                      'newSale.customer.contactPlaceholder',
                      '+962 7X XXX XXXX',
                    )}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/5 pl-4 text-lg backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                  />
                </div>
              </div>

              <div className="group relative">
                <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('newSale.customer.referenceLabel', 'Reference Tag')}
                </label>
                <Input
                  placeholder={t(
                    'newSale.customer.referencePlaceholder',
                    'e.g. IG Story promo',
                  )}
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  className="h-full min-h-[8rem] rounded-2xl border-white/10 bg-white/5 p-4 text-base backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 sm:space-y-6">
            <div className="glass-panel space-y-6 rounded-[2rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('newSale.items.inventoryStack', 'Inventory Stack')}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {t(
                      'newSale.items.stackHint',
                      'Blend limited + on-demand SKUs.',
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-foreground">
                    {lineItems.length} {t('newSale.items.itemsCount', 'items')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <Combobox
                    options={products}
                    value={selectedProduct}
                    onChange={handleProductSelect}
                    placeholder={t(
                      'newSale.items.selectProduct',
                      'Select product...',
                    )}
                    className="h-14 w-full rounded-2xl border-white/10 bg-white/5 text-base sm:text-lg backdrop-blur-md"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                      placeholder={t('newSale.items.qtyLabel', 'Qty')}
                      className="h-14 rounded-2xl border-white/10 bg-white/5 text-center text-lg font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                      {t('newSale.items.qtyLabel', 'Qty')}
                    </span>
                  </div>

                  <div className="relative flex-[1.5]">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) =>
                        setUnitPrice(Number(e.target.value) || 0)
                      }
                      placeholder={t('newSale.items.priceLabel', 'Price')}
                      className="h-14 rounded-2xl border-white/10 bg-white/5 pl-4 text-lg font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                      {t('newSale.items.jodLabel', 'JOD')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedProductMeta && (
                <div className="flex items-center gap-4 rounded-xl bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                  <span>
                    {t('newSale.items.baseLabel', 'Base:')}{' '}
                    <span className="font-mono text-foreground">
                      JOD {selectedProductMeta.cost.toFixed(2)}
                    </span>
                  </span>
                  <span className="h-3 w-px bg-white/10" />
                  <span>
                    {t('newSale.items.suggestedLabel', 'Suggested:')}{' '}
                    <span className="font-mono text-emerald-400">
                      JOD {(selectedProductMeta.cost * 1.35).toFixed(2)}
                    </span>
                  </span>
                </div>
              )}

              <Button
                type="button"
                onClick={addLineItem}
                variant="outline"
                className="group w-full justify-center rounded-xl border-dashed border-white/20 bg-transparent py-6 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary">
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                {t('newSale.items.addToStack', 'Add to Stack')}
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  {t(
                    'newSale.items.noProducts',
                    'No products yet. Start building the stack.',
                  )}
                </p>
              ) : (
                lineItems.map((item) => {
                  const meta = productLookup.get(item.productId);

                  const label = meta?.label ?? 'Product';

                  const lineRevenue = item.quantity * item.unitPrice;

                  const lineCost = item.quantity * item.unitCost;

                  const lineProfit = lineRevenue - lineCost;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/30 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{label}</p>

                        <p className="text-xs text-muted-foreground">
                          {item.quantity}{' '}
                          {t('newSale.items.unitsLabel', 'units')} x JOD{' '}
                          {item.unitPrice.toFixed(2)}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          {t('newSale.items.costLabel', 'Cost')} JOD{' '}
                          {item.unitCost.toFixed(2)} |{' '}
                          {t('newSale.items.profitLabel', 'Profit')} JOD{' '}
                          {lineProfit.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-sm font-semibold text-foreground">
                          JOD {lineRevenue.toFixed(2)}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                          {t('newSale.items.remove', 'remove')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 sm:space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFulfillmentType('limited')}
                className={cn(
                  'group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-300',
                  fulfillmentType === 'limited'
                    ? 'glass-active border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(219,236,10,0.15)]'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10',
                )}>
                <div className="relative z-10">
                  <div
                    className={cn(
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors',
                      fulfillmentType === 'limited'
                        ? 'border-primary/50 bg-primary text-primary-foreground'
                        : 'border-white/10 bg-white/5 text-muted-foreground',
                    )}>
                    <span className="text-2xl">📦</span>
                  </div>
                  <p
                    className={cn(
                      'text-lg font-bold transition-colors',
                      fulfillmentType === 'limited'
                        ? 'text-primary'
                        : 'text-foreground',
                    )}>
                    {t('newSale.fulfillment.limitedTitle', 'Limited Stock')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'newSale.fulfillment.limitedDesc',
                      'Immediate fulfillment from local inventory.',
                    )}
                  </p>
                </div>
                {fulfillmentType === 'limited' && (
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('on-demand')}
                className={cn(
                  'group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-300',
                  fulfillmentType === 'on-demand'
                    ? 'glass-active border-accent/50 bg-accent/10 shadow-[0_0_30px_rgba(98,195,255,0.15)]'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10',
                )}>
                <div className="relative z-10">
                  <div
                    className={cn(
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors',
                      fulfillmentType === 'on-demand'
                        ? 'border-accent/50 bg-accent text-accent-foreground'
                        : 'border-white/10 bg-white/5 text-muted-foreground',
                    )}>
                    <span className="text-2xl">🔄</span>
                  </div>
                  <p
                    className={cn(
                      'text-lg font-bold transition-colors',
                      fulfillmentType === 'on-demand'
                        ? 'text-accent'
                        : 'text-foreground',
                    )}>
                    {t('newSale.fulfillment.onDemandTitle', 'On-Demand Pull')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'newSale.fulfillment.onDemandDesc',
                      'Route order to partner for fulfillment.',
                    )}
                  </p>
                </div>
                {fulfillmentType === 'on-demand' && (
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-50" />
                )}
              </button>
            </div>

            {fulfillmentType === 'on-demand' && (
              <div className="glass-panel rounded-[2rem] p-6">
                <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('newSale.fulfillment.partnerNetwork', 'Partner Network')}
                </p>

                {agents.length ? (
                  <>
                    <Combobox
                      options={agents}
                      value={partner}
                      onChange={setPartner}
                      placeholder={t(
                        'newSale.fulfillment.selectPartner',
                        'Select partner...',
                      )}
                      className="h-14 w-full rounded-2xl border-white/10 bg-white/5 text-lg backdrop-blur-md"
                    />

                    {selectedAgent && (
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
                          ⏱️
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {t(
                              'newSale.fulfillment.estimatedLeadTime',
                              'Estimated Lead Time',
                            )}
                          </p>
                          <p className="text-sm font-bold text-accent">
                            {selectedAgent.leadTime}{' '}
                            {t('newSale.fulfillment.hoursLabel', 'hours')}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'newSale.fulfillment.noAgents',
                        'No active agents found in the network.',
                      )}
                    </p>
                    <a
                      href="/agents"
                      className="mt-2 text-xs font-bold text-primary hover:underline">
                      {t('newSale.fulfillment.onboardAgent', '+ Onboard Agent')}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {t('newSale.fulfillment.deliveryWindow', 'Delivery Date')}
                </p>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full h-14 justify-start text-left font-normal rounded-2xl border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:text-foreground',
                        !deliveryDate && 'text-muted-foreground',
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? (
                        format(deliveryDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 glass-panel border-none bg-transparent shadow-none"
                    align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      initialFocus
                      className="glass-panel rounded-xl border border-border/40 bg-background/60 backdrop-blur-2xl p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isExpedited}
                  onChange={(e) => setIsExpedited(e.target.checked)}
                  className="rounded border-border/60"
                />
                {t(
                  'newSale.fulfillment.rushDelivery',
                  'Rush delivery required',
                )}
              </label>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t('newSale.fulfillment.handoffMethod', 'Hand-off method')}
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(['delivery', 'pickup'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDeliveryMethod(method)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left text-sm transition-all',

                      deliveryMethod === method
                        ? 'brand-glow border-transparent text-primary-foreground'
                        : 'border-border/60 bg-background/30 text-muted-foreground hover:text-foreground',
                    )}>
                    {method === 'delivery'
                      ? t('newSale.fulfillment.deliveryLabel', 'Delivery')
                      : t('newSale.fulfillment.pickupLabel', 'Pickup')}
                  </button>
                ))}
              </div>
            </div>

            {deliveryMethod === 'delivery' ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('newSale.fulfillment.addressLabel', 'Delivery Address')}
                  </p>

                  <div className="mb-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full h-14 justify-between rounded-2xl border-white/10 bg-white/5 text-base backdrop-blur-md transition-all hover:bg-white/10 hover:text-foreground',
                            !city && 'text-muted-foreground',
                          )}>
                          {city
                            ? cities.find((c) => c.value === city)?.label
                            : 'Select City...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-xl border-white/10 bg-black/90 backdrop-blur-xl">
                        <Command>
                          <CommandInput
                            placeholder="Search city..."
                            className="h-11"
                          />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {cities.map((c) => (
                                <CommandItem
                                  key={c.value}
                                  value={c.value}
                                  onSelect={(currentValue) => {
                                    setCity(
                                      currentValue === city ? '' : currentValue,
                                    );
                                    // Make sure to reset manual edit flag if needed, or keep it.
                                    // For now, let's allow auto-update again if they switch cities.
                                    setIsDeliveryFeeManuallyEdited(false);
                                  }}
                                  className="text-base">
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      city === c.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {c.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Textarea
                    placeholder={t(
                      'newSale.fulfillment.addressPlaceholder',
                      'Full street address',
                    )}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="min-h-[6rem] rounded-2xl border-white/10 bg-white/5 p-4 text-base backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                  />
                </div>

                <div>
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t('newSale.fulfillment.deliveryFeeLabel', 'Delivery fee')}{' '}
                    (JOD)
                  </p>
                  <Input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => {
                      setDeliveryFee(Number(e.target.value) || 0);
                      setIsDeliveryFeeManuallyEdited(true);
                    }}
                    className="h-14 rounded-2xl border-white/10 bg-white/5 pl-4 text-lg backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t(
                    'newSale.fulfillment.pickupLocationLabel',
                    'Pickup Location',
                  )}
                </p>
                <Input
                  placeholder={t(
                    'newSale.fulfillment.pickupLocationPlaceholder',
                    'Where to collect',
                  )}
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="h-14 rounded-2xl border-white/10 bg-white/5 pl-4 text-lg backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(219,236,10,0.1)]"
                />
              </div>
            )}

            <div>
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t('newSale.fulfillment.notesLabel', 'Internal Notes')}
              </p>
              <Textarea
                placeholder={t(
                  'newSale.fulfillment.notesPlaceholder',
                  'Special requests, timing, edge cases...',
                )}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[6rem] rounded-xl border-white/10 bg-white/5 p-4 text-sm backdrop-blur-md transition-all focus:border-primary/50 focus:bg-white/10"
              />
            </div>
          </div>
        );

      case 3:
      default:
        return (
          <div className="space-y-6">
            <div className="glass-panel overflow-hidden rounded-[2rem]">
              <div className="border-b border-white/5 bg-white/5 px-6 py-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('newSale.review.orderSummary', 'Order Summary')}
                </p>
              </div>
              <div className="p-6">
                <OrderSummary
                  channel={channel}
                  customerName={customerName}
                  customerContact={contactNumber}
                  address={address}
                  fulfillmentType={fulfillmentType}
                  lineItems={summaryItems}
                  subtotal={subtotal}
                  deliveryFee={deliveryMethod === 'delivery' ? deliveryFee : 0}
                  total={
                    total + (deliveryMethod === 'delivery' ? deliveryFee : 0)
                  }
                  margin={marginPercent}
                  profit={profitValue}
                  deliveryWindow={deliveryWindow}
                  deliveryMethod={deliveryMethod}
                  notes={notes}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <input
                type="checkbox"
                id="acknowledge"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="h-5 w-5 rounded border-yellow-500/50 bg-transparent text-yellow-500 focus:ring-yellow-500/50"
              />
              <label
                htmlFor="acknowledge"
                className="text-sm text-muted-foreground">
                {t(
                  'newSale.review.acknowledge',
                  'I acknowledge inventory + customer contact',
                )}
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t('newSale.draft.title', 'Local draft')}
          </p>
          <p className="text-sm text-muted-foreground">
            {draftSavedAt
              ? t('newSale.draft.savedAt', `Autosaved on this device at ${format(draftSavedAt, 'PP p')}.`)
              : t('newSale.draft.idle', 'Changes autosave on this device while you build the order.')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={resetDraftAndReload}
          disabled={!draftSavedAt && !hasMeaningfulDraftData}
          className="border-white/10 bg-white/5 hover:bg-white/10">
          {t('newSale.draft.clear', 'Clear draft')}
        </Button>
      </div>

      <div className="mb-8">
        <OrderStepper steps={stepConfig} currentStep={currentStep} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-8">
        <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 sm:pb-0">
          {renderStep()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/80 p-4 backdrop-blur-xl sm:static sm:border-none sm:bg-transparent sm:p-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0 || isPending}
              className="text-muted-foreground hover:bg-white/5 hover:text-foreground">
              {t('newSale.review.backButton', 'Back')}
            </Button>

            <div className="flex flex-col items-end gap-2">
              {draftSavedAt && (
                <p className="text-xs text-muted-foreground">
                  {t('newSale.draft.footer', `Draft saved ${format(draftSavedAt, 'p')}`)}
                </p>
              )}
              {currentStep === stepConfig.length - 1 ? (
                <Button
                  type="submit"
                  disabled={!acknowledged || isPending}
                  className={cn(
                    'relative overflow-hidden rounded-xl px-8 py-6 text-base font-bold transition-all duration-300',
                    acknowledged
                      ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(219,236,10,0.4)] hover:shadow-[0_0_50px_rgba(219,236,10,0.6)] hover:scale-105'
                      : 'bg-muted text-muted-foreground',
                  )}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('common.messages.processing', 'Processing...')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('newSale.review.submitButton', 'Submit Order')}
                    </span>
                  )}
                  {acknowledged && !isPending && (
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="rounded-xl bg-white/10 px-8 py-6 text-base font-bold text-foreground hover:bg-white/20">
                  Next Step
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Progress Modal */}
      <OrderProgressModal
        isOpen={showProgress}
        currentStep={progressStep}
        error={progressError}
        onClose={() => {
          setShowProgress(false);
          if (progressStep === 'error') {
            setProgressStep('validating');
            setProgressError(undefined);
          }
        }}
      />
    </div>
  );
}
