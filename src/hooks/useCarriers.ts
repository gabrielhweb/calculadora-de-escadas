import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Carrier, StatePrice } from '../types';
import { useAuth } from '../components/AuthProvider';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [statePrices, setStatePrices] = useState<StatePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
       setLoading(false);
       return;
    }

    const q = query(collection(db, 'transportadoras'));
    const unsubscribeCarriers = onSnapshot(q, (snapshot) => {
      const loaded: Carrier[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Carrier);
      });
      setCarriers(loaded);
    }, (error) => {
      console.error("Error loading carriers:", error);
      try {
          handleFirestoreError(error, OperationType.LIST, 'transportadoras');
      } catch(e) {
          console.error(e);
      }
    });

    const qPrices = query(collection(db, 'state_prices'));
    const unsubscribePrices = onSnapshot(qPrices, (snapshot) => {
      const loaded: StatePrice[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as StatePrice);
      });
      setStatePrices(loaded);
      setLoading(false);
    }, (error) => {
      console.error("Error loading prices:", error);
      setLoading(false);
      try {
          handleFirestoreError(error, OperationType.LIST, 'state_prices');
      } catch(e) {
          console.error(e);
      }
    });

    return () => {
      unsubscribeCarriers();
      unsubscribePrices();
    };
  }, [user]);

  const getAveragePriceForState = (state: string) => {
    const statePrice = statePrices.find(sp => sp.id === state);
    return statePrice ? statePrice.price : 0;
  };

  return { carriers, statePrices, loading, getAveragePriceForState };
}
