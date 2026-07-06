import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { watchStoreReviews, replyToReview, ReviewDoc } from '../../../lib/db';

interface Props { storeData: any; orders: any[]; }

export function FeedbackTab({ storeData }: Props) {
  const storeId = storeData?.id;
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'unreplied'>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    const unsub = watchStoreReviews(storeId, rows => { setReviews(rows); setLoading(false); });
    return unsub;
  }, [storeId]);

  const total = reviews.length;
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }));

  const filtered = reviews.filter(r => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'negative') return r.rating <= 2;
    if (filter === 'unreplied') return !r.reply;
    return true;
  });

  const postReply = async (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    setPosting(id);
    try {
      await replyToReview(id, text);
      setDrafts(d => ({ ...d, [id]: '' }));
    } finally {
      setPosting(null);
    }
  };

  function Stars({ n, size = 'sm' }: { n: number; size?: 'sm' | 'lg' }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} ${i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-stone-700'}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Customer Feedback</h2>
        <span className="text-xs text-stone-500">{total} review{total !== 1 ? 's' : ''}</span>
      </div>

      {loading && <p className="text-center text-stone-500 text-sm py-8">Loading reviews…</p>}

      {!loading && total === 0 && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-stone-700 mx-auto mb-3" />
          <p className="text-sm font-black text-stone-400 mb-1">No reviews yet</p>
          <p className="text-xs text-stone-600">Reviews from customers who complete an order will appear here.</p>
        </div>
      )}

      {!loading && total > 0 && (<>
      {/* Rating summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center">
          <p className="text-5xl font-black text-white mb-1">{avgRating.toFixed(1)}</p>
          <Stars n={Math.round(avgRating)} size="lg" />
          <p className="text-xs text-stone-500 mt-2">Overall rating</p>
        </div>
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-2">
          {dist.map(d => (
            <div key={d.stars} className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-400 w-4">{d.stars}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
              <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400/70 rounded-full"
                  style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-stone-500 w-4">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Positive',  value: reviews.filter(r => r.rating >= 4).length, icon: ThumbsUp,  color: 'text-green-400' },
          { label: 'Neutral',   value: reviews.filter(r => r.rating === 3).length, icon: MessageSquare, color: 'text-yellow-400' },
          { label: 'Negative',  value: reviews.filter(r => r.rating <= 2).length, icon: ThumbsDown, color: 'text-red-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-bold text-stone-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
        {(['all', 'positive', 'negative', 'unreplied'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-black rounded-lg capitalize transition-all ${filter === f ? 'bg-red-600 text-white' : 'text-stone-500 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.map(review => {
          const rid = review.id!;
          const replied = review.reply;
          const when = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '';
          return (
            <div key={rid} className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {(review.customerName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{review.customerName || 'Customer'}</p>
                    <p className="text-[9px] text-stone-600">{when}</p>
                  </div>
                </div>
                <Stars n={review.rating} />
              </div>
              <p className="text-sm text-stone-300 leading-relaxed mb-3">{review.comment}</p>

              {replied ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Your reply</p>
                  <p className="text-xs text-stone-300">{replied}</p>
                </div>
              ) : (
                <div className="mt-2">
                  <textarea
                    value={drafts[rid] || ''}
                    onChange={e => setDrafts(d => ({ ...d, [rid]: e.target.value }))}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-red-500 resize-none transition-colors"
                  />
                  <button
                    onClick={() => postReply(rid)}
                    disabled={posting === rid || !drafts[rid]?.trim()}
                    className="mt-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-colors disabled:opacity-40"
                  >
                    {posting === rid ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-stone-600 text-sm py-8">No reviews match this filter.</p>
        )}
      </div>
      </>)}
    </div>
  );
}
