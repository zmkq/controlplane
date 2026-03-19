'use client';

import Image from 'next/image';
import { APP_LOGO_PATH, APP_NAME } from '@/lib/app-config';
import {
  Package,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Gift,
} from 'lucide-react';

type ShippingMeta = {
  contactNumber?: string;
  deliveryMethod?: 'delivery' | 'pickup';
  address?: string;
  pickupLocation?: string;
  deliveryWindow?: string;
  notes?: string;
  city?: string;
  deliveryFee?: number;
};

type SafeSale = {
  id: string;
  orderNo: string;
  date: Date;
  status: string;
  subtotal: number;
  discounts: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  customer: {
    name: string;
  } | null;
  lines: Array<{
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      name: string;
      brand: string;
      flavor: string | null;
      size: string | null;
      images: string | null;
    };
  }>;
};

type CustomerSaleViewProps = {
  sale: SafeSale;
  shipping: ShippingMeta;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: 'Processing', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  AWAITING_SUPPLIER: {
    label: 'Preparing',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  SUPPLIER_CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  AWAITING_DELIVERY: {
    label: 'Ready to Ship',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  CANCELED: { label: 'Canceled', color: 'text-red-400', bg: 'bg-red-500/10' },
  RETURNED: { label: 'Returned', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export function CustomerSaleView({ sale, shipping }: CustomerSaleViewProps) {
  const status = statusConfig[sale.status] || statusConfig.DRAFT;
  const totalItems = sale.lines.reduce((acc, line) => acc + line.quantity, 0);

  // Get shipping fee from either the shippingFee field or shippingAddress.deliveryFee
  const shippingFee = sale.shippingFee || (shipping.deliveryFee as number) || 0;

  // Calculate actual total (subtotal - discounts + shipping fee)
  const actualTotal = sale.subtotal - sale.discounts + shippingFee;

  return (
    <div className="min-h-screen relative overflow-hidden" dir="ltr">
      {/* Premium Brand Gradient Background */}
      <div className="fixed inset-0 bg-[#0a0a0f]">
        {/* Main brand gradient orbs - using #dbec0a (brand yellow-green) */}
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#dbec0a]/25 via-[#b8c908]/15 to-transparent blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#dbec0a]/20 via-[#a8b907]/10 to-transparent blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-[45%] left-[35%] w-[450px] h-[450px] rounded-full bg-gradient-to-r from-[#dbec0a]/15 via-[#c5d909]/10 to-transparent blur-[90px] animate-pulse-slow animation-delay-4000" />

        {/* Accent yellow sparkles */}
        <div className="absolute top-[12%] left-[18%] w-2 h-2 rounded-full bg-[#dbec0a]/70 shadow-[0_0_10px_#dbec0a] animate-twinkle" />
        <div className="absolute top-[35%] right-[22%] w-1.5 h-1.5 rounded-full bg-[#dbec0a]/50 shadow-[0_0_8px_#dbec0a] animate-twinkle animation-delay-1000" />
        <div className="absolute bottom-[28%] left-[12%] w-2 h-2 rounded-full bg-[#dbec0a]/60 shadow-[0_0_10px_#dbec0a] animate-twinkle animation-delay-3000" />
        <div className="absolute top-[65%] right-[8%] w-1 h-1 rounded-full bg-[#dbec0a]/40 shadow-[0_0_6px_#dbec0a] animate-twinkle animation-delay-2000" />

        {/* Mesh overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTksMjM2LDEwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 max-w-3xl font-[Cairo,sans-serif]">
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#dbec0a] via-[#c5d909] to-[#dbec0a] rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-slow" />
            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-4 border border-[#dbec0a]/20 hover:border-[#dbec0a]/40 transition-all">
              <Image
                src={APP_LOGO_PATH}
                alt={APP_NAME}
                width={56}
                height={56}
                className="object-contain drop-shadow-[0_0_15px_rgba(219,236,10,0.5)]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10 space-y-6">
          {/* Success Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#dbec0a] to-[#c5d909] rounded-full blur-2xl opacity-50 animate-pulse-slow" />
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#dbec0a] via-[#c5d909] to-[#b8c908] shadow-2xl shadow-[#dbec0a]/30">
              <CheckCircle2 className="w-12 h-12 text-black drop-shadow-lg" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-[#dbec0a] animate-bounce drop-shadow-[0_0_8px_rgba(219,236,10,0.8)]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                شكراً لك{sale.customer?.name ? ` ` : ''}
              </span>
              {sale.customer?.name && (
                <span className="bg-gradient-to-r from-[#dbec0a] via-[#e8f54a] to-[#dbec0a] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(219,236,10,0.5)]">
                  {sale.customer.name}
                </span>
              )}
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                !
              </span>
            </h1>
            <p className="text-gray-400 text-lg font-medium">
              تم استلام طلبك بنجاح وجاري تجهيزه
            </p>
          </div>

          {/* Order Number & Status Pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#dbec0a]/40 to-[#c5d909]/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#dbec0a]/30 transition-all">
                <span className="text-gray-400 text-sm">رقم الطلب</span>
                <span className="mr-2 text-white font-bold text-lg tracking-wide">
                  {sale.orderNo}
                </span>
              </div>
            </div>
            <div
              className={`px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/10 ${status.bg}`}>
              <span className={`font-bold ${status.color}`}>
                {getArabicStatus(sale.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] blur-xl" />
          <div className="relative backdrop-blur-2xl bg-white/[0.03] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
            {/* Order Items */}
            <div className="p-6 sm:p-8 border-b border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#dbec0a]/20 to-[#c5d909]/20 border border-[#dbec0a]/20">
                  <Package className="w-5 h-5 text-[#dbec0a]" />
                </div>
                <h2 className="text-xl font-bold text-white">المنتجات</h2>
                <span className="mr-auto px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm font-medium">
                  {totalItems} {totalItems === 1 ? 'منتج' : 'منتجات'}
                </span>
              </div>

              <div className="space-y-3">
                {sale.lines.map((line, idx) => {
                  const imageUrl = line.product.images
                    ? typeof line.product.images === 'string'
                      ? line.product.images.split(',')[0]
                      : ''
                    : null;

                  return (
                    <div
                      key={idx}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#dbec0a]/20 transition-all duration-300">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 flex-shrink-0 border border-white/10">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={line.product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#dbec0a]/20 to-[#c5d909]/20">
                            <Gift className="w-8 h-8 text-[#dbec0a]/60" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate text-sm sm:text-base">
                          {line.product.brand} {line.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {[line.product.flavor, line.product.size]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          الكمية: {line.quantity} × {line.unitPrice.toFixed(2)}{' '}
                          دينار
                        </p>
                      </div>

                      {/* Line Total */}
                      <div className="text-left flex-shrink-0">
                        <p className="text-lg sm:text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {line.lineTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">دينار</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#dbec0a]" />
                ملخص الطلب
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع ال�?رعي</span>
                  <span className="font-medium text-gray-300">
                    {sale.subtotal.toFixed(2)} دينار
                  </span>
                </div>
                {sale.discounts > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      الخصم
                    </span>
                    <span className="font-bold">
                      -{sale.discounts.toFixed(2)} دينار
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>رسوم التوصيل</span>
                  <span className="font-medium text-gray-300">
                    {shippingFee.toFixed(2)} دينار
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-white">
                    المجموع الكلي
                  </span>
                  <div className="text-left">
                    <span className="text-3xl font-black bg-gradient-to-r from-[#dbec0a] via-[#e8f54a] to-[#dbec0a] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(219,236,10,0.4)]">
                      {actualTotal.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-sm mr-2">دينار</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6">
              {/* Delivery Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-bold">معلومات التوصيل</span>
                </div>
                <div className="space-y-2 text-sm pr-8">
                  {shipping.deliveryMethod === 'pickup' ? (
                    <div className="text-gray-400">
                      <p className="text-gray-500 text-xs mb-1">
                        موقع الاستلام
                      </p>
                      <p className="text-gray-300">
                        {shipping.pickupLocation || 'الاستلام من المتجر'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <p className="text-gray-500 text-xs mb-1">
                        عنوان التوصيل
                      </p>
                      <p className="text-gray-300">
                        {shipping.address || 'غير محدد'}
                      </p>
                      {shipping.city && (
                        <p className="text-gray-500 text-sm">{shipping.city}</p>
                      )}
                    </div>
                  )}
                  {shipping.deliveryWindow && (
                    <div className="text-gray-400 mt-3">
                      <p className="text-gray-500 text-xs mb-1">موعد التوصيل</p>
                      <p className="text-gray-300">{shipping.deliveryWindow}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Date Info */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white font-bold">طريقة الد�?ع</span>
                  </div>
                  <p className="text-gray-300 text-sm pr-8">
                    {sale.paymentMethod === 'COD'
                      ? 'الد�?ع عند الاستلام'
                      : sale.paymentMethod}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-white font-bold">تاريخ الطلب</span>
                  </div>
                  <p className="text-gray-300 text-sm pr-8">
                    {new Date(sale.date).toLocaleDateString('ar-JO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {shipping.notes && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-500 mb-1">ملاحظات</p>
                  <p className="text-gray-300">{shipping.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Sparkles className="w-4 h-4 text-[#dbec0a]" />
            <p className="text-sm">لديك أسئلة حول طلبك؟ تواصل معنا للمساعدة</p>
            <Sparkles className="w-4 h-4 text-[#dbec0a]" />
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} {APP_NAME}. جميع الحقوق مح�?وظة
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

// Helper function for Arabic status labels
function getArabicStatus(status: string): string {
  const arabicStatuses: Record<string, string> = {
    DRAFT: 'قيد المعالجة',
    AWAITING_SUPPLIER: 'قيد التحضير',
    SUPPLIER_CONFIRMED: 'تم التأكيد',
    AWAITING_DELIVERY: 'جاهز للشحن',
    OUT_FOR_DELIVERY: '�?ي الطريق',
    DELIVERED: 'تم التوصيل',
    CANCELED: 'ملغي',
    RETURNED: 'مرتجع',
  };
  return arabicStatuses[status] || status;
}


