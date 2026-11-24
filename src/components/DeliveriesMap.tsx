import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon';
import RadiusInput from './RadiusInput';
import { DeliveryGeo, DeliveryMapItem, nearbyDeliveries } from '../utils/deliveryGeo';

// Mapa da Tabela de Entregas: divisa dos estados, um ponto por entrega e, ao escolher uma,
// o círculo do raio com a lista das entregas que caem dentro dele. Dá pra aproximar até a rua.
// As coordenadas e o raio vêm da Tabela (src/utils/deliveryGeo.ts).

interface Props {
  items: DeliveryMapItem[];
  coords: Record<string, DeliveryGeo>;
  failed: Record<string, string>;
  progress: { done: number; total: number } | null;
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  initialSelectedId?: string | null;
  onClose: () => void;
}

// Malha dos estados do IBGE (oficial, grátis); o código da área é o código IBGE da UF
const IBGE_STATES_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&intrarregiao=UF&qualidade=minima';
const UF_BY_IBGE_CODE: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};
let statesCache: any = null;

const formatDate = (iso?: string) => {
  if (!iso) return 'sem data';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const DeliveriesMap: React.FC<Props> = ({ items, coords, failed, progress, radiusKm, onRadiusChange, initialSelectedId, onClose }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  // Muda quando a caixa do mapa ganha/muda de tamanho (o Leaflet precisa medir de novo)
  const [mapSize, setMapSize] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

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
      maxZoom: 19,
      noWrap: true,
      bounds: southAmerica,
      attribution: '&copy; OpenStreetMap · Estados: IBGE',
    }).addTo(map);

    // Divisa dos estados por cima do mapa
    const statesPane = map.createPane('estados');
    statesPane.style.zIndex = '350';
    statesPane.style.pointerEvents = 'none';
    const drawStates = (geojson: any) => {
      if (!mapRef.current) return;
      L.geoJSON(geojson, {
        pane: 'estados',
        style: { color: '#92400e', weight: 1.6, opacity: 0.8, fill: false },
        onEachFeature: (feature, layer) => {
          const uf = UF_BY_IBGE_CODE[String(feature?.properties?.codarea)];
          if (uf) layer.bindTooltip(uf, { permanent: true, direction: 'center', className: 'uf-label' });
        },
      }).addTo(map);
    };
    if (statesCache) drawStates(statesCache);
    else fetch(IBGE_STATES_URL).then(r => r.json()).then(g => { statesCache = g; drawStates(g); }).catch(() => { /* sem divisa: o mapa funciona igual */ });

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
  const nearbyById = useMemo(() => nearbyDeliveries(items, coords, radiusKm), [items, coords, radiusKm]);
  const nearby = selected ? nearbyById[selected.id] || [] : [];

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
      L.circleMarker([c.lat, c.lng], {
        radius: isSelected ? 10 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: isSelected ? '#dc2626' : isNear ? '#d97706' : '#1f2937',
        fillOpacity: 0.95,
      })
        .bindTooltip(`${it.name} — ${formatDate(it.deliveryDate)}`)
        .on('click', () => setSelectedId(it.id))
        .addTo(layer);
    });

    if (!fittedRef.current && located.length > 0 && map.getSize().x > 0 && map.getSize().y > 0 && !selected) {
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
    fittedRef.current = true;
  }, [selectedId, radiusKm, mapSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomToStreet = (id: string) => {
    const c = coords[id];
    if (c && mapRef.current) mapRef.current.setView([c.lat, c.lng], 17);
  };

  const notLocated = items.filter(it => !coords[it.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch justify-center p-2 sm:p-6 print-hidden" onClick={onClose}>
      <style>{`.uf-label{background:transparent;border:0;box-shadow:none;color:#92400e;font-weight:800;font-size:11px;padding:0}.uf-label:before{display:none}`}</style>
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
              <RadiusInput value={radiusKm} onChange={onRadiusChange} />
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
                <p className="text-gray-500 dark:text-gray-400 mb-2">{formatDate(selected.deliveryDate)} · {selected.address}</p>
                <button
                  type="button"
                  onClick={() => zoomToStreet(selected.id)}
                  className="mb-3 px-3 py-1 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Icon name="pin" /> Ver a rua
                </button>
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
                        {(nearbyById[it.id]?.length || 0) > 0 && (
                          <span className="float-right text-xs font-bold text-amber-700 dark:text-amber-400">{nearbyById[it.id].length} perto</span>
                        )}
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
