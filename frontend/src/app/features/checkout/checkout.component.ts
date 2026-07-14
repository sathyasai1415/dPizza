import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-2xl mx-auto py-8">
      <h2 class="text-3xl font-black text-brand-black mb-8 tracking-tight">Checkout</h2>

      <div class="clay rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
        
        <div *ngIf="error()" class="bg-brand-red text-brand-white border border-brand-red text-brand-red p-4 rounded-xl text-sm font-medium">
          {{ error() }}
        </div>

        <div class="bg-blue-500/15 border border-blue-500/30 text-blue-300 p-4 rounded-xl flex gap-3 text-sm font-medium">
          <span>ℹ️</span>
          <p>
            {{ paymentMethod() === 'CARD' 
              ? 'Complete payment securely via mock Stripe Credit Card checkout.' 
              : 'You pay when your order is delivered or picked up in store.' }}
          </p>
        </div>

        <!-- DELIVERY SETTINGS -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-brand-black flex items-center gap-2 border-b border-brand-black pb-2">
            📍 Delivery Details
          </h3>
          
          <div class="flex gap-4">
            <button type="button" (click)="setDeliveryType('delivery')"
              [class]="deliveryType() === 'delivery' ? 'flex-1 py-3 rounded-xl font-bold bg-brand-red text-brand-white' : 'flex-1 py-3 rounded-xl font-bold bg-brand-white text-brand-black border border-brand-black hover:bg-brand-white transition'">
              Delivery
            </button>
            <button type="button" (click)="setDeliveryType('pickup')"
              [class]="deliveryType() === 'pickup' ? 'flex-1 py-3 rounded-xl font-bold bg-brand-red text-brand-white' : 'flex-1 py-3 rounded-xl font-bold bg-brand-white text-brand-black border border-brand-black hover:bg-brand-white transition'">
              Pickup
            </button>
          </div>

          <div *ngIf="deliveryType() === 'delivery'" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-brand-black uppercase mb-1">Street Address</label>
              <input type="text" [(ngModel)]="address" placeholder="123 Michigan Ave, Detroit, MI" required
                class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label class="block text-xs font-bold text-brand-black uppercase mb-1">Instructions for Courier</label>
              <input type="text" [(ngModel)]="notes" placeholder="Drop off at front gate or dial 045"
                class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>
        </div>

        <!-- PAYMENT METHOD -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-brand-black flex items-center gap-2 border-b border-brand-black pb-2">
            💳 Payment Method
          </h3>
          <div class="space-y-2">
            <button *ngIf="deliveryType() === 'delivery'" (click)="setPaymentMethod('CASH_ON_DELIVERY')"
              [class]="paymentMethod() === 'CASH_ON_DELIVERY' ? 'w-full flex items-center justify-between p-4 rounded-xl border border-brand-red bg-brand-red text-brand-white text-left' : 'w-full flex items-center justify-between p-4 rounded-xl border border-brand-black bg-brand-white text-left hover:border-brand-black transition'">
              <div>
                <p class="text-sm font-bold text-brand-black">Cash on Delivery</p>
                <p class="text-xs text-brand-black">Pay the courier directly when order arrives</p>
              </div>
              <span *ngIf="paymentMethod() === 'CASH_ON_DELIVERY'" class="text-brand-red font-bold">✓</span>
            </button>

            <button (click)="setPaymentMethod('PAY_AT_STORE')"
              [class]="paymentMethod() === 'PAY_AT_STORE' ? 'w-full flex items-center justify-between p-4 rounded-xl border border-brand-red bg-brand-red text-brand-white text-left' : 'w-full flex items-center justify-between p-4 rounded-xl border border-brand-black bg-brand-white text-left hover:border-brand-black transition'">
              <div>
                <p class="text-sm font-bold text-brand-black">Pay at Store</p>
                <p class="text-xs text-brand-black">Pay cash or card at the counter</p>
              </div>
              <span *ngIf="paymentMethod() === 'PAY_AT_STORE'" class="text-brand-red font-bold">✓</span>
            </button>

            <div class="w-full flex items-center justify-between p-4 rounded-xl border border-brand-black bg-brand-white text-left opacity-50 cursor-not-allowed">
              <div>
                <p class="text-sm font-bold text-brand-black">💳 Credit / Debit Card</p>
                <p class="text-xs text-brand-black">Coming Soon — Stripe integration in progress</p>
              </div>
              <span class="text-[10px] font-black text-brand-orange text-brand-orange font-bold px-2 py-1 rounded-full">SOON</span>
            </div>
          </div>
        </div>

        <!-- MOCK STRIPE CREDIT CARD FORM -->
        <div *ngIf="paymentMethod() === 'CARD'" class="p-5 border border-brand-black rounded-2xl bg-brand-white space-y-4">
          <h4 class="text-sm font-black text-brand-black">Credit Card Information</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-[10px] text-brand-black uppercase mb-1">Card Number</label>
              <input type="text" [(ngModel)]="cardNumber" placeholder="4242 4242 4242 4242"
                class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black text-xs outline-none focus:border-brand-red" />
            </div>
            <div>
              <label class="block text-[10px] text-brand-black uppercase mb-1">Expiry / CVV</label>
              <input type="text" [(ngModel)]="cardExpCvv" placeholder="12/28 123"
                class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black text-xs outline-none focus:border-brand-red" />
            </div>
          </div>
        </div>

        <!-- ORDER PLACEMENT BUTTONS -->
        <div class="border-t border-brand-black pt-6 mt-6 flex gap-4">
          <button (click)="cancel()" [disabled]="loading()"
            class="flex-1 py-3.5 rounded-xl font-bold bg-brand-white border border-brand-black hover:bg-brand-white text-brand-black transition disabled:opacity-50">
            Cancel
          </button>
          <button (click)="confirmOrder()" [disabled]="loading()"
            class="flex-[2] py-3.5 rounded-xl font-black text-brand-black text-sm shadow-lg hover:hover:transition duration-200">
            {{ loading() ? 'Processing...' : 'Place Order' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);

  deliveryType = signal('delivery');
  paymentMethod = signal('CASH_ON_DELIVERY');
  address = '';
  notes = '';
  loading = signal(false);
  error = signal('');

  // Card details
  cardNumber = '';
  cardExpCvv = '';

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  setDeliveryType(type: string) {
    this.deliveryType.set(type);
    if (type === 'pickup') {
      this.paymentMethod.set('PAY_AT_STORE');
    } else {
      this.paymentMethod.set('CASH_ON_DELIVERY');
    }
  }

  setPaymentMethod(method: string) {
    this.paymentMethod.set(method);
  }

  cancel() {
    this.router.navigate(['/cart']);
  }

  confirmOrder() {
    if (this.deliveryType() === 'delivery' && this.address.trim().length < 6) {
      this.error.set('Please enter a valid delivery address.');
      return;
    }

    if (this.paymentMethod() === 'CARD' && this.cardNumber.trim().length < 12) {
      this.error.set('Please enter a valid mock card number.');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    const request = {
      deliveryType: this.deliveryType() === 'delivery' ? 'STORE_DELIVERY' : 'PICKUP',
      deliveryProvider: 'store',
      deliveryAddress: this.address,
      deliveryNotes: this.notes,
      tip: 0,
      paymentMethod: this.paymentMethod()
    };

    this.orderService.placeOrder(request).subscribe({
      next: (order) => {
        if (this.paymentMethod() === 'CARD') {
          // Process Stripe payment simulation
          this.paymentService.createStripeIntent(order.id).subscribe({
            next: (intent) => {
              this.paymentService.confirmStripePayment(intent.paymentIntentId).subscribe({
                next: () => {
                  this.loading.set(false);
                  this.cartService.clearCart().subscribe();
                  this.router.navigate(['/orders']);
                },
                error: (err) => {
                  this.loading.set(false);
                  this.error.set('Card authorization succeeded but capture failed. Order created as pending.');
                }
              });
            },
            error: (err) => {
              this.loading.set(false);
              this.error.set('Failed to generate mock Stripe PaymentIntent.');
            }
          });
        } else {
          // Cash/Pay-at-counter orders
          this.loading.set(false);
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/orders']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to place order. Try again.');
      }
    });
  }
}
