import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { createSeed, STORAGE_KEY, validStore } from '@/lib/finance';
import type { Budget, Holding, RecordKind, Store, Transaction } from '@/types/finance';

type FinanceContextValue = {
  store: Store | null;
  loading: boolean;
  storageIssue: string | null;
  unreadable: boolean;
  reload: () => Promise<void>;
  saveRecord: (kind: RecordKind, item: Transaction | Budget | Holding) => Promise<boolean>;
  deleteRecord: (kind: RecordKind, id: string) => Promise<void>;
  resetUnreadable: () => void;
};
const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageIssue, setStorageIssue] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const fresh = createSeed();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        setStore(fresh);
        setUnreadable(false);
        setStorageIssue(null);
      } else {
        const parsed: unknown = JSON.parse(raw);
        if (!validStore(parsed)) {
          setStore(null);
          setUnreadable(true);
          setStorageIssue('Saved data could not be read. Changes are paused so the original stays untouched.');
        } else {
          setStore(parsed);
          setUnreadable(false);
          setStorageIssue(null);
        }
      }
    } catch {
      setStorageIssue('On-device storage is unavailable. SAVMNY cannot save changes right now.');
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void reload(); }, [reload]);

  const persist = useCallback(async (next: Store) => {
    if (unreadable || !store) return false;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStore(next);
      setStorageIssue(null);
      return true;
    } catch {
      setStorageIssue('SAVMNY could not save on this device. Your last saved records remain unchanged.');
      return false;
    }
  }, [store, unreadable]);

  const saveRecord = useCallback(async (kind: RecordKind, item: Transaction | Budget | Holding) => {
    if (!store || unreadable) return false;
    let next: Store;
    if (kind === 'transaction') {
      const value = item as Transaction;
      const exists = store.transactions.some(row => row.id === value.id);
      next = { ...store, transactions: exists ? store.transactions.map(row => row.id === value.id ? value : row) : [value, ...store.transactions] };
    } else if (kind === 'budget') {
      const value = item as Budget;
      const exists = store.budgets.some(row => row.id === value.id);
      next = { ...store, budgets: exists ? store.budgets.map(row => row.id === value.id ? value : row) : [...store.budgets, value] };
    } else {
      const value = item as Holding;
      const exists = store.holdings.some(row => row.id === value.id);
      next = { ...store, holdings: exists ? store.holdings.map(row => row.id === value.id ? value : row) : [...store.holdings, value] };
    }
    const ok = await persist(next);
    if (ok) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return ok;
  }, [persist, store, unreadable]);

  const deleteRecord = useCallback(async (kind: RecordKind, id: string) => {
    if (!store || unreadable) return;
    const label = kind === 'transaction' ? 'transaction' : kind === 'budget' ? 'budget' : 'holding';
    Alert.alert(`Delete ${label}?`, 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const next: Store = kind === 'transaction'
          ? { ...store, transactions: store.transactions.filter(row => row.id !== id) }
          : kind === 'budget'
            ? { ...store, budgets: store.budgets.filter(row => row.id !== id) }
            : { ...store, holdings: store.holdings.filter(row => row.id !== id) };
        void persist(next).then(ok => { if (ok) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); });
      } },
    ]);
  }, [persist, store, unreadable]);

  const resetUnreadable = useCallback(() => {
    Alert.alert('Replace unreadable data?', 'This permanently replaces the saved data on this device with the sample workspace.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace data', style: 'destructive', onPress: () => {
        const fresh = createSeed();
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).then(() => {
          setStore(fresh);
          setUnreadable(false);
          setStorageIssue(null);
        }).catch(() => setStorageIssue('Storage is still unavailable. The unreadable data has not been replaced.'));
      } },
    ]);
  }, []);

  const value = useMemo(() => ({ store, loading, storageIssue, unreadable, reload, saveRecord, deleteRecord, resetUnreadable }), [store, loading, storageIssue, unreadable, reload, saveRecord, deleteRecord, resetUnreadable]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('FinanceProvider must be wired at the app root.');
  return value;
}
