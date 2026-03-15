import { useSyncExternalStore } from 'react';

/**
 * Subscribes to the Page Visibility API via useSyncExternalStore
 * for tear-free, concurrent-safe visibility tracking.
 */
function subscribeToVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => {
    document.removeEventListener('visibilitychange', callback);
  };
}

function getVisibilitySnapshot() {
  return document.visibilityState === 'visible';
}

function getServerSnapshot() {
  return true;
}

export function useIsVisible() {
  return useSyncExternalStore(
    subscribeToVisibility,
    getVisibilitySnapshot,
    getServerSnapshot
  );
}
