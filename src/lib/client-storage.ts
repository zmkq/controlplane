const LOCAL_DRAFT_KEY_PATTERN = /^controlplane:.*draft/i;

export function getLocalDraftStorageKeys(keys: Iterable<string>) {
  return Array.from(new Set(keys)).filter((key) =>
    LOCAL_DRAFT_KEY_PATTERN.test(key),
  );
}

export function clearLocalDraftStorage(
  storage: Pick<Storage, 'length' | 'key' | 'removeItem'>,
) {
  const keys = getLocalDraftStorageKeys(
    Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => Boolean(key),
    ),
  );

  keys.forEach((key) => storage.removeItem(key));

  return keys;
}
