// Dev-only shim for expo-keep-awake to avoid native errors like
// "Unable to activate keep awake" when permissions or activity are not available.
// Enable by setting environment variable NO_KEEP_AWAKE=1 before starting Metro.

export const ExpoKeepAwakeTag = "ExpoKeepAwakeDefaultTag";
export function useKeepAwake(): void {}
export async function activateKeepAwakeAsync(): Promise<void> {}
export async function activateKeepAwake(): Promise<void> {}
export async function deactivateKeepAwake(): Promise<void> {}
export function addListener(): { remove: () => void } {
  return { remove: () => {} };
}
export async function isAvailableAsync(): Promise<boolean> { return true; }
