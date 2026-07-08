import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full max-w-3xl mx-auto py-2 space-y-6">
      <h1 class="text-3xl font-black text-white">Legal &amp; Policies</h1>

      <div class="flex flex-wrap gap-2">
        @for (t of tabs; track t; let i = $index) {
          <button (click)="active = i"
            [class]="'px-4 py-2 rounded-xl text-xs font-black transition ' + (active === i ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10')">
            {{ t }}
          </button>
        }
      </div>

      <div class="glass rounded-3xl p-6 space-y-4 text-sm text-white/60 leading-relaxed">
        @if (active === 0) {
          <h2 class="text-lg font-black text-white">Terms of Service</h2>
          <p>By using MiSlice you agree to browse, build, and order pizza through our marketplace. MiSlice connects you with independent Michigan pizzerias; each store is responsible for preparing and fulfilling its own orders.</p>
          <p>Prices shown are provided by partner stores and may change. Orders are placed directly with the store of your choice. Payment is collected on delivery or at the store.</p>
        }
        @if (active === 1) {
          <h2 class="text-lg font-black text-white">Privacy Policy</h2>
          <p>We collect only what we need to run the marketplace: your account details, order history, and dietary preferences you choose to save. We never sell your personal data.</p>
          <p>Notification tokens are stored only to send you order and deal updates, and can be turned off any time from your notification settings.</p>
        }
        @if (active === 2) {
          <h2 class="text-lg font-black text-white">Refund Policy</h2>
          <p>Refunds and order issues are handled by the store that fulfilled your order. Contact the store directly, or reach our support team and we'll help mediate.</p>
        }
      </div>
      <p class="text-center text-[11px] text-white/25">MiSlice © 2026 · Michigan</p>
    </div>
  `,
})
export class LegalComponent {
  tabs = ['Terms', 'Privacy', 'Refunds'];
  active = 0;
}
