import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notif { id: string; icon: string; title: string; body: string; time: string; read: boolean; }

@Component({
  selector: 'app-notification-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Sidebar Slide-over Panel Backdrop -->
    <div *ngIf="isOpen()" (click)="isOpen.set(false)" 
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
    </div>

    <!-- Notification Side Panel -->
    <div [class]='"fixed top-0 right-0 z-50 h-screen w-full sm:w-96 notif-panel backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out transform " + (isOpen() ? "translate-x-0" : "translate-x-full")'>
      
      <div class="flex flex-col h-full p-6 relative">
        <!-- Close Button inside panel -->
        <button (click)="isOpen.set(false)" aria-label="Close notifications list"
          class="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#D4AF37] hover:text-black dark:hover:text-white border border-[#D4AF37]/15 transition cursor-pointer text-sm">
          ✕
        </button>

        <!-- Header -->
        <div class="flex flex-col gap-1 pb-5 border-b border-neutral-300 dark:border-[#D4AF37]/25">
          <h2 class="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Notifications</span>
            <span class="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" aria-hidden="true"></span>
          </h2>
          <div class="flex items-center justify-between mt-1">
            <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">{{ unreadCount() }} unread updates</p>
            <button *ngIf="unreadCount() > 0" (click)="markAll()" aria-label="Mark all updates as read"
              class="text-xs font-black text-[#FF8A00] hover:text-[#D4AF37] transition cursor-pointer select-none">
              Mark all read
            </button>
          </div>
        </div>

        <!-- Push Toggle (Premium Card) -->
        <div class="my-5 p-4 rounded-2xl toggle-card flex items-center justify-between shadow-sm dark:shadow-inner">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-base shrink-0 border border-[#D4AF37]/20" aria-hidden="true">📱</span>
            <div>
              <p class="text-xs font-black text-neutral-900 dark:text-white tracking-wide">Push Notifications</p>
              <p class="text-[9px] text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wider">Order & deal alerts</p>
            </div>
          </div>
          <button (click)="pushOn.set(!pushOn())" aria-label="Toggle push notifications" [aria-checked]="pushOn()" role="switch"
            [class]="'w-11 h-6 rounded-full relative transition-colors duration-300 ease-out border cursor-pointer ' + (pushOn() ? 'bg-gradient-to-r from-[#D4AF37] to-[#FF8A00] border-[#D4AF37]/50' : 'bg-neutral-200 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700')">
            <span [class]="'absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#0A0A0A] shadow-md transition-all duration-300 ease-out ' + (pushOn() ? 'left-6' : 'left-0.5')"></span>
          </button>
        </div>

        <!-- Notifications Scroll Area -->
        <div class="flex-1 overflow-y-auto space-y-3.5 pr-1 -mr-2 scrollbar-none" role="list">
          @for (n of items(); track n.id) {
            <div (click)="markRead(n.id)"
              tabindex="0"
              role="listitem"
              (keydown.enter)="markRead(n.id)"
              (keydown.space)="markRead(n.id); $event.preventDefault()"
              [aria-label]="'Notification: ' + n.title + '. ' + n.body"
              [class]='"glass-card relative group flex gap-3.5 p-4 cursor-pointer transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] " + 
                (n.read 
                  ? "opacity-55 hover:opacity-100" 
                  : "border-[#D4AF37]/45 dark:border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(212,175,55,0.05)]")'>
              
              <!-- Subtle decorative light pillar for unread -->
              <div *ngIf="!n.read" class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF8A00] to-[#D4AF37]"></div>

              <!-- Icon Container -->
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#FF8A00]/5 text-[#D4AF37] flex items-center justify-center text-lg shrink-0 border border-[#D4AF37]/20 shadow-inner">
                {{ n.icon }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 pr-4">
                <p [class]='"text-xs font-black tracking-tight truncate " + (n.read ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-900 dark:text-white")'>{{ n.title }}</p>
                <p class="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-normal font-medium">{{ n.body }}</p>
                <span class="inline-block text-[9px] bg-[#D4AF37]/10 text-[#755a0f] dark:bg-[#D4AF37]/10 dark:text-[#E6C96F] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider mt-2">
                  {{ n.time }}
                </span>
              </div>

              <!-- Unread Dot Indicator -->
              @if (!n.read) {
                <span class="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 shadow-[0_0_8px_#D4AF37]" aria-label="Unread"></span>
              }

              <!-- Dismiss Button (Hover Triggered) -->
              <button (click)="dismiss($event, n.id)" aria-label="Dismiss this notification"
                class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 text-[9px] font-black text-neutral-500 hover:text-[#E53935] hover:bg-[#E53935]/10 border border-transparent hover:border-[#E53935]/20 rounded-md px-1.5 py-0.5 transition-all duration-200 cursor-pointer select-none">
                Dismiss
              </button>
            </div>
          } @empty {
            <div class="h-60 flex flex-col items-center justify-center text-center text-neutral-600 dark:text-neutral-400 space-y-3">
              <div class="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-3xl border border-[#D4AF37]/15 shadow-inner">🎉</div>
              <div>
                <p class="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">All Caught Up</p>
                <p class="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1 max-w-[200px] leading-relaxed mx-auto">No new updates or alerts right now. Enjoy your pizza!</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-none {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }

    .notif-panel {
      background: rgba(250, 250, 250, 0.95);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
      border-top: 4px solid #D4AF37; /* gold touch */
      color: #1F2937;
    }

    :host-context([data-theme="dark"]) .notif-panel {
      background: rgba(14, 14, 16, 0.95);
      border-left: 1px solid rgba(212, 175, 55, 0.2);
      border-top: 4px solid #D4AF37; /* gold touch */
      color: #F8F8F8;
    }

    .toggle-card {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.06);
    }

    :host-context([data-theme="dark"]) .toggle-card {
      background: rgba(24, 24, 27, 0.4);
      border: 1px solid rgba(212, 175, 55, 0.15);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
      border-radius: 20px;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.8),
        transparent
      );
      pointer-events: none;
    }

    .glass-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.8),
        transparent,
        rgba(255, 255, 255, 0.3)
      );
      pointer-events: none;
    }

    :host-context([data-theme="dark"]) .glass-card {
      background: rgba(20, 20, 25, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
  `]
})
export class NotificationBarComponent {
  isOpen = signal(false); // Controls side-panel visibility
  pushOn = signal(true);

  items = signal<Notif[]>([
    { id: '1', icon: '🍕', title: 'Order on the way!', body: 'Your order from Shamz Pizza is out for delivery.', time: '2 min ago', read: false },
    { id: '2', icon: '🏷️', title: 'New deal near you', body: "Marco's is running BOGO on all large pizzas today.", time: '1 hour ago', read: false },
    { id: '3', icon: '⭐', title: 'Rate your last order', body: 'How was your pizza from Detroit Deep Dish?', time: 'Yesterday', read: true },
    { id: '4', icon: '🎁', title: 'You earned 50 points', body: 'Points added from your recent order.', time: '2 days ago', read: true },
  ]);

  // Using Angular's computed signal for performance optimization
  unreadCount = computed(() => this.items().filter(n => !n.read).length);

  markRead(id: string): void {
    this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAll(): void {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }

  dismiss(event: Event, id: string): void {
    event.stopPropagation(); // Prevents clicking "Dismiss" from triggering the "markRead" parent div click
    this.items.update(list => list.filter(n => n.id !== id));
  }
}
