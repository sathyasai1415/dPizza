import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDto } from '../../shared/models';

type Stage = { key: string; label: string; sub: string; emoji: string };

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading()" class="flex justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500"></div>
    </div>

    <div *ngIf="!loading() && order()" class="w-full max-w-3xl mx-auto py-8 px-1 space-y-6">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {{ isDelivered() ? 'Order Delivered! 🎉' : 'Tracking your order' }}
        </h1>
        <p class="text-white/50 text-sm mt-2">
          {{ order()?.restaurantName }} · Order #{{ order()?.orderNumber }}
        </p>
      </div>

      <!-- Live route map simulation (SVG track) -->
      <div class="glass rounded-3xl overflow-hidden">
        <div class="relative h-40 bg-gradient-to-br from-stone-900 to-black overflow-hidden">
          <!-- Dots background -->
          <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)]" style="background-size: 20px 20px;"></div>
          
          <!-- route line -->
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
            <path d="M40,120 C140,120 160,40 360,40" fill="none" stroke="rgba(239,68,68,0.3)" stroke-width="3" stroke-dasharray="6 6" />
          </svg>

          <!-- Store marker -->
          <div class="absolute left-[8%] bottom-[20%] w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-lg">
            🏪
          </div>

          <!-- Courier moving marker -->
          <div class="absolute transition-all duration-1000 ease-in-out"
            [style.left.%]="10 + progressPct() * 0.75"
            [style.top.%]="70 - progressPct() * 0.5">
            <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-xl shadow-lg shadow-red-600/30 ring-4 ring-white/10">
              🚴
            </div>
          </div>

          <!-- Customer home marker -->
          <div class="absolute right-[8%] top-[15%] w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg">
            🏠
          </div>
        </div>

        <!-- ETA Countdown -->
        <div class="flex items-center justify-between px-6 py-5 border-t border-white/10">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
              {{ isDelivered() ? 'Status' : 'Arriving in' }}
            </p>
            <p class="text-2xl font-black text-white flex items-center gap-2">
              <span *ngIf="isDelivered()" class="text-green-400">Complete</span>
              <span *ngIf="!isDelivered()">⏱️ {{ etaMinutes() }} mins</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Method</p>
            <p class="text-sm font-black text-red-400 capitalize">
              {{ order()?.deliveryType?.replace('_', ' ') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Fulfillment Stepper -->
      <div class="glass rounded-3xl p-6">
        <div class="relative space-y-6">
          <div class="absolute left-[19px] top-3 bottom-3 w-0.5 bg-white/10"></div>
          <div class="absolute left-[19px] top-3 w-0.5 bg-red-500 transition-all duration-1000"
            [style.height.%]="progressPct()"></div>

          <div *ngFor="let stage of stages; let i = index" class="flex gap-4 relative z-10">
            <div [class]="i <= stageIdx() ? 'w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg' : 'w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/30 flex items-center justify-center font-bold text-sm shrink-0'">
              {{ stage.emoji }}
            </div>
            <div>
              <p class="text-sm font-bold text-white">{{ stage.label }}</p>
              <p class="text-xs text-white/50 mt-0.5">{{ stage.sub }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  order = signal<OrderDto | null>(null);
  loading = signal(true);

  // Stepper state
  stageIdx = signal(0);
  progressPct = signal(0);
  etaMinutes = signal(30);

  private intervalId: any;

  stages: Stage[] = [
    { key: 'placed', label: 'Order Placed', sub: 'The store received your order', emoji: '✓' },
    { key: 'preparing', label: 'Preparing', sub: 'Your pizza is in the oven', emoji: '🧑‍🍳' },
    { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'Your driver is on the way', emoji: '🚴' },
    { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal!', emoji: '🎁' }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const orderId = params.get('id');
      if (orderId) {
        this.loadOrder(orderId);
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadOrder(orderId: string) {
    this.loading.set(true);
    // Find order DTO
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        const matched = orders.find(o => o.id === orderId);
        if (matched) {
          this.order.set(matched);
          this.etaMinutes.set(matched.estimatedEtaMin || 30);
          this.startSimulation();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  startSimulation() {
    this.stageIdx.set(0);
    this.progressPct.set(0);

    // Simulate stage updates every 8 seconds for visual testing
    this.intervalId = setInterval(() => {
      const current = this.stageIdx();
      if (current < this.stages.length - 1) {
        this.stageIdx.set(current + 1);
        this.progressPct.set(((current + 1) / (this.stages.length - 1)) * 100);
        this.etaMinutes.update(m => Math.max(5, m - 7));
      } else {
        clearInterval(this.intervalId);
      }
    }, 8000);
  }

  isDelivered(): boolean {
    return this.stageIdx() === this.stages.length - 1;
  }
}
