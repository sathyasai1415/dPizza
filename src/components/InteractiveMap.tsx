import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, Clock, ExternalLink, MapPin, Zap } from 'lucide-react';
import { MARKETPLACE_STORES, MarketplaceStore } from '../data/marketplace';
import { PizzaConfig } from '../types';

// Detroit bounding box for x/y % → real lat/lng
const SW = { lat: 42.25, lng: -83.35 };
const NE = { lat: 42.45, lng: -82.90 };

function toLatLng(x: number, y: number): [number, number] {
  return [
    NE.lat - (y / 100) * (NE.lat - SW.lat),
    SW.lng + (x / 100) * (NE.lng - SW.lng),
  ];
}

function computePrice(basePrice: number, config: PizzaConfig | null): number {
  if (!config) return basePrice;
  const sizeDelta =
    config.size === 'Small' ? -3 :
    config.size === 'Large' ? 3 :
    config.size === 'Extra Large' ? 6 : 0;
  const toppingDelta = ((config.meats?.length || 0) + (config.veggies?.length || 0)) * 0.8;
  return parseFloat((basePrice + sizeDelta + toppingDelta).toFixed(2));
}

function createPriceIcon(store: MarketplaceStore, price: number, isSelected: boolean, isCheapest: boolean): L.DivIcon {
  const bg = isSelected ? '#ef4444' : isCheapest ? '#22c55e' : store.isFeatured ? '#f97316' : '#64748b';
  const scale = isSelected ? 'transform:scale(1.15);' : '';
  const html = `
    <div style="position:relative;display:inline-block;${scale}transition:transform 0.2s;">
      <div style="
        background:${bg};
        color:white;
        font-weight:900;
        font-family:system-ui,sans-serif;
        font-size:11px;
        padding:5px 10px;
        border-radius:20px;
        white-space:nowrap;
        box-shadow:0 4px 16px rgba(0,0,0,0.6),0 0 0 2px rgba(255,255,255,0.15);
        position:relative;
        z-index:1;
        cursor:pointer;
      ">
        🍕 $${price.toFixed(2)}
        ${isCheapest ? '<span style="font-size:8px;margin-left:3px;opacity:0.9">✓</span>' : ''}
      </div>
      <div style="
        position:absolute;bottom:-5px;left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${bg};
        z-index:1;
      "></div>
    </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [90, 36],
    iconAnchor: [45, 41],
    popupAnchor: [0, -44],
  });
}

interface InteractiveMapProps {
  config: PizzaConfig | null;
  onSelectStore: (storeId: string) => void;
  onCompare: (config: PizzaConfig) => void;
  onOpenStore?: (store: MarketplaceStore) => void;
}

export function InteractiveMap({ config, onSelectStore, onOpenStore }: InteractiveMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enriched = MARKETPLACE_STORES.map(s => {
    const basePizza = s.menu.find(m => m.category === 'pizza');
    const price = computePrice(basePizza?.price ?? 14.99, config);
    return { ...s, price, latlng: toLatLng(s.coordinates.x, s.coordinates.y) as [number, number] };
  });

  const minPrice = Math.min(...enriched.map(s => s.price));
  const sorted = [...enriched].sort((a, b) => a.price - b.price);

  function handleSelect(store: typeof enriched[0]) {
    setSelectedId(store.id);
    onSelectStore(store.id);
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ height: 480 }}>
      {/* Leaflet dark-theme overrides */}
      <style>{`
        .leaflet-container { background: #0d1117 !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(10,10,16,0.97) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 18px !important;
          box-shadow: 0 24px 48px rgba(0,0,0,0.9) !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-popup-content { margin: 0 !important; color: white; }
        .leaflet-popup-close-button {
          color: rgba(255,255,255,0.5) !important;
          top: 10px !important; right: 10px !important;
          font-size: 20px !important; z-index: 10;
        }
        .leaflet-popup-close-button:hover { color: white !important; }
        .leaflet-control-zoom a {
          background: rgba(10,10,16,0.95) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.7) !important;
        }
        .leaflet-control-zoom a:hover { color: #ef4444 !important; }
        .leaflet-bar { border-color: rgba(255,255,255,0.1) !important; border-radius: 12px !important; overflow: hidden; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: rgba(255,255,255,0.3) !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
      `}</style>

      <MapContainer
        center={[42.3314, -83.0458]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* CartoDB Dark Matter tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Delivery radius */}
        <Circle
          center={[42.3314, -83.0458]}
          radius={4500}
          pathOptions={{
            color: '#ef4444', fillColor: '#ef4444',
            fillOpacity: 0.04, weight: 1.5, dashArray: '6 5',
          }}
        />

        {enriched.map(store => (
          <Marker
            key={store.id}
            position={store.latlng}
            icon={createPriceIcon(store, store.price, selectedId === store.id, store.price === minPrice)}
            eventHandlers={{
              click: () => handleSelect(store),
            }}
          >
            <Popup maxWidth={300} minWidth={260}>
              {/* Popup card — inline styles for reliability inside Leaflet portal */}
              <div style={{ padding: '16px', minWidth: 240 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}
                    className={store.logoColor}
                  >
                    {store.id === 'shamz'
                      ? <img src="/shamz-pizza-store.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Shamz" />
                      : store.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 900, color: 'white', fontSize: 14, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {store.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ color: '#facc15', fontSize: 10, fontWeight: 700 }}>★ {store.rating}</span>
                      <span style={{ color: '#44444f' }}>·</span>
                      <span style={{ color: '#8b8b9a', fontSize: 10 }}>⏱ {store.deliveryTime}m</span>
                      {store.deliveryFee === 0 && (
                        <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 700 }}>Free Delivery</span>
                      )}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: 10, margin: '3px 0 0' }}>{store.neighborhood} · {store.distance}mi away</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: 18, color: store.price === minPrice ? '#4ade80' : 'white', margin: 0 }}>
                      ${store.price.toFixed(2)}
                    </p>
                    {store.price === minPrice && (
                      <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>LOWEST</span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                {store.badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {store.badges.slice(0, 3).map(b => (
                      <span key={b} style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#d1d5db',
                      }}>{b}</span>
                    ))}
                  </div>
                )}

                {/* Popular items */}
                <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  Popular
                </p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                  {store.popularItems.slice(0, 2).map(item => (
                    <span key={item} style={{
                      fontSize: 10, color: '#d1d5db',
                      background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 8,
                    }}>{item}</span>
                  ))}
                </div>

                {/* Deal teaser */}
                {store.promotedDeal && (
                  <div style={{
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 10, padding: '6px 10px', marginBottom: 12,
                    fontSize: 10, color: '#4ade80', fontWeight: 700,
                  }}>
                    🏷️ {store.promotedDeal}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onOpenStore?.(store)}
                    style={{
                      flex: 1, background: '#ef4444', color: 'white',
                      fontWeight: 900, fontSize: 11, padding: '9px 0',
                      borderRadius: 12, border: 'none', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ef4444')}
                  >
                    View Menu & Order →
                  </button>
                  {store.phone && (
                    <a
                      href={`tel:${store.phone}`}
                      style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12, color: '#9ca3af', textDecoration: 'none', fontSize: 14,
                      }}
                    >
                      📞
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Price ranking strip */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 1000, pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(5,5,10,0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '8px 12px',
          overflowX: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          scrollbarWidth: 'none',
        }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Price Rank
          </span>
          {sorted.slice(0, 8).map((s, i) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 10, border: 'none',
                background: selectedId === s.id ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                outline: selectedId === s.id ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', flexShrink: 0, pointerEvents: 'auto', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 900, color: '#6b7280' }}>#{i + 1}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: i === 0 ? '#4ade80' : 'white' }}>
                ${s.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}>
        <div style={{
          background: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: '#22c55e' }} />
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>Lowest Price</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: '#f97316' }} />
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>Featured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: '#ef4444' }} />
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>Selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: '#64748b' }} />
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
