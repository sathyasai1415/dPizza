import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RewardsService, LoyaltyAccountDto, LoyaltyTransactionDto } from '../../core/services/rewards.service';

interface RewardItem {
  id: string;
  name: string;
  points: number;
  description: string;
}

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h2 class="text-3xl font-black text-white">MiSlice Rewards Hub</h2>
        <p class="text-xs sm:text-sm text-white/50">Earn points on every slice and redeem them for free food.</p>
      </div>

      <!-- LOYALTY CARD -->
      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-gradient-to-br from-red-700 via-red-600 to-amber-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-red-900/30">
          <div class="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
          
          <div class="flex justify-between items-start">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/70">Loyalty Gold Member</p>
              <h3 class="text-2xl font-black mt-1">MiSlice Card</h3>
            </div>
            <span class="text-2xl">🍕</span>
          </div>

          <div class="mt-8 flex justify-between items-end">
            <div>
              <p class="text-4xl font-black">{{ account()?.points || 0 }}</p>
              <p class="text-xs text-white/70 mt-1">Available Points</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold">{{ account()?.referralCode }}</p>
              <p class="text-[9px] text-white/70 uppercase tracking-widest">Referral Code</p>
            </div>
          </div>
        </div>

        <!-- LIFETIME METRIC -->
        <div class="glass rounded-[2rem] p-6 flex flex-col justify-center text-center">
          <p class="text-white/40 text-xs font-bold uppercase tracking-wider">Lifetime Points Earned</p>
          <p class="text-4xl font-black text-amber-400 mt-2">{{ account()?.lifetimePoints || 0 }}</p>
          <p class="text-[10px] text-white/50 mt-1">Since registration</p>
        </div>
      </div>

      <div *ngIf="successMsg()" class="bg-green-500/15 border border-green-500/30 text-green-300 p-4 rounded-xl text-xs font-medium">
        {{ successMsg() }}
      </div>
      <div *ngIf="errorMsg()" class="bg-red-500/15 border border-red-500/30 text-red-300 p-4 rounded-xl text-xs font-medium">
        {{ errorMsg() }}
      </div>

      <!-- REDEEM REWARDS -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white">Redeem Points</h3>
        <div class="grid sm:grid-cols-3 gap-4">
          <div *ngFor="let reward of rewards" class="glass p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <div class="flex justify-between items-start">
                <h4 class="font-bold text-white text-sm">{{ reward.name }}</h4>
                <span class="bg-amber-500/25 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] font-black">
                  {{ reward.points }} pts
                </span>
              </div>
              <p class="text-xs text-white/50 mt-1.5">{{ reward.description }}</p>
            </div>

            <button (click)="redeem(reward)" [disabled]="(account()?.points || 0) < reward.points"
              class="w-full py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:bg-white/5 disabled:text-white/30 bg-red-600 hover:bg-red-500 text-white shadow-md">
              Redeem Reward
            </button>
          </div>
        </div>
      </div>

      <!-- TRANSACTION HISTORY -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white">Points Ledger</h3>
        <div class="glass rounded-[2rem] overflow-hidden">
          <div *ngIf="transactions().length === 0" class="p-6 text-center text-white/40 text-xs">
            No reward point transactions found.
          </div>
          
          <table *ngIf="transactions().length > 0" class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-white/10 bg-white/5">
                <th class="p-4 font-bold text-white/50">Type</th>
                <th class="p-4 font-bold text-white/50">Details</th>
                <th class="p-4 font-bold text-white/50">Points</th>
                <th class="p-4 font-bold text-white/50">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions()" class="border-b border-white/5 hover:bg-white/5 transition">
                <td class="p-4 font-bold">
                  <span [class]="tx.type === 'EARN' ? 'text-green-400' : 'text-red-400'">
                    {{ tx.type }}
                  </span>
                </td>
                <td class="p-4 text-white/70">{{ tx.description }}</td>
                <td class="p-4 font-black" [class.text-green-400]="tx.type === 'EARN'" [class.text-red-400]="tx.type === 'REDEEM'">
                  {{ tx.type === 'EARN' ? '+' : '-' }}{{ tx.points }}
                </td>
                <td class="p-4 text-white/40">{{ tx.createdAt | date:'short' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class RewardsComponent implements OnInit {
  private readonly rewardsService = inject(RewardsService);

  account = signal<LoyaltyAccountDto | null>(null);
  transactions = signal<LoyaltyTransactionDto[]>([]);
  successMsg = signal('');
  errorMsg = signal('');

  rewards: RewardItem[] = [
    { id: 'garlic_bread', name: 'Free Cheesy Garlic Bread', points: 300, description: 'Golden bread topped with fresh garlic spread and mozzarella' },
    { id: 'soda_2l', name: 'Free 2-Liter Soda Bottle', points: 200, description: 'Select flavor at checkout/pickup' },
    { id: 'custom_med_pizza', name: 'Free Medium Custom Pizza', points: 800, description: 'Medium pizza with up to 3 gourmet toppings' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.rewardsService.getMyAccount().subscribe({
      next: (acc) => this.account.set(acc)
    });

    this.rewardsService.getMyTransactions().subscribe({
      next: (txs) => this.transactions.set(txs)
    });
  }

  redeem(reward: RewardItem) {
    this.successMsg.set('');
    this.errorMsg.set('');

    this.rewardsService.redeemPoints(reward.points, `Redeemed ${reward.name}`).subscribe({
      next: () => {
        this.successMsg.set(`Successfully redeemed "${reward.name}"! Points deducted.`);
        this.loadData();
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to redeem reward.');
      }
    });
  }
}
