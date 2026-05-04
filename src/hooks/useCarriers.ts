import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Carrier } from '../types';

export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transportadoras'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Carrier[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Carrier);
      });
      setCarriers(loaded);
      setLoading(false);
    }, (error) => {
      console.error("Error loading carriers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAveragePriceForState = (state: string) => {
    const matchedCarriers = carriers.filter(c => c.statesServed && c.statesServed.includes(state) && c.averagePrice > 0);
    if (matchedCarriers.length === 0) return 0;

    const sum = matchedCarriers.reduce((acc, curr) => acc + curr.averagePrice, 0);
    return sum / matchedCarriers.length;
  };

  return { carriers, loading, getAveragePriceForState };
}
