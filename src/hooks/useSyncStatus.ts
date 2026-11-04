import { useSyncExternalStore } from 'react';
import { getSyncStatus, subscribeSyncStatus } from '../lib/sync';

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus);
}
