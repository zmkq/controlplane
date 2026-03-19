type FeatureFlagInputs = {
  IMGBB_API_KEY?: string | null;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string | null;
  VAPID_PUBLIC_KEY?: string | null;
  VAPID_PRIVATE_KEY?: string | null;
};

function hasValue(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function deriveFeatureFlags(inputs: FeatureFlagInputs) {
  return {
    imageUpload: hasValue(inputs.IMGBB_API_KEY),
    pushNotifications:
      hasValue(inputs.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
      hasValue(inputs.VAPID_PUBLIC_KEY) &&
      hasValue(inputs.VAPID_PRIVATE_KEY),
  };
}
