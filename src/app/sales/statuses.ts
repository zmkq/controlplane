export const saleStatuses = [
  'DRAFT',
  'AWAITING_SUPPLIER',
  'SUPPLIER_CONFIRMED',
  'AWAITING_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELED',
  'RETURNED',
] as const;

export type SaleStatus = (typeof saleStatuses)[number];
