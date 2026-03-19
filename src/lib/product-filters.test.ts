import { describe, expect, it } from 'vitest';
import {
  LOW_STOCK_THRESHOLD,
  getProductFulfillmentMode,
  matchesProductFulfillmentMode,
  matchesProductStatus,
  matchesProductStock,
} from '@/lib/product-filters';

describe('product filters', () => {
  it('detects on-demand fulfillment mode from product attributes', () => {
    expect(
      getProductFulfillmentMode({ fulfillmentMode: 'on-demand' }),
    ).toBe('on-demand');
    expect(getProductFulfillmentMode({ fulfillmentMode: 'limited' })).toBe(
      'limited',
    );
    expect(getProductFulfillmentMode(null)).toBe('limited');
  });

  it('matches fulfillment filters case-insensitively', () => {
    expect(
      matchesProductFulfillmentMode({ fulfillmentMode: 'on-demand' }, 'ON-demand'),
    ).toBe(true);
    expect(
      matchesProductFulfillmentMode({ fulfillmentMode: 'on-demand' }, 'limited'),
    ).toBe(false);
  });

  it('matches active and inactive product filters', () => {
    expect(matchesProductStatus(true, 'active')).toBe(true);
    expect(matchesProductStatus(true, 'inactive')).toBe(false);
    expect(matchesProductStatus(false, 'inactive')).toBe(true);
    expect(matchesProductStatus(false, 'all')).toBe(true);
  });

  it('filters limited inventory by stock level', () => {
    expect(matchesProductStock(LOW_STOCK_THRESHOLD + 2, {}, 'in-stock')).toBe(
      true,
    );
    expect(matchesProductStock(LOW_STOCK_THRESHOLD, {}, 'low-stock')).toBe(
      true,
    );
    expect(matchesProductStock(0, {}, 'out-of-stock')).toBe(true);
  });

  it('excludes on-demand items from stock-only filters', () => {
    expect(
      matchesProductStock(0, { fulfillmentMode: 'on-demand' }, 'low-stock'),
    ).toBe(false);
    expect(
      matchesProductStock(0, { fulfillmentMode: 'on-demand' }, 'out-of-stock'),
    ).toBe(false);
  });
});
