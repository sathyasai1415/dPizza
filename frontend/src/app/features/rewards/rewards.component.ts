import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RewardsService, LoyaltyAccountDto, LoyaltyTransactionDto } from '../../core/services/rewards.service';

interface RewardItem {
  id: string;
  name: string;
  points: number;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="min-h-screen bg-[#FAFAFA] text-[#111827] pb-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- HEADER -->
        <header>
          <h1 class="text-3xl font-black tracking-tight text-[#111827]">MiSlice Rewards Hub</h1>
          <p class="text-[#6B7280] text-sm mt-1 font-medium">Compare, order, and earn free pizza.</p>
        </header>

        <!-- Messages -->
        <div *ngIf="successMsg()" class="bg-green-500/15 border border-green-500/30 text-green-700 p-4 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{{ successMsg() }}</span>
          <button (click)="successMsg.set('')" class="text-green-700 hover:text-green-900">✕</button>
        </div>
        <div *ngIf="errorMsg()" class="bg-[#E53935]/10 border border-[#E53935]/20 text-[#E53935] p-4 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{{ errorMsg() }}</span>
          <button (click)="errorMsg.set('')" class="text-[#E53935] hover:text-red-900">✕</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <!-- LEFT COLUMN: Main Dashboard -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- HERO CARD (Points & Tier) -->
            <div class="relative rounded-[24px] overflow-hidden shadow-xl shadow-red-900/10 bg-gradient-to-br" [ngClass]="currentTier.color">
              <!-- Glow Effect -->
              <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/20 blur-3xl rounded-full"></div>
              <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 blur-2xl rounded-full"></div>
              
              <div class="relative p-8 text-white z-10">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
                      <span>{{ currentTier.icon }}</span>
                      {{ currentTier.name }} Member
                    </h2>
                    <h3 class="text-3xl font-black mt-2">Good Evening!</h3>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-white/60">Current Points</p>
                    <p class="text-5xl font-black mt-1 drop-shadow-md relative inline-block">
                      {{ account()?.points || 0 }}
                      <span class="absolute -right-6 top-0 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                    </p>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="mt-10">
                  <div class="flex justify-between items-end mb-2">
                    <div>
                      <p class="text-xs font-bold text-white/80">{{ pointsToNextReward }} Points Until</p>
                      <p class="text-lg font-black uppercase tracking-wider">{{ nextRewardTarget?.name || 'MAX REWARDS' }}</p>
                    </div>
                    <p class="text-xs font-bold font-mono text-white/80">{{ account()?.points || 0 }} / {{ nextRewardTarget?.points || 0 }}</p>
                  </div>
                  <div class="w-full h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                    <div class="h-full bg-white rounded-full transition-all duration-1000 ease-out relative overflow-hidden" [style.width.%]="progressPercent">
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- REWARDS WALLET (Redeemable) -->
            <div>
              <h3 class="text-lg font-black text-[#111827] mb-4">Rewards Wallet</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div *ngFor="let r of rewards" class="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#E53935] hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div class="flex justify-between items-start mb-3">
                      <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {{ r.icon }}
                      </div>
                      <span class="bg-[#FF8A00]/10 text-[#FF8A00] px-2.5 py-1 rounded-lg text-xs font-black border border-[#FF8A00]/20">
                        {{ r.points }} pts
                      </span>
                    </div>
                    <h4 class="font-bold text-[#111827]">{{ r.name }}</h4>
                    <p class="text-xs text-[#6B7280] mt-1">{{ r.description }}</p>
                  </div>
                  
                  <button (click)="redeem(r)" [disabled]="(account()?.points || 0) < r.points"
                    class="mt-5 w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-sm"
                    [class]="(account()?.points || 0) >= r.points 
                      ? 'bg-[#E53935] text-white hover:bg-red-700 hover:shadow-lg shadow-red-500/30' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'">
                    Claim Reward
                  </button>
                </div>
              </div>
            </div>

