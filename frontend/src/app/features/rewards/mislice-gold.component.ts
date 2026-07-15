import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RewardsService, LoyaltyAccountDto, LoyaltyTransactionDto } from '../../core/services/rewards.service';

interface Benefit { icon: string; title: string; desc: string; }
interface Faq { q: string; a: string; open: boolean; }

/**
 * MiSlice Gold — premium membership showcase. Inspired by the elegance of
 * high-end membership programs, but built as MiSlice's own distinct visual
 * identity (metallic gold-on-near-black), not a copy of any other brand.
 *
 * Real data: current points/lifetime points/referral code and membership
 * (points) history come from the existing LoyaltyAccount backend. There is
 * no paid-subscription backend yet, so "Upgrade" records interest locally
 * (a waitlist flag) rather than faking a real charge.
 */
@Component({
  selector: 'app-mislice-gold',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="min-h-screen -m-6 lg:-m-8 p-6 lg:p-8" style="background: var(--color-gold-bg); color: var(--color-text-soft-white);">
      <div class="max-w-5xl mx-auto space-y-10 pb-16">

        <a routerLink="/rewards" class="inline-flex items-center gap-1.5 text-xs font-bold" style="color: var(--color-text-secondary);">← Back to Rewards</a>

        <!-- ============ MEMBERSHIP HERO ============ -->
        <section class="relative overflow-hidden rounded-[24px] p-8 sm:p-12 text-center"
          style="background: var(--color-gold-surface); border: 1px solid var(--color-gold-border);">
          <div class="absolute inset-0 opacity-[0.06] pointer-events-none" style="background: var(--gradient-gold-metallic);"></div>
          <div class="relative z-10 flex flex-col items-center gap-4">
            <span class="gold-badge">✦ PREMIUM MEMBERSHIP</span>
            <h1 class="text-4xl sm:text-5xl font-black tracking-tight gold-text">MiSlice Gold</h1>
            <p class="text-sm sm:text-base max-w-lg" style="color: var(--color-text-secondary);">
              Unlock free delivery, double points on every order, exclusive coupons, and members-only deals.
            </p>
            <button (click)="upgrade()" [disabled]="waitlisted()" class="gold-btn mt-3">
              {{ waitlisted() ? '✓ You\\'re on the list' : 'Upgrade to Gold →' }}
            </button>
            <p class="text-[11px]" style="color: var(--color-text-secondary);">Launching soon · no payment required to join the waitlist</p>
          </div>
        </section>

        <!-- ============ PREMIUM CARD ============ -->
        <section class="flex justify-center">
          <div class="w-full max-w-md aspect-[1.6/1] rounded-[20px] p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl"
            style="background: linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%); border: 1px solid var(--color-gold-border);">
            <div class="absolute inset-x-0 top-0 h-1" style="background: var(--gradient-gold-metallic);"></div>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-[10px] uppercase tracking-[0.2em]" style="color: var(--color-text-secondary);">MiSlice</p>
                <p class="text-lg font-black gold-text">GOLD MEMBER</p>
              </div>
              <span class="text-2xl">🍕</span>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-widest mb-1" style="color: var(--color-text-secondary);">Member</p>
              <p class="font-bold tracking-wide" style="color: var(--color-text-soft-white);">{{ memberName() }}</p>
              <div class="flex items-center justify-between mt-3">
                <p class="text-[10px] font-mono tracking-widest" style="color: var(--color-text-secondary);">CODE {{ account()?.referralCode || '—' }}</p>
                <p class="text-[10px]" style="color: var(--color-text-secondary);">Since {{ memberSince }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ BENEFITS GRID ============ -->
        <section>
          <h2 class="text-xl font-black gold-text mb-5 text-center">Member Benefits</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (b of benefits; track b.title) {
              <div class="gold-card p-5 space-y-2">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(212,175,55,0.1); border: 1px solid var(--color-gold-border);">{{ b.icon }}</div>
                <h3 class="font-bold text-sm" style="color: var(--color-text-soft-white);">{{ b.title }}</h3>
                <p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">{{ b.desc }}</p>
              </div>
            }
          </div>
        </section>

        <!-- ============ FREE DELIVERY + MULTIPLIER SPOTLIGHT ============ -->
        <section class="grid sm:grid-cols-2 gap-4">
          <div class="gold-card p-6 space-y-2">
            <span class="gold-badge">🛵 FREE DELIVERY</span>
            <p class="text-sm font-bold mt-2" style="color: var(--color-text-soft-white);">Unlimited free delivery on every order</p>
            <p class="text-xs" style="color: var(--color-text-secondary);">No minimums. No delivery fee, ever — on any participating restaurant.</p>
          </div>
          <div class="gold-card p-6 space-y-2">
            <span class="gold-badge">⚡ 2× REWARD MULTIPLIER</span>
            <p class="text-sm font-bold mt-2" style="color: var(--color-text-soft-white);">Earn double MiSlice points</p>
            <p class="text-xs" style="color: var(--color-text-secondary);">Every order earns 2x points toward your next free pizza.</p>
          </div>
        </section>

        <!-- ============ EXCLUSIVE DEALS / SPECIAL COUPONS ============ -->
        <section>
          <h2 class="text-xl font-black gold-text mb-5 text-center">Exclusive Gold Coupons</h2>
          <div class="grid sm:grid-cols-3 gap-4">
            @for (c of coupons; track c.code) {
              <div class="gold-card p-5 text-center space-y-2">
                <p class="text-2xl font-black gold-text">{{ c.value }}</p>
                <p class="text-xs font-bold" style="color: var(--color-text-soft-white);">{{ c.label }}</p>
                <p class="text-[10px] font-mono px-2 py-1 rounded-md inline-block" style="background: rgba(255,255,255,0.06); color: var(--color-text-secondary);">{{ c.code }}</p>
              </div>
            }
          </div>
        </section>

        <!-- ============ BIRTHDAY REWARD + INVITE FRIENDS ============ -->
        <section class="grid sm:grid-cols-2 gap-4">
          <div class="gold-card p-6 space-y-2">
            <span class="gold-badge">🎂 BIRTHDAY REWARD</span>
            <p class="text-sm font-bold mt-2" style="color: var(--color-text-soft-white);">A free pizza on your birthday</p>
            <p class="text-xs" style="color: var(--color-text-secondary);">Add your birthday in your profile and we'll send a reward automatically.</p>
          </div>
          <div class="gold-card p-6 space-y-3">
            <span class="gold-badge">🤝 INVITE FRIENDS</span>
            <p class="text-xs" style="color: var(--color-text-secondary);">Share your code — you both earn Gold-exclusive bonus points.</p>
            <div class="flex items-center justify-between rounded-lg px-3 py-2" style="background: rgba(255,255,255,0.04); border: 1px solid var(--color-gold-border);">
              <span class="font-mono text-sm gold-text">{{ account()?.referralCode || 'MISLICEGOLD' }}</span>
              <button (click)="copyCode()" class="text-[11px] font-black gold-text hover:underline">{{ copied() ? 'Copied ✓' : 'Copy' }}</button>
            </div>
          </div>
        </section>

        <!-- ============ MEMBERSHIP HISTORY ============ -->
        <section>
          <h2 class="text-xl font-black gold-text mb-5 text-center">Membership History</h2>
          <div class="gold-card p-5">
            @if (transactions().length === 0) {
              <p class="text-xs text-center py-6" style="color: var(--color-text-secondary);">No activity yet.</p>
            }
            <div class="space-y-3">
              @for (tx of transactions().slice(0, 6); track tx.id) {
                <div class="flex items-center justify-between pb-3" style="border-bottom: 1px solid var(--color-gold-border);">
                  <div>
                    <p class="text-xs font-bold" style="color: var(--color-text-soft-white);">{{ tx.description }}</p>
                    <p class="text-[10px]" style="color: var(--color-text-secondary);">{{ tx.createdAt | date:'mediumDate' }}</p>
                  </div>
                  <span class="text-xs font-black" [style.color]="tx.type === 'EARN' ? 'var(--color-gold-3)' : 'var(--color-text-secondary)'">
                    {{ tx.type === 'EARN' ? '+' : '-' }}{{ tx.points }} pts
                  </span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- ============ FAQ ============ -->
        <section>
          <h2 class="text-xl font-black gold-text mb-5 text-center">Frequently Asked Questions</h2>
          <div class="space-y-2 max-w-2xl mx-auto">
            @for (f of faqs; track f.q) {
              <div class="gold-card overflow-hidden">
                <button (click)="f.open = !f.open" class="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span class="text-sm font-bold" style="color: var(--color-text-soft-white);">{{ f.q }}</span>
                  <span class="gold-text text-lg" [style.transform]="f.open ? 'rotate(45deg)' : 'none'" style="transition: transform .2s;">+</span>
                </button>
                @if (f.open) {
                  <p class="px-5 pb-4 text-xs leading-relaxed" style="color: var(--color-text-secondary);">{{ f.a }}</p>
                }
              </div>
            }
          </div>
        </section>

        <div class="flex justify-center">
          <button (click)="upgrade()" [disabled]="waitlisted()" class="gold-btn">
            {{ waitlisted() ? '✓ You\\'re on the list' : 'Upgrade to Gold →' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gold-text { color: var(--color-gold-4); }
    .gold-card {
      background: var(--color-gold-card);
      border: 1px solid var(--color-gold-border);
      border-radius: 20px;
      transition: border-color .2s ease, transform .2s ease;
    }
    .gold-card:hover { border-color: var(--color-gold-4); transform: translateY(-2px); }
    .gold-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 900; letter-spacing: .12em;
      padding: 6px 12px; border-radius: 999px;
      color: #060606;
      background: linear-gradient(90deg, var(--color-gold-6), var(--color-gold-2), var(--color-gold-6));
    }
    .gold-btn {
      font-weight: 900; font-size: 14px; color: #060606;
      padding: 14px 32px; border-radius: 999px;
      background: var(--gradient-gold-metallic);
      box-shadow: 0 4px 24px rgba(212,175,55,0.25);
      transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
    }
    .gold-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(212,175,55,0.35); }
    .gold-btn:disabled { opacity: .6; cursor: default; }
  `],
})
export class MisliceGoldComponent implements OnInit {
  private readonly rewardsService = inject(RewardsService);

  account = signal<LoyaltyAccountDto | null>(null);
  transactions = signal<LoyaltyTransactionDto[]>([]);
  copied = signal(false);
  waitlisted = signal(this.readWaitlisted());

  memberName = signal('MiSlice Member');
  memberSince = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  benefits: Benefit[] = [
    { icon: '🛵', title: 'Free Delivery', desc: 'Unlimited free delivery on every order, no minimum spend.' },
    { icon: '⚡', title: '2× Points', desc: 'Earn double rewards points on every purchase.' },
    { icon: '🏷️', title: 'Exclusive Coupons', desc: 'Members-only discount codes updated monthly.' },
    { icon: '🎂', title: 'Birthday Reward', desc: 'A free pizza waiting for you on your birthday.' },
    { icon: '🤝', title: 'Referral Bonus', desc: 'Bigger bonuses when you invite friends to MiSlice.' },
    { icon: '🌟', title: 'Priority Support', desc: 'Skip the line with dedicated Gold member support.' },
  ];

  coupons = [
    { value: '20%', label: 'Off Any Order', code: 'GOLD20' },
    { value: '$0', label: 'Delivery Fee', code: 'GOLDSHIP' },
    { value: '2×', label: 'Bonus Points', code: 'GOLD2X' },
  ];

  faqs: Faq[] = [
    { q: 'How much does MiSlice Gold cost?', a: 'Pricing will be announced at launch. Join the waitlist now and we\'ll notify you first.', open: false },
    { q: 'Can I cancel anytime?', a: 'Yes — MiSlice Gold will be a no-commitment monthly membership you can cancel anytime.', open: false },
    { q: 'Do points I already have carry over?', a: 'Yes, your existing MiSlice points and referral code carry over automatically.', open: false },
  ];

  ngOnInit(): void {
    this.rewardsService.getMyAccount().subscribe({ next: (acc) => this.account.set(acc) });
    this.rewardsService.getMyTransactions().subscribe({
      next: (txs) => this.transactions.set(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
    });
  }

  private readWaitlisted(): boolean {
    try { return localStorage.getItem('mislice_gold_waitlist') === '1'; } catch { return false; }
  }

  upgrade(): void {
    if (this.waitlisted()) return;
    this.waitlisted.set(true);
    try { localStorage.setItem('mislice_gold_waitlist', '1'); } catch { /* ignore */ }
  }

  copyCode(): void {
    const code = this.account()?.referralCode || 'MISLICEGOLD';
    navigator.clipboard?.writeText(code).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
