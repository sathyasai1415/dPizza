import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notif { id: string; icon: string; title: string; body: string; time: string; read: boolean; }

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full max-w-2xl mx-auto py-2 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-brand-black">Notifications</h1>
          <p class="text-brand-black text-sm mt-1">{{ unread() }} unread</p>
        </div>
        <button (click)="markAll()" class="text-xs font-bold text-brand-red hover:text-brand-red">Mark all read</button>
      </div>

      <!-- toggle -->
      <div class="clay rounded-2xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xl">🔔</span>
          <div>
            <p class="text-sm font-bold text-brand-black">Push Notifications</p>
            <p class="text-[11px] text-brand-black">Order updates & deal alerts</p>
          </div>
        </div>
        <button (click)="pushOn.set(!pushOn())"
          [class]="'w-11 h-6 rounded-full relative transition ' + (pushOn() ? 'text-brand-green font-bold' : 'bg-brand-white')">
          <span class="absolute top-0.5 w-5 h-5 rounded-full bg-brand-white transition-all" [style.left]="pushOn() ? '22px' : '2px'"></span>
        </button>
      </div>

      <!-- feed -->
      <div class="space-y-2">
        @for (n of items(); track n.id) {
          <div (click)="markRead(n.id)"
            [class]="'clay rounded-2xl p-4 flex gap-3 cursor-pointer transition ' + (n.read ? 'opacity-60' : 'border-brand-red')">
            <div class="w-10 h-10 rounded-xl bg-brand-red text-brand-white flex items-center justify-center text-lg shrink-0">{{ n.icon }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-brand-black">{{ n.title }}</p>
              <p class="text-xs text-brand-black mt-0.5">{{ n.body }}</p>
              <p class="text-[10px] text-brand-black mt-1">{{ n.time }}</p>
            </div>
            <span *ngIf="!n.read" class="w-2 h-2 rounded-full bg-brand-red text-brand-white shrink-0 mt-1"></span>
          </div>
        }
      </div>
    </div>
  `,
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
