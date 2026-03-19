export type ProductFulfillmentMode = 'limited' | 'on-demand';
export type ProductStatusFilter = 'active' | 'inactive';
export type ProductStockFilter = 'in-stock' | 'low-stock' | 'out-of-stock';

export const LOW_STOCK_THRESHOLD = 5;

export function getProductFulfillmentMode(
  attributes: unknown,
): ProductFulfillmentMode {
  if (
    attributes &&
    typeof attributes === 'object' &&
    !Array.isArray(attributes) &&
    attributes !== null &&
    'fulfillmentMode' in attributes &&
    attributes.fulfillmentMode === 'on-demand'
  ) {
    return 'on-demand';
  }

  return 'limited';
}

export function matchesProductFulfillmentMode(
  attributes: unknown,
  filter: string | null | undefined,
) {
  const normalizedFilter = filter?.toLowerCase();

  if (!normalizedFilter || normalizedFilter === 'all') {
    return true;
  }

  return getProductFulfillmentMode(attributes) === normalizedFilter;
}

export function matchesProductStatus(
  active: boolean,
  filter: string | null | undefined,
) {
  const normalizedFilter = filter?.toLowerCase();

  if (!normalizedFilter || normalizedFilter === 'all') {
    return true;
  }

  if (normalizedFilter === 'active') {
    return active;
  }

  if (normalizedFilter === 'inactive') {
    return !active;
  }

  return true;
}

export function matchesProductStock(
  quantity: number,
  attributes: unknown,
  filter: string | null | undefined,
) {
  const normalizedFilter = filter?.toLowerCase();
  const fulfillmentMode = getProductFulfillmentMode(attributes);

  if (!normalizedFilter || normalizedFilter === 'all') {
    return true;
  }

  if (fulfillmentMode !== 'limited') {
    return false;
  }

  if (normalizedFilter === 'in-stock') {
    return quantity > LOW_STOCK_THRESHOLD;
  }

  if (normalizedFilter === 'low-stock') {
    return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
  }

  if (normalizedFilter === 'out-of-stock') {
    return quantity <= 0;
  }

  return true;
}
