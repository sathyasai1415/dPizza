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
    <div class="cart">

      <div class="top">
        <h1>My Cart</h1>
        @if (cartService.cartItemCount() > 0) {
          <span class="cnt">{{ cartService.cartItemCount() }} item{{ cartService.cartItemCount() > 1 ? 's' : '' }}</span>
        }
        @if (cartService.items().length > 0) {
          <button class="clear" (click)="confirmClear()">Clear</button>
        }
      </div>
      @if (cartService.cart()?.restaurantName) {
        <p class="from">📍 Ordering from <b>{{ cartService.cart()?.restaurantName }}</b></p>
      }

      <!-- Empty -->
      @if (cartService.items().length === 0) {
        <div class="empty">
          <p class="ico">🛒</p>
          <p class="t">Your cart is empty</p>
          <p class="s">Add pizzas from the builder or compare prices near you.</p>
          <div class="ebtns">
            <a routerLink="/builder" class="pri">🍕 Build a Pizza</a>
            <a routerLink="/compare" class="sec">Compare prices</a>
          </div>
        </div>
      } @else {

        <!-- Items -->
        <div class="items">
          @for (item of cartService.items(); track item.id) {
            <div class="item">
              <div class="th">🍕</div>
              <div class="m">
                <h5>{{ item.itemName }}</h5>
                <p>{{ item.size }}@if (item.crust) { · {{ item.crust }}}</p>
                <div class="ip">{{ (item.unitPrice * item.quantity) | currency }}</div>
              </div>
              <div class="step">
                <button class="qbtn plus" (click)="updateQty(item.id, item.quantity + 1)" aria-label="Add one">
                  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <span class="q">{{ item.quantity }}</span>
                <button class="qbtn" (click)="updateQty(item.id, item.quantity - 1)" aria-label="Remove one">
                  <svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Coupon -->
        <div class="coupon">
          <input type="text" [(ngModel)]="couponCode" placeholder="Promo code" />
          <button (click)="applyPromo()">Apply</button>
        </div>
        @if (couponMsg()) {
          <p class="cmsg" [class.ok]="couponOk()">{{ couponMsg() }}</p>
        }

        <!-- Summary -->
        <div class="summary">
          <div class="srow">Subtotal <b>{{ subtotal() | currency }}</b></div>
          <div class="srow">Platform fee <b>{{ platformFee | currency }}</b></div>
          <div class="srow">Tax (8.25%) <b>{{ tax() | currency }}</b></div>
          @if (cartService.cart()?.couponCode) {
            <div class="srow save">Coupon {{ cartService.cart()?.couponCode }} <b>applied 🎉</b></div>
          }
          <div class="sdiv"></div>
          <div class="srow total">Total <span class="big">{{ grandTotal() | currency }}</span></div>
        </div>

        <button class="checkout" (click)="goCheckout()">
          <span class="go">🧾 Checkout</span>
          <span class="amt">{{ grandTotal() | currency }}</span>
        </button>
        <a routerLink="/builder" class="addmore">+ Add more items</a>
      }
    </div>
  `,
  styles: [`
    :host{
      --o:#FF6A13; --o2:#F0530A; --o-soft:#FFE7D3;
      --cream:#FBF4EA; --surface:#FFFFFF; --warm:#F2E9DA;
      --ink:#241C15; --muted:#9B8B77; --faint:#C9BBA8;
      --espresso:#20140C; --tomato:#E5462F; --basil:#4E9B5A;
      --line:rgba(36,28,21,.10);
      display:block; min-height:100%; background:var(--cream); color:var(--ink);
      font-family:"Plus Jakarta Sans", ui-rounded, system-ui, sans-serif;
    }
    .cart{max-width:640px; margin:0 auto; padding:18px 18px 40px; display:flex; flex-direction:column; gap:14px;}
    .top{display:flex; align-items:center; gap:12px;}
    .top h1{font-weight:800; font-size:22px; letter-spacing:-.02em;}
    .cnt{font-size:12px; font-weight:700; color:var(--o); background:var(--o-soft); padding:6px 11px; border-radius:999px;}
    .top .clear{margin-left:auto; background:none; border:1px solid var(--line); color:var(--muted); font-weight:700;
      font-size:12px; padding:8px 14px; border-radius:11px; cursor:pointer; font-family:inherit;}
    .top .clear:hover{border-color:var(--tomato); color:var(--tomato);}
    .from{font-size:12.5px; color:var(--muted); font-weight:600; margin-top:-4px;}
    .from b{color:var(--ink);}

    .empty{text-align:center; padding:48px 20px; background:var(--surface); border:1px solid var(--line); border-radius:22px;}
    .empty .ico{font-size:50px;}
    .empty .t{font-weight:800; font-size:19px; margin-top:10px;}
    .empty .s{font-size:13.5px; color:var(--muted); margin-top:6px;}
    .ebtns{display:flex; gap:10px; justify-content:center; margin-top:18px; flex-wrap:wrap;}
    .ebtns .pri{background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; padding:12px 20px; border-radius:13px; font-weight:800; text-decoration:none;}
    .ebtns .sec{background:var(--warm); color:var(--ink); padding:12px 20px; border-radius:13px; font-weight:800; text-decoration:none;}

    .items{display:flex; flex-direction:column; gap:12px;}
    .item{display:flex; align-items:center; gap:13px; background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:12px;
      box-shadow:0 6px 16px -14px rgba(120,70,20,.5);}
    .item .th{width:60px; height:60px; border-radius:14px; background:radial-gradient(circle at 50% 42%,#FFF0DC,#FBE7CE);
      display:grid; place-items:center; font-size:28px; flex:none;}
    .item .m{flex:1; min-width:0;}
    .item .m h5{font-weight:800; font-size:14.5px; letter-spacing:-.01em;}
    .item .m p{font-size:11.5px; color:var(--muted); font-weight:600; margin:2px 0 6px; text-transform:capitalize;}
    .item .m .ip{font-weight:800; font-size:15px; color:var(--o);}
    .step{display:flex; flex-direction:column; align-items:center; gap:6px; flex:none;}
    .qbtn{width:30px; height:30px; border-radius:10px; border:1px solid var(--line); background:var(--cream);
      display:grid; place-items:center; cursor:pointer; color:var(--ink);}
    .qbtn svg{width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:2.6; stroke-linecap:round;}
    .qbtn.plus{background:linear-gradient(180deg,#FF7A22,#F0530A); border-color:transparent;}
    .qbtn.plus svg{stroke:#fff;}
    .step .q{font-weight:800; font-size:15px;}

    .coupon{display:flex; gap:10px;}
    .coupon input{flex:1; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:0 15px; height:48px;
      font-size:14px; font-weight:600; color:var(--ink); outline:none; font-family:inherit;}
    .coupon input::placeholder{color:var(--faint);}
    .coupon input:focus{border-color:var(--o);}
    .coupon button{background:var(--warm); border:none; border-radius:14px; padding:0 20px; font-weight:800; font-size:14px; color:var(--ink); cursor:pointer; font-family:inherit;}
    .cmsg{font-size:12px; font-weight:700; color:var(--tomato); margin-top:-6px;}
    .cmsg.ok{color:#2f7d43;}

    .summary{background:var(--surface); border:1px solid var(--line); border-radius:20px; padding:18px;
      box-shadow:0 10px 26px -18px rgba(120,70,20,.5);}
    .srow{display:flex; justify-content:space-between; align-items:center; font-size:13.5px; font-weight:600; color:var(--muted); margin-bottom:12px;}
    .srow b{color:var(--ink); font-weight:700;}
    .srow.save{color:var(--basil);} .srow.save b{color:var(--basil);}
    .sdiv{height:1px; background:var(--line); margin:4px 0 14px;}
    .srow.total{margin-bottom:0; font-size:15px; color:var(--ink); font-weight:700;}
    .srow.total .big{font-weight:800; font-size:22px; color:var(--o);}

    .checkout{display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; padding:17px 22px; border-radius:16px;
      background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; border:none; cursor:pointer; font-weight:800; font-size:16px;
      box-shadow:0 16px 28px -12px rgba(240,83,10,.6); font-family:inherit;}
    .checkout:hover{opacity:.95;}
    .checkout .go{display:flex; align-items:center; gap:8px;}
    .addmore{text-align:center; font-size:13.5px; font-weight:800; color:var(--o); text-decoration:none; padding:4px;}
    .addmore:hover{text-decoration:underline;}

    button:focus-visible, a:focus-visible{outline:2px solid var(--o); outline-offset:2px;}
  `]
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