            <!-- GAMIFICATION: DAILY CHALLENGES -->
            <div>
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-black text-[#111827]">Daily Challenges</h3>
                <span class="text-xs font-bold text-[#FF8A00] bg-[#FF8A00]/10 px-2 py-1 rounded-lg">Resets in 14h</span>
              </div>
              <div class="space-y-3">
                <div *ngFor="let c of challenges" class="bg-white rounded-xl p-4 border border-[#E5E7EB] flex items-center justify-between hover:shadow-sm transition-all">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" [ngClass]="c.completed ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500'">
                      {{ c.completed ? '✓' : c.icon }}
                    </div>
                    <div>
                      <h4 class="font-bold text-[#111827] text-sm">{{ c.name }}</h4>
                      <p class="text-xs text-[#6B7280] font-medium">{{ c.completed ? 'Completed!' : c.progress }}</p>
                    </div>
                  </div>
                  <span class="font-black text-sm" [ngClass]="c.completed ? 'text-green-600' : 'text-[#E53935]'">
                    +{{ c.pts }} pts
                  </span>
                </div>
              </div>
            </div>

            <!-- GAMIFICATION: ACHIEVEMENTS -->
            <div>
              <h3 class="text-lg font-black text-[#111827] mb-4">Achievements</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div *ngFor="let a of achievements" class="bg-white rounded-2xl p-4 border border-[#E5E7EB] text-center hover:scale-105 transition-transform cursor-pointer">
                  <div class="text-3xl mb-2" [class.grayscale]="!a.unlocked" [class.opacity-50]="!a.unlocked">{{ a.icon }}</div>
                  <h4 class="font-bold text-[#111827] text-xs leading-tight mb-1">{{ a.name }}</h4>
                  <div class="flex justify-center gap-0.5">
                    <span *ngFor="let star of [1,2,3]" class="text-[8px]" [class.text-yellow-400]="a.unlocked" [class.text-gray-200]="!a.unlocked">★</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Sidebar -->
          <div class="space-y-6">
            
            <!-- AI REWARD INSIGHTS -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] border-l-4 border-l-[#12355B] p-6 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 text-6xl opacity-5">🤖</div>
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest flex items-center gap-2 mb-4">
                <span>✨</span> Reward Insights
              </h3>
              <div class="space-y-3">
                <div class="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    You are only <span class="font-black text-blue-700">{{ pointsToNextReward }} points</span> away from a <span class="font-black">Free {{ nextRewardTarget?.name?.replace('Free ', '') || 'Pizza' }}</span>.
                  </p>
                </div>
                <div class="bg-[#16A34A]/10 rounded-xl p-3 border border-[#16A34A]/20">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    You've saved <span class="font-black text-[#16A34A]">$184.20</span> by comparing pizza prices through MiSlice!
                  </p>
                </div>
                <div class="bg-[#E53935]/5 rounded-xl p-3 border border-[#E53935]/10">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    <span class="font-black text-[#E53935]">Double Points Friday!</span> Compare & Order from a local independent pizzeria today to earn 2x points.
                  </p>
                  <button routerLink="/builder" class="mt-2 text-[10px] font-black uppercase text-[#E53935] hover:underline">Compare Now →</button>
                </div>
              </div>
            </div>

            <!-- REFERRAL PROGRAM -->
            <div class="bg-[#12355B] text-white rounded-[20px] p-6 text-center shadow-lg relative overflow-hidden">
              <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <h3 class="text-2xl font-black mb-1 relative z-10">Invite Friends</h3>
              <p class="text-sm font-medium text-white/80 mb-6 relative z-10">You earn <span class="font-black text-yellow-400">500 pts</span>, they earn <span class="font-black text-yellow-400">300 pts</span>!</p>
              
              <div class="bg-black/20 rounded-xl p-3 mb-4 relative z-10 backdrop-blur-sm border border-white/10">
                <p class="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1">Your Referral Code</p>
                <p class="text-xl font-mono font-bold tracking-widest">{{ account()?.referralCode || 'MISLICE25' }}</p>
              </div>
              
              <button class="w-full bg-white text-[#12355B] font-black py-2.5 rounded-xl text-sm hover:bg-gray-100 transition relative z-10 shadow-md">
                Copy Code
              </button>
            </div>

            <!-- PERSONAL STATISTICS -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest mb-4">Lifetime Stats</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-end border-b border-gray-100 pb-2">
                  <p class="text-xs font-bold text-[#6B7280]">Lifetime Points</p>
                  <p class="font-black text-[#111827]">{{ account()?.lifetimePoints || 0 }}</p>
                </div>
                <div class="flex justify-between items-end border-b border-gray-100 pb-2">
                  <p class="text-xs font-bold text-[#6B7280]">Free Pizzas Earned</p>
                  <p class="font-black text-[#111827]">3</p>
                </div>
                <div class="flex justify-between items-end border-b border-gray-100 pb-2">
                  <p class="text-xs font-bold text-[#6B7280]">Restaurants Tried</p>
                  <p class="font-black text-[#111827]">14</p>
                </div>
                <div class="flex justify-between items-end pb-2">
                  <p class="text-xs font-bold text-[#6B7280]">Favorite Style</p>
                  <p class="font-black text-[#111827]">Pepperoni</p>
                </div>
              </div>
            </div>

            <!-- REWARDS HISTORY TIMELINE -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest mb-5">History</h3>
              
              <div *ngIf="transactions().length === 0" class="text-center py-6 text-xs text-gray-500 font-medium">
                No activity yet.
              </div>

              <div class="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-100">
                
                <div *ngFor="let tx of transactions().slice(0,5)" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"
                    [ngClass]="tx.type === 'EARN' ? 'bg-[#16A34A]' : 'bg-[#E53935]'">
                    <span class="text-[8px] text-white font-bold">{{ tx.type === 'EARN' ? '+' : '-' }}</span>
                  </div>
                  
                  <div class="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-black text-xs" [ngClass]="tx.type === 'EARN' ? 'text-[#16A34A]' : 'text-[#E53935]'">
                        {{ tx.type === 'EARN' ? '+' : '-' }}{{ tx.points }} pts
                      </span>
                      <time class="text-[9px] font-bold text-gray-400">{{ tx.createdAt | date:'MMM d' }}</time>
                    </div>
                    <p class="text-xs text-[#111827] font-medium leading-snug">{{ tx.description }}</p>
                  </div>
                </div>

              </div>
              <button routerLink="/orders" class="w-full mt-6 py-2 bg-gray-50 text-xs font-bold text-[#111827] rounded-xl hover:bg-gray-100 transition border border-gray-200">
                View All Activity
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
  `]
})
export class RewardsComponent implements OnInit {
  private readonly rewardsService = inject(RewardsService);

  account = signal<LoyaltyAccountDto | null>(null);
  transactions = signal<LoyaltyTransactionDto[]>([]);
  successMsg = signal('');
  errorMsg = signal('');

  rewards: RewardItem[] = [
    { id: 'garlic_bread', name: 'Free Garlic Bread', points: 200, description: 'Freshly baked with mozzarella.', icon: '🥖' },
    { id: 'discount_5', name: '$5 Off Order', points: 400, description: 'Get $5 off your next pizza.', icon: '💵' },
    { id: 'custom_med_pizza', name: 'Free Medium Pizza', points: 900, description: 'Up to 3 gourmet toppings.', icon: '🍕' },
    { id: 'custom_lg_pizza', name: 'Free Large Pizza', points: 1500, description: 'Unlimited toppings. Any crust.', icon: '🎉' },
    { id: 'discount_50', name: '50% OFF Any Pizza', points: 2000, description: 'Half off your favorite pie.', icon: '✂️' },
  ];

  challenges = [
    { name: 'Compare 3 Pizza Prices', pts: 25, progress: '2 / 3', icon: '⚖️', completed: false },
    { name: 'Order From a Local Shop', pts: 100, progress: '0 / 1', icon: '🏪', completed: false },
    { name: 'Review Your Last Pizza', pts: 40, progress: 'Done', icon: '⭐', completed: true },
    { name: 'Invite a Friend', pts: 200, progress: '0 / 1', icon: '👋', completed: false },
  ];

  achievements = [
    { name: 'Pizza Explorer', icon: '🗺️', unlocked: true },
    { name: 'Deal Hunter', icon: '🎯', unlocked: true },
    { name: 'Review Master', icon: '📝', unlocked: false },
    { name: 'Pepperoni Fan', icon: '🥓', unlocked: true },
  ];

  get currentTier() {
    const pts = this.account()?.lifetimePoints || 0;
    if (pts >= 5000) return { name: 'Platinum', icon: '💎', color: 'from-slate-700 to-slate-900', next: null, min: 5000, max: 99999 };
    if (pts >= 2500) return { name: 'Gold', icon: '🥇', color: 'from-amber-400 to-yellow-600', next: 'Platinum', min: 2500, max: 5000 };
    if (pts >= 1000) return { name: 'Silver', icon: '🥈', color: 'from-gray-300 to-gray-500', next: 'Gold', min: 1000, max: 2500 };
    return { name: 'Bronze', icon: '🥉', color: 'from-orange-600 to-red-800', next: 'Silver', min: 0, max: 1000 };
  }

  get nextRewardTarget() {
    const currentPts = this.account()?.points || 0;
    // Find the first reward they CANNOT afford yet
    const target = this.rewards.slice().sort((a,b) => a.points - b.points).find(r => r.points > currentPts);
    return target || this.rewards[this.rewards.length - 1]; // Max reward if they can afford everything
  }

  get pointsToNextReward() {
    const currentPts = this.account()?.points || 0;
    const target = this.nextRewardTarget;
    if (currentPts >= target.points) return 0;
    return target.points - currentPts;
  }

  get progressPercent() {
    const currentPts = this.account()?.points || 0;
    const target = this.nextRewardTarget;
    if (currentPts >= target.points) return 100;
    
    // To make it look nice, if they have 0 points towards a 200 point reward, it's 0%.
    // If they have 150 towards 200, it's 75%.
    return (currentPts / target.points) * 100;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.rewardsService.getMyAccount().subscribe({
      next: (acc) => this.account.set(acc)
    });

    this.rewardsService.getMyTransactions().subscribe({
      next: (txs) => {
        const sorted = txs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.transactions.set(sorted);
      }
    });
  }

  redeem(reward: RewardItem) {
    if ((this.account()?.points || 0) < reward.points) return;
    
    this.successMsg.set('');
    this.errorMsg.set('');

    this.rewardsService.redeemPoints(reward.points, `Redeemed ${reward.name}`).subscribe({
      next: () => {
        this.successMsg.set(`🎉 Successfully redeemed "${reward.name}"! Enjoy your reward.`);
        this.loadData();
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to redeem reward.');
      }
    });
  }
}
