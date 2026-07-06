import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  open: boolean;
  storeName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewModal({ open, storeName, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setRating(0); setHover(0); setComment(''); setError(''); };

  const submit = async () => {
    if (rating < 1) { setError('Please pick a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not submit your review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="w-full max-w-md pointer-events-auto rounded-3xl p-6 relative"
              style={{ background: '#141018', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4" />
              </button>

              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Rate your order</p>
              <h3 className="text-lg font-black text-white mb-5">{storeName}</h3>

              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(i)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-9 h-9 ${i <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-stone-700'}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell others about your experience (optional)…"
                rows={3}
                maxLength={400}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 outline-none resize-none mb-2"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />

              {error && <p className="text-xs font-bold text-red-400 mb-3">{error}</p>}

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
