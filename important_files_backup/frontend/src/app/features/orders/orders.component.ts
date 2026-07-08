import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';
import { OrderDto } from '../../shared/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h2 class="text-3xl font-black text-white">Your Orders</h2>
        <p class="text-xs sm:text-sm text-white/50">Track live orders and view order history.</p>
      </div>

      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
      </div>

      <div *ngIf="!loading() && orders().length === 0" class="text-center py-12 glass rounded-3xl">
        <p class="text-white/40">You have no orders placed yet.</p>
      </div>

      <!-- ORDERS LIST -->
      <div *ngIf="!loading() && orders().length > 0" class="space-y-6">
        <div *ngFor="let order of orders()" class="glass rounded-[2rem] p-6 space-y-4">
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/10 pb-4">
            <div>
              <span class="text-[10px] font-black text-red-400 uppercase tracking-widest">{{ order.restaurantName }}</span>
              <h3 class="text-base font-bold text-white mt-0.5">Order #{{ order.orderNumber }}</h3>
              <p class="text-[10px] text-white/40 mt-0.5">Placed at {{ order.placedAt | date:'medium' }}</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3">
              <!-- Status Badge -->
              <span [class]="getStatusClass(order.status)" class="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                {{ order.status }}
              </span>
              <!-- Delivery status / Actions -->
              <a *ngIf="order.status === 'OUT_FOR_DELIVERY'" [routerLink]="['/orders/tracking', order.id]"
                class="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl font-bold transition">
                Track Courier 🚴
              </a>
            </div>
          </div>

          <!-- Items list -->
          <div class="space-y-2">
            <div *ngFor="let item of order.items" class="flex justify-between items-center text-xs text-white/70">
              <span>{{ item.quantity }}x {{ item.itemName }} ({{ item.size }})</span>
              <span class="font-bold">{{ item.lineTotal | currency }}</span>
            </div>
          </div>

          <!-- Total cost -->
          <div class="flex justify-between items-center pt-4 border-t border-white/5 text-sm">
            <span class="text-white/50">Total Charge</span>
            <span class="font-black text-green-400 text-lg">{{ order.total | currency }}</span>
          </div>

          <!-- Review Form (if delivered) -->
          <div *ngIf="order.status === 'DELIVERED'" class="bg-white/5 p-4 rounded-2xl space-y-3">
            <h4 class="text-xs font-bold text-white">Rate your order</h4>
            
            <div class="flex items-center gap-2">
              <span *ngFor="let star of [1,2,3,4,5]" (click)="setRating(order.id, star)" class="cursor-pointer text-lg">
                {{ star <= getRating(order.id) ? '★' : '☆' }}
              </span>
            </div>

            <div class="flex gap-2">
              <input type="text" [(ngModel)]="comments[order.id]" placeholder="Leave a review comment..."
                class="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500" />
              <button (click)="submitReview(order)" class="bg-red-600 hover:bg-red-500 px-4 rounded-xl text-xs font-bold transition">
                Submit
              </button>
            </div>
            <p *ngIf="reviewStatus[order.id]" class="text-[10px] text-green-400 font-bold">{{ reviewStatus[order.id] }}</p>
          </div>

        </div>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly reviewService = inject(ReviewService);

  orders = signal<OrderDto[]>([]);
  loading = signal(true);

  // Review states per order
  ratings: Record<string, number> = {};
  comments: Record<string, string> = {};
  reviewStatus: Record<string, string> = {};

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-500/20 text-green-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400';
      case 'PREPARING': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-white/10 text-white/70';
    }
  }

  setRating(orderId: string, rating: number) {
    this.ratings[orderId] = rating;
  }

  getRating(orderId: string): number {
    return this.ratings[orderId] || 5;
  }

  submitReview(order: OrderDto) {
    const rating = this.getRating(order.id);
    const comment = this.comments[order.id] || '';

    const reviewRequest = {
      restaurantId: order.restaurantId,
      orderId: order.id,
      rating: rating,
      comment: comment
    };

    this.reviewService.submitReview(reviewRequest).subscribe({
      next: () => {
        this.reviewStatus[order.id] = 'Review submitted. Thank you!';
        this.comments[order.id] = '';
      },
      error: () => {
        this.reviewStatus[order.id] = 'Failed to submit review.';
      }
    });
  }
}
