export type ProductFulfillmentMode = 'limited' | 'on-demand';

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
