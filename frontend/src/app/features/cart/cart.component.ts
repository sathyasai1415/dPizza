import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-8">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-brand-black tracking-tight flex items-center gap-3">
            🛒 Shopping Cart
            <span *ngIf="cartService.cartItemCount() > 0"
              class="text-sm font-bold bg-brand-red text-brand-white px-2.5 py-1 rounded-full">
              {{ cartService.cartItemCount() }} item{{ cartService.cartItemCount() > 1 ? 's' : '' }}
            </span>
          </h1>
          <p class="text-brand-black text-sm mt-1" *ngIf="cartService.cart()?.restaurantName">
            📍 Ordering from <span class="text-brand-red font-bold">{{ cartService.cart()?.restaurantName }}</span>
          </p>
        </div>
        <div *ngIf="cartService.items().length > 0" class="flex gap-3">
          <button (click)="confirmClear()" class="px-4 py-2 rounded-xl text-xs font-bold text-brand-black border border-brand-black hover:border-brand-red hover:text-brand-red transition">
            🗑️ Clear Cart
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="cartService.items().length === 0" class="text-center py-20 glass rounded-3xl">
        <div class="text-7xl mb-4">🛒</div>
        <h2 class="text-2xl font-black text-brand-black mb-2">Your cart is empty</h2>
        <p class="text-brand-black mb-8">Add pizzas from the builder or browse deals</p>
        <div class="flex gap-3 justify-center">
          <a routerLink="/builder" class="px-6 py-3 rounded-xl font-bold text-brand-black hover:hover:transition">
            🍕 Build a Pizza
          </a>
          <a routerLink="/home" class="px-6 py-3 rounded-xl font-bold bg-brand-white border border-brand-black text-brand-black hover:bg-brand-white transition">
            Browse Stores
          </a>
        </div>
      </div>

      <!-- Cart Data Table + Summary -->
      <div *ngIf="cartService.items().length > 0" class="grid lg:grid-cols-3 gap-6">

        <!-- LEFT: Items Table -->
        <div class="lg:col-span-2 space-y-4">

          <!-- Cart Items Table -->
          <div class="clay rounded-3xl overflow-hidden">
            <div class="px-6 py-4 border-b border-brand-black flex items-center justify-between">
              <h2 class="text-base font-black text-brand-black">Cart Items</h2>
              <span class="text-xs text-brand-black font-medium">{{ cartService.items().length }} row{{ cartService.items().length > 1 ? 's' : '' }} in database</span>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] font-black uppercase tracking-widest text-brand-black border-b border-brand-black">
                    <th class="text-left px-4 py-3">Item Name</th>
                    <th class="text-left px-4 py-3">Configuration</th>
                    <th class="text-left px-4 py-3">Toppings</th>
                    <th class="text-center px-4 py-3">Qty</th>
                    <th class="text-right px-4 py-3">Unit $</th>
                    <th class="text-right px-4 py-3">Total</th>
                    <th class="text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of cartService.items(); let i = index"
                    class="border-b border-brand-black hover:bg-brand-white transition group">

                    <!-- Item Name -->
                    <td class="px-4 py-4">
                      <div class="font-bold text-brand-black text-sm">{{ item.itemName }}</div>
                      <div *ngIf="item.notes" class="text-[10px] text-brand-black mt-0.5 italic truncate max-w-[140px]">
                        {{ item.notes }}
                      </div>
                    </td>

                    <!-- Config (size / crust / sauce) -->
                    <td class="px-4 py-4">
                      <div class="space-y-0.5">
                        <span *ngIf="item.size" class="block text-xs text-brand-black">📏 {{ item.size }}</span>
                        <span *ngIf="item.crust" class="block text-xs text-brand-black">🥐 {{ item.crust }}</span>
                        <span *ngIf="item.sauce" class="block text-xs text-brand-black">🍅 {{ item.sauce }}</span>
                      </div>
                    </td>

                    <!-- Toppings -->
                    <td class="px-4 py-4">
                      <div class="flex flex-wrap gap-1 max-w-[160px]">
                        <span *ngFor="let t of item.toppings"
                          class="bg-brand-red text-brand-white text-brand-red text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-brand-red">
                          {{ t.toppingName }}
                        </span>
                        <span *ngIf="!item.toppings || item.toppings.length === 0" class="text-brand-black text-xs">—</span>
                      </div>
                    </td>

                    <!-- Quantity Control -->
                    <td class="px-4 py-4">
                      <div class="flex items-center justify-center gap-1 bg-brand-white rounded-lg p-1 w-fit mx-auto">
                        <button (click)="updateQty(item.id, item.quantity - 1)"
                          class="w-6 h-6 rounded-md bg-brand-white hover:bg-brand-red text-brand-white font-black text-xs transition flex items-center justify-center">
                          −
                        </button>
                        <span class="font-black text-brand-black text-sm w-6 text-center">{{ item.quantity }}</span>
                        <button (click)="updateQty(item.id, item.quantity + 1)"
                          class="w-6 h-6 rounded-md bg-brand-white hover:bg-green-600/40 text-brand-black font-black text-xs transition flex items-center justify-center">
                          +
                        </button>
                      </div>
                    </td>

                    <!-- Unit Price -->
                    <td class="px-4 py-4 text-right">
                      <span class="text-brand-black font-medium text-sm">{{ item.unitPrice | currency }}</span>
                    </td>

                    <!-- Line Total -->
                    <td class="px-4 py-4 text-right">
                      <span class="text-brand-black font-black text-sm">{{ (item.unitPrice * item.quantity) | currency }}</span>
                    </td>

                    <!-- Remove -->
                    <td class="px-4 py-4 text-center">
                      <button (click)="removeItem(item.id)"
                        class="p-1.5 rounded-lg hover:bg-brand-red text-brand-white hover:text-brand-red transition opacity-0 group-hover:opacity-100">
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>

                <!-- Table Totals Footer -->
                <tfoot class="bg-brand-white border-t border-brand-black">
                  <tr>
                    <td colspan="5" class="px-4 py-3 text-right text-xs font-bold text-brand-black uppercase tracking-widest">Subtotal</td>
                    <td class="px-4 py-3 text-right font-black text-brand-black">{{ subtotal() | currency }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="5" class="px-4 py-2 text-right text-xs font-bold text-brand-black uppercase tracking-widest">Tax (8.25%)</td>
                    <td class="px-4 py-2 text-right font-semibold text-brand-black">{{ tax() | currency }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colspan="5" class="px-4 py-2 text-right text-xs font-bold text-brand-black uppercase tracking-widest">Platform Fee</td>
                    <td class="px-4 py-2 text-right font-semibold text-brand-black">{{ platformFee | currency }}</td>
                    <td></td>
                  </tr>
                  <tr class="border-t border-brand-black">
                    <td colspan="5" class="px-4 py-4 text-right text-sm font-black text-brand-black uppercase tracking-widest">Grand Total</td>
                    <td class="px-4 py-4 text-right font-black text-brand-green text-lg">{{ grandTotal() | currency }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Coupon Row -->
          <div class="clay rounded-2xl p-4 flex gap-3 items-end">
            <div class="flex-1">
              <label class="block text-[10px] font-black text-brand-black uppercase tracking-widest mb-1">Promo Code</label>
              <input type="text" [(ngModel)]="couponCode" placeholder="Enter coupon code"
                class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <button (click)="applyPromo()"
              class="px-5 py-2.5 rounded-xl font-bold text-sm bg-brand-white hover:bg-brand-white border border-brand-black text-brand-black transition">
              Apply
            </button>
            <p *ngIf="couponMsg()" class="text-xs font-bold" [class.text-brand-green]="couponOk()" [class.text-brand-red]="!couponOk()">
              {{ couponMsg() }}
            </p>
          </div>
        </div>

        <!-- RIGHT: Order Summary + Checkout -->
        <div class="space-y-4">
          <div class="clay rounded-3xl p-6 sticky top-20 space-y-5">
            <h3 class="text-lg font-black text-brand-black border-b border-brand-black pb-4">Order Summary</h3>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-brand-black">
                <span>{{ cartService.cartItemCount() }} item{{ cartService.cartItemCount() > 1 ? 's' : '' }}</span>
                <span class="text-brand-black font-semibold">{{ subtotal() | currency }}</span>
              </div>
              <div class="flex justify-between text-brand-black">
                <span>Tax (8.25%)</span>
                <span class="text-brand-black font-semibold">{{ tax() | currency }}</span>
              </div>
              <div class="flex justify-between text-brand-black">
                <span>Platform Fee</span>
                <span class="text-brand-black font-semibold">{{ platformFee | currency }}</span>
              </div>
              <div *ngIf="cartService.cart()?.couponCode" class="flex justify-between text-brand-green font-bold">
                <span>Coupon Applied 🎉</span>
                <span>{{ cartService.cart()?.couponCode }}</span>
              </div>
              <div class="flex justify-between border-t border-brand-black pt-3 mt-2">
                <span class="font-black text-brand-black text-base">Total</span>
                <span class="font-black text-brand-green text-lg">{{ grandTotal() | currency }}</span>
              </div>
            </div>

            <!-- Database info badge -->
            <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex gap-2">
              <span class="text-brand-green text-sm">✅</span>
              <div>
                <p class="text-xs font-bold text-brand-green">Saved to Database</p>
                <p class="text-[10px] text-brand-black font-mono mt-0.5 break-all">{{ cartService.cart()?.id }}</p>
              </div>
            </div>

            <button (click)="goCheckout()"
              class="w-full py-4 rounded-2xl font-black text-brand-black hover:hover:shadow-lg shadow-red-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0">
              Proceed to Checkout ➡️
            </button>
            <a routerLink="/builder"
              class="block text-center text-sm font-bold text-brand-black hover:text-brand-black transition mt-2">
              + Add More Items
            </a>
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
  couponMsg = signal('');
  couponOk = signal(false);
  platformFee = 1.99;

  subtotal = computed(() =>
    this.cartService.items().reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0)
  );
  tax = computed(() => this.subtotal() * 0.0825);
  grandTotal = computed(() => this.subtotal() + this.tax() + this.platformFee);

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  updateQty(itemId: string, qty: number) {
    if (qty <= 0) this.removeItem(itemId);
    else this.cartService.updateCartItem(itemId, qty).subscribe();
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId).subscribe();
  }

  applyPromo() {
    if (!this.couponCode.trim()) return;
    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: () => { this.couponOk.set(true); this.couponMsg.set('✅ Coupon applied!'); },
      error: (e: any) => { this.couponOk.set(false); this.couponMsg.set(e.error?.message || 'Invalid code'); }
    });
  }

  confirmClear() {
    if (confirm('Clear all items from your cart?')) {
      this.cartService.clearCart().subscribe();
    }
  }

  goCheckout() {
    this.router.navigate(['/checkout']);
  }
}
