import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth } from '../firebase';
import Icon from './Icon';

// Mapa da Tabela de Entregas: um ponto por entrega e, ao escolher uma, o círculo do raio
// (padrão 40 km, editável) com a lista das entregas que caem dentro dele.
// As coordenadas vêm do CEP/endereço (api/geocode) e ficam salvas no contrato (deliveryGeo),
// junto com o endereço usado: se o endereço mudar, busca de novo.

export interface DeliveryGeo { lat: number; lng: number; key: string; label?: string }

export interface DeliveryMapItem {
  id: string;
  name: string;
  address: string;
  zip?: string;
  deliveryDate?: string;
  geo?: DeliveryGeo;
}

interface Props {
  items: DeliveryMapItem[];
  onClose: () => void;
  onSaveGeo: (id: string, geo: DeliveryGeo) => void;
}

const RADIUS_STORAGE_KEY = 'entregas_raio_km';
const DEFAULT_RADIUS_KM = 40;

const geoKey = (item: DeliveryMapItem) => `${(item.zip || '').replace(/\D/g, '')}|${item.address.trim().toLowerCase()}`;

// Distância em linha reta (km) entre dois pontos
const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatDate = (iso?: string) => {
  if (!iso) return 'sem data';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const DeliveriesMap: React.FC<Props> = ({ items, onClose, onSaveGeo }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  // Muda quando a caixa do mapa ganha/muda de tamanho (o Leaflet precisa medir de novo)
  const [mapSize, setMapSize] = useState(0);

  // Coordenadas já conhecidas (salvas no contrato com o mesmo endereço) + as achadas agora
  const [coords, setCoords] = useState<Record<string, DeliveryGeo>>(() => {
    const initial: Record<string, DeliveryGeo> = {};
    items.forEach(it => { if (it.geo && it.geo.key === geoKey(it)) initial[it.id] = it.geo; });
    return initial;
  });
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(RADIUS_STORAGE_KEY));
      return saved > 0 ? saved : DEFAULT_RADIUS_KM;
    } catch {
      return DEFAULT_RADIUS_KM;
    }
  });

  // Busca as coordenadas que faltam, uma de cada vez (o serviço de mapas pede calma)
  useEffect(() => {
    let cancelled = false;
    const missing = items.filter(it => !coords[it.id] && (it.address.trim() || it.zip));
    if (missing.length === 0) return;
    (async () => {
      setProgress({ done: 0, total: missing.length });
      for (let i = 0; i < missing.length; i++) {
        if (cancelled) return;
        const it = missing[i];
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ address: it.address, zip: it.zip }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || typeof data.lat !== 'number') throw new Error(data.error || 'não encontrado');
          const geo: DeliveryGeo = { lat: data.lat, lng: data.lng, key: geoKey(it), label: data.label };
          if (cancelled) return;
          setCoords(prev => ({ ...prev, [it.id]: geo }));
          onSaveGeo(it.id, geo);
        } catch (e: any) {
          if (!cancelled) setFailed(prev => ({ ...prev, [it.id]: e?.message || 'erro' }));
        }
        if (!cancelled) setProgress({ done: i + 1, total: missing.length });
      }
      if (!cancelled) setProgress(null);
    })();
    return () => { cancelled = true; };
    // Só ao abrir o mapa: novas entregas aparecem na próxima vez que abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cria o mapa uma vez
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    // Só América do Sul: abre no Brasil e não deixa afastar nem arrastar pra outros continentes
    const southAmerica = L.latLngBounds([-56, -85], [14, -30]);
    const map = L.map(mapDivRef.current, {
      maxBounds: southAmerica,
      maxBoundsViscosity: 1,
      minZoom: 4,
    }).setView([-15, -50], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      noWrap: true,
      bounds: southAmerica,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      setMapSize(map.getSize().x * 10000 + map.getSize().y);
    });
    observer.observe(mapDivRef.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  const located = useMemo(() => items.filter(it => coords[it.id]), [items, coords]);
  const selected = selectedId && coords[selectedId] ? items.find(it => it.id === selectedId) || null : null;

  const nearby = useMemo(() => {
    if (!selected) return [];
    const center = coords[selected.id];
    return located
      .filter(it => it.id !== selected.id)
      .map(it => ({ item: it, km: distanceKm(center, coords[it.id]) }))
      .filter(x => x.km <= radiusKm)
      .sort((a, b) => a.km - b.km);
  }, [selected, located, coords, radiusKm]);

  // Desenha pontos e círculo sempre que algo muda
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const nearbyIds = new Set(nearby.map(n => n.item.id));

    if (selected) {
      L.circle([coords[selected.id].lat, coords[selected.id].lng], {
        radius: radiusKm * 1000,
        color: '#d97706',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
      }).addTo(layer);
    }

    located.forEach(it => {
      const c = coords[it.id];
      const isSelected = selected?.id === it.id;
      const isNear = nearbyIds.has(it.id);
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: isSelected ? 10 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: isSelected ? '#dc2626' : isNear ? '#d97706' : '#1f2937',
        fillOpacity: 0.95,
      })
        .bindTooltip(`${it.name} — ${formatDate(it.deliveryDate)}`)
        .on('click', () => setSelectedId(it.id));
      marker.addTo(layer);
    });

    if (!fittedRef.current && located.length > 0 && map.getSize().x > 0 && map.getSize().y > 0) {
      const bounds = L.latLngBounds(located.map(it => [coords[it.id].lat, coords[it.id].lng] as [number, number]));
      map.fitBounds(bounds.pad(0.2), { maxZoom: 11 });
      if (!progress) fittedRef.current = true;
    }
  }, [located, coords, selected, nearby, radiusKm, progress, mapSize]);

  // Ao escolher uma entrega, enquadra o círculo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected || map.getSize().x === 0 || map.getSize().y === 0) return;
    const c = coords[selected.id];
    map.fitBounds(L.latLng(c.lat, c.lng).toBounds(radiusKm * 2000).pad(0.1));
  }, [selectedId, radiusKm, mapSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeRadius = (value: number) => {
    const v = value > 0 ? value : DEFAULT_RADIUS_KM;
    setRadiusKm(v);
    try { localStorage.setItem(RADIUS_STORAGE_KEY, String(v)); } catch { /* sem armazenamento: vale só agora */ }
  };

  const notLocated = items.filter(it => !coords[it.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch justify-center p-2 sm:p-6 print-hidden" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-7xl flex flex-col shadow-2xl border border-gray-300 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="pin" /> Mapa das Entregas
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Raio
              <input
                type="number"
                min={1}
                value={radiusKm}
                onChange={e => changeRadius(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              km
            </label>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div ref={mapDivRef} className="flex-1 min-h-[50vh] md:min-h-0" />

          <aside className="md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[40vh] md:max-h-none text-sm">
            {progress && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-800">
                Localizando endereços... {progress.done}/{progress.total}
              </div>
            )}

            {selected ? (
              <div className="p-4">
                <button type="button" onClick={() => setSelectedId(null)} className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                  ← Ver todas
                </button>
                <p className="font-bold text-gray-900 dark:text-white">{selected.name}</p>
                <p className="text-gray-500 dark:text-gray-400 mb-3">{formatDate(selected.deliveryDate)} · {selected.address}</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {nearby.length === 0
                    ? `Nenhuma outra entrega até ${radiusKm} km`
                    : `${nearby.length} ${nearby.length === 1 ? 'entrega' : 'entregas'} até ${radiusKm} km (em linha reta)`}
                </p>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {nearby.map(({ item, km }) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setSelectedId(item.id)} className="w-full text-left py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                        <span className="float-right font-bold text-amber-700 dark:text-amber-400">{km.toFixed(0)} km</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{formatDate(item.deliveryDate)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-gray-500 dark:text-gray-400 mb-2">Clique numa entrega (no mapa ou aqui) pra ver quem está perto.</p>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {located.map(it => (
                    <li key={it.id}>
                      <button type="button" onClick={() => setSelectedId(it.id)} className="w-full text-left py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span className="font-semibold text-gray-900 dark:text-white">{it.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{formatDate(it.deliveryDate)} · {coords[it.id].label || it.address}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {notLocated.length > 0 && !progress && (
                  <div className="mt-4">
                    <p className="font-bold text-red-700 dark:text-red-400 mb-1">Fora do mapa ({notLocated.length})</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {notLocated.map(it => (
                        <li key={it.id}>
                          <strong>{it.name}</strong>: {it.address.trim() || it.zip ? (failed[it.id] || 'endereço não encontrado') : 'sem endereço'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DeliveriesMap;
