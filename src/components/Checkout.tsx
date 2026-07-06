import React, { useState } from 'react';
import { CartItem } from '../types';
import { Wallet, MapPin, Loader2, Info, Store, Bike, Check } from 'lucide-react';

export type PaymentMethod = 'cash_on_delivery' | 'pay_at_store';

interface CheckoutProps {
  cart: CartItem[];
  totalToCharge: number;
  onCancel: () => void;
  onConfirmOrder: (address: string, notes: string, paymentMethod: PaymentMethod) => Promise<void>;
}

export function Checkout({ cart, totalToCharge, onCancel, onConfirmOrder }: CheckoutProps) {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const isDelivery = cart.some(item => ['store-delivery', 'store', 'third-party', 'doordash-drive', 'uber-direct'].includes(item.delivery_type));
  const [payMethod, setPayMethod] = useState<PaymentMethod>(isDelivery ? 'cash_on_delivery' : 'pay_at_store');

  const placeOrder = async () => {
    if (isDelivery && address.trim().length < 6) {
      setError('Please enter a valid delivery address.');
      return;
    }
    setError('');
    setIsProcessing(true);
    try {
      await onConfirmOrder(address.trim(), notes.trim(), payMethod);
    } catch (e: any) {
      setError(e?.message || 'Could not place your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <h2 className="text-3xl font-black text-white mb-8 tracking-tight drop-shadow-md">Checkout</h2>

      <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/10 mb-6 relative overflow-hidden">

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-xl mb-4 text-sm font-medium relative z-10">
            {error}
          </div>
        )}

        <div className="bg-blue-950/40 border border-blue-500/30 text-blue-300 p-4 rounded-xl mb-8 flex gap-3 text-sm font-medium relative z-10 shadow-inner">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
          <p>You pay when your order {isDelivery ? 'is delivered' : 'is ready for pickup'}. No online payment needed — the store confirms your order right away.</p>
        </div>

        {isDelivery && (
          <div className="mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
              <MapPin className="w-5 h-5 text-orange-400" /> Delivery Address
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address, Apt/Unit"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white placeholder-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors shadow-inner"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <input
                type="text"
                placeholder="Delivery Instructions (e.g. Leave at door)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white placeholder-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-colors shadow-inner"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mb-8 relative z-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
            <Wallet className="w-5 h-5 text-orange-400" /> Payment Method
          </h3>
          <div className="space-y-3">
            {isDelivery && (
              <PayOption
                active={payMethod === 'cash_on_delivery'}
                onClick={() => setPayMethod('cash_on_delivery')}
                icon={Bike}
                title="Cash on Delivery"
                desc="Pay the driver when your pizza arrives"
              />
            )}
            <PayOption
              active={payMethod === 'pay_at_store'}
              onClick={() => setPayMethod('pay_at_store')}
              icon={Store}
              title={isDelivery ? 'Pay at Store (Pickup)' : 'Pay at Store'}
              desc="Pay in-store — cash or card at the counter"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 mt-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-bold text-white/60">Order Total</span>
            <span className="text-2xl font-black text-orange-400">${totalToCharge.toFixed(2)}</span>
          </div>

          <div className="flex gap-4">
            <button disabled={isProcessing} onClick={onCancel} className="flex-[0.5] py-4 rounded-xl font-bold bg-white/5 text-white/50 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button disabled={isProcessing} onClick={placeOrder} className="flex-1 py-4 rounded-xl font-black bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing order…</> : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayOption({ active, onClick, icon: Icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ElementType; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
        active ? 'bg-orange-500/15 border-orange-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-orange-500/25 text-orange-300' : 'bg-white/8 text-stone-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-stone-400">{desc}</p>
      </div>
      {active && <Check className="w-5 h-5 text-orange-400 shrink-0" />}
    </button>
  );
}
