import { describe, expect, it, vi } from 'vitest';
import {
  clearLocalDraftStorage,
  getLocalDraftStorageKeys,
} from '@/lib/client-storage';

describe('getLocalDraftStorageKeys', () => {
  it('returns only controlplane draft keys', () => {
    expect(
      getLocalDraftStorageKeys([
        'controlplane:new-sale-draft:v1',
        'controlplane-lang',
        'cortex_brain_memory_v1',
        'controlplane:inventory-draft:v2',
        'pwa-install-dismissed',
      ]),
    ).toEqual([
      'controlplane:new-sale-draft:v1',
      'controlplane:inventory-draft:v2',
    ]);
  });
});

describe('clearLocalDraftStorage', () => {
  it('removes only matching draft keys from storage', () => {
    const removeItem = vi.fn();
    const storage = {
      length: 4,
      key: vi
        .fn()
        .mockReturnValueOnce('controlplane:new-sale-draft:v1')
        .mockReturnValueOnce('controlplane-lang')
        .mockReturnValueOnce('controlplane:inventory-draft:v2')
        .mockReturnValueOnce('cortex_brain_memory_v1'),
      removeItem,
    };

    expect(clearLocalDraftStorage(storage)).toEqual([
      'controlplane:new-sale-draft:v1',
      'controlplane:inventory-draft:v2',
    ]);
    expect(removeItem).toHaveBeenNthCalledWith(
      1,
      'controlplane:new-sale-draft:v1',
    );
    expect(removeItem).toHaveBeenNthCalledWith(
      2,
      'controlplane:inventory-draft:v2',
    );
  });
});
