import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto py-8">
      <h2 class="text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-8">
        🛒 Shopping Cart
      </h2>

      <div *ngIf="cartService.items().length === 0" class="w-full py-16 text-center glass rounded-[32px] p-8">
        <div class="text-6xl mb-4">🛒</div>
        <h2 class="text-2xl font-black text-white mb-2">Your cart is empty</h2>
        <p class="text-white/50 mb-6">Looks like you haven't added any items or deals yet.</p>
        <a routerLink="/home" class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition">
          Start Browsing
        </a>
      </div>

      <div *ngIf="cartService.items().length > 0" class="grid lg:grid-cols-3 gap-8">
        <!-- CART ITEMS LIST -->
        <div class="lg:col-span-2 space-y-4">
          <div *ngFor="let item of cartService.items()" 
            class="glass p-5 rounded-3xl flex flex-col sm:flex-row gap-4 relative overflow-hidden group">
            
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
                    {{ cartService.cart()?.restaurantName }}
                  </p>
                  <h3 class="font-bold text-lg text-white">{{ item.itemName }}</h3>
                </div>
                <p class="font-black text-white text-lg">
                  {{ item.unitPrice * item.quantity | currency }}
                </p>
              </div>

              <!-- Pizza customizable configuration summary -->
              <div *ngIf="item.size || item.crust" class="text-xs text-white/50 mt-1 space-y-1">
                <p>{{ item.size }} • {{ item.crust }} <span *ngIf="item.sauce">• {{ item.sauce }}</span></p>
                <div *ngIf="item.toppings && item.toppings.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span *ngFor="let top of item.toppings" class="bg-white/5 text-white/70 px-2 py-0.5 rounded text-[10px]">
                    {{ top.toppingName }}
                  </span>
                </div>
              </div>

              <div *ngIf="item.notes" class="text-xs text-white/40 mt-2 bg-black/20 p-2 rounded-lg italic">
                Note: "{{ item.notes }}"
              </div>
            </div>

            <!-- Quantity & remove action -->
            <div class="flex sm:flex-col items-center justify-between border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-4">
              <div class="flex items-center gap-3 bg-white/5 rounded-xl p-1 shrink-0">
                <button (click)="updateQuantity(item.id, item.quantity - 1)" class="p-1 rounded-lg hover:bg-white/10 text-white/70">
                  -
                </button>
                <span class="font-bold text-sm w-4 text-center">{{ item.quantity }}</span>
                <button (click)="updateQuantity(item.id, item.quantity + 1)" class="p-1 rounded-lg hover:bg-white/10 text-white/70">
                  +
                </button>
              </div>

              <button (click)="removeItem(item.id)" class="text-white/40 hover:text-red-500 p-2 transition">
                🗑️
              </button>
            </div>

          </div>
        </div>

        <!-- PRICING SUMMARY -->
        <div>
          <div class="glass rounded-3xl p-6 text-white sticky top-6 space-y-6">
            <h3 class="text-xl font-black border-b border-white/10 pb-4">Order Summary</h3>

            <div class="space-y-3 text-sm font-medium text-white/60">
              <div class="flex justify-between">
                <span>Pizza Subtotal</span>
                <span class="text-white">{{ getSubtotal() | currency }}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated Tax (8.25%)</span>
                <span class="text-white">{{ getTax() | currency }}</span>
              </div>
              <div class="flex justify-between">
                <span>Platform Service Fee</span>
                <span class="text-white">{{ platformFee | currency }}</span>
              </div>
              <div *ngIf="cartService.cart()?.couponCode" class="flex justify-between text-green-400">
                <span>Coupon ({{ cartService.cart()?.couponCode }}) Applied</span>
                <span>Active</span>
              </div>
              
              <div class="flex justify-between border-t border-white/10 pt-4 mt-2">
                <span class="text-lg font-black text-white">Final Total</span>
                <span class="text-lg font-black text-green-400">{{ getGrandTotal() | currency }}</span>
              </div>
            </div>

            <!-- Apply Coupon Input -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-white/40 uppercase">Have a promo code?</label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="couponCode" placeholder="COUPON"
                  class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
                <button (click)="applyPromo()" class="bg-white/10 hover:bg-white/15 px-4 rounded-xl text-sm font-bold transition">
                  Apply
                </button>
              </div>
              <p *ngIf="couponMessage()" class="text-xs font-bold text-green-400">{{ couponMessage() }}</p>
            </div>

            <button (click)="goToCheckout()"
              class="w-full py-4 rounded-xl font-black bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-center">
              Proceed to Checkout ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  couponCode = '';
  couponMessage = signal('');
  platformFee = 1.99;

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  getSubtotal(): number {
    return this.cartService.items().reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
  }

  getTax(): number {
    return this.getSubtotal() * 0.0825;
  }

  getGrandTotal(): number {
    const sub = this.getSubtotal();
    return sub + this.getTax() + this.platformFee;
  }

  updateQuantity(itemId: string, qty: number) {
    if (qty <= 0) {
      this.removeItem(itemId);
    } else {
      this.cartService.updateCartItem(itemId, qty).subscribe();
    }
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId).subscribe();
  }

  applyPromo() {
    if (!this.couponCode.trim()) return;
    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: () => {
        this.couponMessage.set('Coupon applied successfully!');
      },
      error: (err) => {
        this.couponMessage.set(err.error?.message || 'Invalid coupon code');
      }
    });
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
