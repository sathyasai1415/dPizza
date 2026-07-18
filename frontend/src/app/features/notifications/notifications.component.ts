import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notif { id: string; icon: string; title: string; body: string; time: string; read: boolean; }

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Switch parent classes below between bg-neutral-950 (dark) and bg-neutral-50 (light) to see the adaptive magic -->
    <div class="w-full max-w-2xl mx-auto py-6 px-4 space-y-5 transition-colors duration-300 bg-transparent text-slate-900 dark:text-white">
      
      <!-- Header Area -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-[#E53935] dark:text-[#D4AF37]">Notifications</h1>
          <p class="text-sm mt-1 text-neutral-600 dark:text-neutral-400">{{ unread() }} unread</p>
        </div>
        <button (click)="markAll()" aria-label="Mark all notifications as read" class="text-xs font-bold text-[#E53935] hover:text-red-600 dark:text-[#D4AF37] dark:hover:text-[#FF8A00] transition cursor-pointer">
          Mark all read
        </button>
      </div>

      <!-- Toggle Panel -->
      <div class="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xl" aria-hidden="true">🔔</span>
          <div>
            <p class="text-sm font-bold text-neutral-900 dark:text-white">Push Notifications</p>
            <p class="text-[11px] text-neutral-600 dark:text-neutral-400">Order updates & deal alerts</p>
          </div>
        </div>
        <button (click)="pushOn.set(!pushOn())" aria-label="Toggle push notifications" [aria-checked]="pushOn()" role="switch"
          [class]="'w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer ' + (pushOn() ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700')">
          <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm" [style.left]="pushOn() ? '22px' : '2px'"></span>
        </button>
      </div>

      <!-- Feed Container -->
      <div class="space-y-3" role="list">
        @for (n of items(); track n.id) {
          <div (click)="markRead(n.id)"
            tabindex="0"
            role="listitem"
            (keydown.enter)="markRead(n.id)"
            (keydown.space)="markRead(n.id); $event.preventDefault()"
            [aria-label]="'Notification: ' + n.title + '. ' + n.body"
            [class]="'glass-card p-4 flex gap-3.5 cursor-pointer transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ' + 
              (n.read 
                ? 'opacity-50 hover:opacity-100 border-transparent' 
                : 'border-[#D4AF37]/45 dark:border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(212,175,55,0.08)]')">
            
            <!-- Icon Frame -->
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#FF8A00]/5 text-[#D4AF37] flex items-center justify-center text-lg shrink-0 border border-[#D4AF37]/30 shadow-inner">
              {{ n.icon }}
            </div>

            <!-- Context Block -->
            <div class="flex-1 min-w-0">
              <!-- Dynamically shifts title color: Slate-800 on white backgrounds / Pure white on dark backgrounds -->
              <p [class]="'text-sm font-bold transition-colors ' + 
                (n.read 
                  ? 'text-neutral-400 dark:text-neutral-500' 
                  : 'text-neutral-800 dark:text-white')">
                {{ n.title }}
              </p>
              <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-normal">
                {{ n.body }}
              </p>
              <span class="inline-block text-[10px] bg-[#D4AF37]/10 text-[#755a0f] dark:bg-[#D4AF37]/10 dark:text-[#E6C96F] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mt-2">
                {{ n.time }}
              </span>
            </div>

            <!-- Unread Status Dot -->
            @if (!n.read) {
              <span class="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5 shadow-[0_0_8px_rgba(212,175,55,0.6)]" aria-label="Unread"></span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      /* Uses adaptive variables that read whether the component is on a black or white wrapper */
      background: rgba(255, 255, 255, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    /* Target standard dark-mode queries seamlessly */
    @media (prefers-color-scheme: dark) {
      .glass-card {
        background: rgba(30, 30, 35, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
    }

    /* Alternatively applies if a .dark utility wrapper handles your layout */
    :host-context(.dark) .glass-card,
    :host-context([data-theme="dark"]) .glass-card {
      background: rgba(20, 20, 25, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
  `]
})
export class NotificationsComponent implements OnInit {
  pushOn = signal(true);
  items = signal<Notif[]>([]);
  unread = () => this.items().filter(n => !n.read).length;

  ngOnInit(): void {
    this.items.set([
      { id: '1', icon: '🍕', title: 'Order on the way!', body: 'Your order from Shamz Pizza is out for delivery.', time: '2 min ago', read: false },
      { id: '2', icon: '🏷️', title: 'New deal near you', body: "Marco's is running BOGO on all large pizzas today.", time: '1 hour ago', read: false },
      { id: '3', icon: '⭐', title: 'Rate your last order', body: 'How was your pizza from Detroit Deep Dish?', time: 'Yesterday', read: true },
      { id: '4', icon: '🎁', title: 'You earned 50 points', body: 'Points added from your recent order. Redeem for rewards!', time: '2 days ago', read: true },
    ]);
  }

  markRead(id: string): void {
    this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }
  markAll(): void {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }
}
