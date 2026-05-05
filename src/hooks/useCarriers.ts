import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Carrier, StatePrice } from '../types';

export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [statePrices, setStatePrices] = useState<StatePrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transportadoras'));
    const unsubscribeCarriers = onSnapshot(q, (snapshot) => {
      const loaded: Carrier[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Carrier);
      });
      setCarriers(loaded);
    }, (error) => {
      console.error("Error loading carriers:", error);
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
    });

    return () => {
      unsubscribeCarriers();
      unsubscribePrices();
    };
  }, []);

  const getAveragePriceForState = (state: string) => {
    const statePrice = statePrices.find(sp => sp.id === state);
    return statePrice ? statePrice.price : 0;
  };

  return { carriers, statePrices, loading, getAveragePriceForState };
}
