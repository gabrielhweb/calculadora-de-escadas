import { useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../firebase';

// Localização das entregas (Tabela de Entregas e mapa).
// As coordenadas vêm do CEP/endereço (api/geocode) e ficam salvas no contrato (deliveryGeo),
// junto com o endereço usado (key): se o endereço mudar, busca de novo.

export interface DeliveryGeo { lat: number; lng: number; key: string; label?: string }

export interface DeliveryMapItem {
  id: string;
  name: string;
  address: string;
  zip?: string;
  number?: string;
  deliveryDate?: string;
  geo?: DeliveryGeo;
}

export const RADIUS_STORAGE_KEY = 'entregas_raio_km';
export const DEFAULT_RADIUS_KM = 40;

export const readSavedRadius = () => {
  try {
    const saved = Number(localStorage.getItem(RADIUS_STORAGE_KEY));
    return saved > 0 ? saved : DEFAULT_RADIUS_KM;
  } catch {
    return DEFAULT_RADIUS_KM;
  }
};

export const saveRadius = (km: number) => {
  try { localStorage.setItem(RADIUS_STORAGE_KEY, String(km)); } catch { /* sem armazenamento: vale só agora */ }
};

export const geoKey = (item: DeliveryMapItem) =>
  `${(item.zip || '').replace(/\D/g, '')}|${String(item.number || '').trim()}|${item.address.trim().toLowerCase()}`;

// Distância em linha reta (km) entre dois pontos
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Entregas a até radiusKm de cada entrega localizada, da mais perto pra mais longe
export const nearbyDeliveries = (items: DeliveryMapItem[], coords: Record<string, DeliveryGeo>, radiusKm: number) => {
  const located = items.filter(it => coords[it.id]);
  const result: Record<string, { item: DeliveryMapItem; km: number }[]> = {};
  located.forEach(a => {
    result[a.id] = located
      .filter(b => b.id !== a.id)
      .map(b => ({ item: b, km: distanceKm(coords[a.id], coords[b.id]) }))
      .filter(x => x.km <= radiusKm)
      .sort((x, y) => x.km - y.km);
  });
  return result;
};

// Busca, uma de cada vez (o serviço de mapas pede calma), as coordenadas que faltam
// e salva no contrato pelo onSaveGeo. Roda sozinho enquanto a tabela está aberta.
export const useDeliveryGeocoding = (
  items: DeliveryMapItem[],
  onSaveGeo: (id: string, geo: DeliveryGeo) => void,
  enabled: boolean,
) => {
  const [found, setFound] = useState<Record<string, DeliveryGeo>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const triedRef = useRef<Set<string>>(new Set());
  const runningRef = useRef(false);
  const unmountedRef = useRef(false);
  // Muda ao terminar uma rodada, pra conferir se apareceu endereço novo enquanto buscava
  const [round, setRound] = useState(0);

  useEffect(() => () => { unmountedRef.current = true; }, []);

  // Coordenadas válidas: as salvas no contrato com o mesmo endereço + as achadas agora
  const coords = useMemo(() => {
    const result: Record<string, DeliveryGeo> = {};
    items.forEach(it => {
      const key = geoKey(it);
      if (found[it.id]?.key === key) result[it.id] = found[it.id];
      else if (it.geo?.key === key) result[it.id] = it.geo;
    });
    return result;
  }, [items, found]);

  const missing = items.filter(it =>
    !coords[it.id] && (it.address.trim() || it.zip) && !triedRef.current.has(`${it.id}|${geoKey(it)}`));
  const missingSignature = missing.map(it => `${it.id}|${geoKey(it)}`).join(';');

  useEffect(() => {
    if (!enabled || runningRef.current || missing.length === 0) return;
    runningRef.current = true;
    const isGone = () => unmountedRef.current;
    (async () => {
      setProgress({ done: 0, total: missing.length });
      for (let i = 0; i < missing.length; i++) {
        if (isGone()) return;
        const it = missing[i];
        const key = geoKey(it);
        triedRef.current.add(`${it.id}|${key}`);
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ address: it.address, zip: it.zip, number: it.number }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || typeof data.lat !== 'number') throw new Error(data.error || 'não encontrado');
          const geo: DeliveryGeo = { lat: data.lat, lng: data.lng, key, label: data.label };
          if (isGone()) return;
          setFound(prev => ({ ...prev, [it.id]: geo }));
          onSaveGeo(it.id, geo);
        } catch (e: any) {
          if (!isGone()) setFailed(prev => ({ ...prev, [it.id]: e?.message || 'erro' }));
        }
        if (!isGone()) setProgress({ done: i + 1, total: missing.length });
      }
      runningRef.current = false;
      if (!isGone()) { setProgress(null); setRound(r => r + 1); }
    })();
    // Recomeça só quando aparece endereço novo pra localizar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, missingSignature, round]);

  return { coords, failed, progress };
};
