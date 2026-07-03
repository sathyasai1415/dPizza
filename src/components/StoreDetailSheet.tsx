import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Star, Clock, MapPin, Phone,
  ShoppingCart, Tag, Copy, CheckCircle, Heart, ChevronRight,
} from 'lucide-react';
import { MarketplaceStore, MarketplaceMenuItem, StoreDeal } from '../data/marketplace';
import { CartItem } from '../types';
import { useApp } from '../store/AppContext';

interface StoreDetailSheetProps {
  store: MarketplaceStore | null;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect?: boolean) => void;
}

type TabId = 'menu' | 'deals' | 'info';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/25 text-stone-300 text-[10px] font-black px-3 py-1.5 rounded-lg transition-all"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : code}
    </button>
  );
}

function MenuItemCard({ item, storeId, storeName, onAddToCart }: {
  item: MarketplaceMenuItem;
  storeId: string;
  storeName: string;
  onAddToCart: (item: Omit<CartItem, 'id'>, redirect?: boolean) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart({
      store_id: storeId,
      store_name: storeName,
      item_name: item.name,
      config: { size: 'Large', crust: 'Hand Tossed', sauce: '', cheese: [], meats: [], veggies: [], extras: [], quantity: 1 },
      quantity: 1,
      price_per_item: item.price,
      total_price: item.price,
      delivery_type: 'store' as any,
      platform: 'store',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.imageColor} shrink-0 flex items-center justify-center text-xl shadow-lg`}>
        {item.category === 'pizza' ? '🍕' : item.category === 'sides' ? '🥖' : item.category === 'drinks' ? '🥤' : '🍰'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate">{item.name}</p>
          {item.isPopular && <span className="text-[8px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full shrink-0">🔥 Popular</span>}
        </div>
        <p className="text-[11px] text-stone-500 mt-0.5 truncate">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {item.tags.map(t => (
              <span key={t} className="text-[8px] font-bold text-stone-400 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-black text-white">${item.price.toFixed(2)}</span>
        <button
          onClick={handleAdd}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md ${
            added
              ? 'bg-green-600 text-white scale-95'
              : 'bg-red-600 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          {added ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: StoreDeal }) {
  return (
    <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/20 border border-green-500/20 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">{deal.badge}</span>
          <p className="text-sm font-black text-white mt-1.5">{deal.title}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">{deal.description}</p>
        </div>
        {deal.discountType === 'percent' && (
          <div className="bg-green-600 text-white font-black text-sm px-3 py-1.5 rounded-xl shrink-0">
            {deal.discountValue}% OFF
          </div>
        )}
        {deal.discountType === 'fixed' && (
          <div className="bg-blue-600 text-white font-black text-sm px-3 py-1.5 rounded-xl shrink-0">
            ${deal.discountValue} OFF
          </div>
        )}
        {(deal.discountType === 'bogo' || deal.discountType === 'free_delivery') && (
          <div className="bg-orange-600 text-white font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 text-center">
            {deal.discountType === 'bogo' ? 'BOGO' : 'FREE\nDELIVERY'}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Tag className="w-3 h-3 text-stone-500" />
        <span className="text-[10px] text-stone-500 font-bold mr-auto">Code:</span>
        <CopyButton code={deal.code} />
      </div>
      <p className="text-[9px] text-stone-600 mt-2">Expires {deal.expiresAt}</p>
    </div>
  );
}

export function StoreDetailSheet({ store, onClose, onAddToCart }: StoreDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabId>('menu');
  const { toggleFavorite, state, showToast } = useApp();

  const isFav = store ? state.favoriteStoreIds.has(store.id) : false;

  const categories: Array<{ id: MarketplaceMenuItem['category']; label: string; emoji: string }> = [
    { id: 'pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'sides', label: 'Sides', emoji: '🥖' },
    { id: 'drinks', label: 'Drinks', emoji: '🥤' },
    { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  ];

  return (
    <AnimatePresence>
      {store && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000]"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-[2001] max-w-2xl mx-auto"
            style={{ maxHeight: '90vh' }}
          >
            <div className="bg-[#0a0a10] border border-white/10 border-b-0 rounded-t-[2rem] overflow-hidden flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)]" style={{ maxHeight: '90vh' }}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="relative px-5 pt-2 pb-4 shrink-0">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-stone-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className={`w-16 h-16 ${store.logoColor} rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-lg border border-white/10`}>
                    {store.id === 'shamz'
                      ? <img src="/shamz-pizza-store.png" className="w-full h-full object-cover" alt="Shamz" />
                      : store.emoji}
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white">{store.name}</h2>
                      {store.isOpen
                        ? <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Open until {store.openUntil}</span>
                        : <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Closed</span>
                      }
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-current" /> {store.rating} <span className="text-stone-500 font-medium">({store.reviewCount})</span>
                      </span>
                      <span className="text-stone-600">·</span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {store.deliveryTime} min
                      </span>
                      <span className="text-stone-600">·</span>
                      <span className="text-xs text-stone-400">{store.distance}mi away</span>
                      {store.deliveryFee === 0
                        ? <span className="text-xs font-bold text-green-400">Free Delivery</span>
                        : <span className="text-xs text-stone-400">${store.deliveryFee} delivery</span>
                      }
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {store.badges.map(b => (
                        <span key={b} className="text-[9px] font-bold text-stone-300 bg-white/6 border border-white/10 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex gap-2 mt-4">
                  {store.phone && (
                    <a
                      href={`tel:${store.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black py-2.5 rounded-xl transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Store
                    </a>
                  )}
                  <button
                    onClick={() => { toggleFavorite(store.id); showToast(isFav ? 'Removed from favorites' : `${store.name} saved!`); }}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${isFav ? 'bg-red-600/20 border-red-500/40 text-red-400' : 'bg-white/8 border-white/10 text-stone-400 hover:text-red-400 hover:border-red-500/30'}`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/8 px-5 shrink-0 bg-black/20">
                {(['menu', 'deals', 'info'] as TabId[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-3 px-5 text-xs font-black capitalize transition-colors ${
                      activeTab === tab ? 'text-white' : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tab}
                    {tab === 'deals' && store.deals.length > 0 && (
                      <span className="ml-1.5 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{store.deals.length}</span>
                    )}
                    {activeTab === tab && (
                      <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
                {activeTab === 'menu' && (
                  <div>
                    {categories.map(cat => {
                      const items = store.menu.filter(m => m.category === cat.id);
                      if (!items.length) return null;
                      return (
                        <div key={cat.id} className="mb-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                            <span>{cat.emoji}</span> {cat.label}
                          </h3>
                          {items.map(item => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              storeId={store.id}
                              storeName={store.name}
                              onAddToCart={onAddToCart}
                            />
                          ))}
                        </div>
                      );
                    })}
                    {store.menu.length === 0 && (
                      <p className="text-stone-500 text-sm text-center py-10">No menu items available yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'deals' && (
                  <div className="space-y-3">
                    {store.deals.length === 0 ? (
                      <p className="text-stone-500 text-sm text-center py-10">No active deals right now.</p>
                    ) : (
                      store.deals.map(deal => <DealCard key={deal.id} deal={deal} />)
                    )}
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-white">{store.address}</p>
                          <p className="text-[10px] text-stone-500">{store.neighborhood} · Detroit, MI</p>
                        </div>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                          <a href={`tel:${store.phone}`} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">{store.phone}</a>
                        </div>
                      )}
                    </div>

                    {store.hours.length > 0 && (
                      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Hours</h4>
                        {store.hours.map((h, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-xs font-bold text-stone-400">{h.day}</span>
                            <span className="text-xs font-black text-white">{h.open} – {h.close}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Order Info</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-400">Min. Order</span>
                          <span className="text-xs font-black text-white">${store.minOrder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-400">Delivery Fee</span>
                          <span className={`text-xs font-black ${store.deliveryFee === 0 ? 'text-green-400' : 'text-white'}`}>
                            {store.deliveryFee === 0 ? 'Free' : `$${store.deliveryFee}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-400">Est. Delivery</span>
                          <span className="text-xs font-black text-white">{store.deliveryTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-400">Price Range</span>
                          <span className="text-xs font-black text-white">{store.priceRange}</span>
                        </div>
                      </div>
                    </div>

                    {store.reviews.length > 0 && (
                      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">
                          Reviews <span className="text-stone-600 normal-case font-medium">({store.reviewCount})</span>
                        </h4>
                        <div className="space-y-3">
                          {store.reviews.slice(0, 3).map(r => (
                            <div key={r.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-[10px] font-black text-red-400">{r.avatar}</div>
                                <span className="text-xs font-bold text-white">{r.user}</span>
                                <div className="flex ml-auto">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-700'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-stone-400 leading-relaxed">{r.text}</p>
                              <p className="text-[9px] text-stone-600 mt-1">{r.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
