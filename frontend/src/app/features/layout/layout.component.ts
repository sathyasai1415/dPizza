import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { GridScanComponent } from '../../shared/gridscan/gridscan.component';
import { VideoIntroComponent } from '../../shared/video-intro/video-intro.component';
import { ElectricBorderComponent } from '../../shared/electric-border/electric-border.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    GridScanComponent,
    VideoIntroComponent,
    ElectricBorderComponent
  ],
  template: `
    <app-video-intro *ngIf="showIntro()" (done)="dismissIntro()"></app-video-intro>
    <div class="min-h-screen flex text-white bg-transparent relative">

      <!-- BACKGROUND ANIMATED ORBS -->
      <div class="fixed top-12 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="fixed bottom-12 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <!-- MOBILE HAMBURGER BUTTON -->
      <button (click)="toggleSidebar()" class="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400">
        <svg *ngIf="!sidebarOpen()" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg *ngIf="sidebarOpen()" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        <span class="text-white font-black text-sm tracking-tight">Menu</span>
      </button>

      <!-- MOBILE BACKDROP -->
      <div *ngIf="sidebarOpen()" (click)="closeSidebar()" class="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>

      <!-- SIDEBAR NAVIGATION -->
      <aside [class.translate-x-0]="sidebarOpen()" [class.-translate-x-full]="!sidebarOpen()"
        class="fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-white/10 bg-[#07070d]/80 backdrop-blur-md overflow-hidden">

        <!-- GridScan animated background -->
        <div class="absolute inset-0 z-0 pointer-events-none opacity-70">
          <app-gridscan></app-gridscan>
        </div>
        <div class="relative z-10 flex flex-col h-full">

        <!-- Sidebar Brand Logo with ElectricBorder trigger -->
        <div (click)="toggleLogoAnimation($event)" class="cursor-pointer px-4 py-5 border-b border-white/10 select-none">
          <app-electric-border *ngIf="logoActive()" [borderRadius]="16" [chaos]="0.07" [speed]="1.3" color="#e80505">
            <div class="flex items-center gap-3 p-3 bg-red-950/10 rounded-2xl border border-red-500/20">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-600 to-orange-500 shadow-md text-sm">
                🍕
              </div>
              <div class="text-left">
                <span class="font-black text-base tracking-tight block text-white leading-none">MiSlice</span>
                <span class="text-[9px] text-red-500 font-bold tracking-widest uppercase mt-1 block">Pizza Tech</span>
              </div>
            </div>
          </app-electric-border>
          
          <div *ngIf="!logoActive()" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition duration-150">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-600 to-red-500 shadow-md text-sm">
              🍕
            </div>
            <div class="text-left">
              <span class="font-black text-base tracking-tight block text-white leading-none">MiSlice</span>
              <span class="text-[9px] text-white/40 font-medium tracking-widest uppercase mt-1 block">Pizza Tech</span>
            </div>
          </div>
        </div>

        <!-- Navigation Links with GlareHover -->
        <nav class="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          <!-- Customer navigation -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <!-- Section 1: Core Marketplace -->
            <div class="space-y-1">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Marketplace</p>
              <a routerLink="/home" routerLinkActive="active-tab" [routerLinkActiveOptions]="{exact: true}"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>🏠</span> Home / Discover
                </span>
              </a>
              <a routerLink="/builder" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>🍕</span> Build a Pizza
                </span>
              </a>
              <a routerLink="/compare" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>⚖️</span> Compare Prices
                </span>
              </a>
              <a routerLink="/deals" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>🏷️</span> Deals &amp; Offers
                </span>
              </a>
            </div>

            <!-- Section 2: Personal Account -->
            <div class="space-y-1 pt-2 border-t border-white/5">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">My Account</p>
              <a routerLink="/orders" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>📦</span> Order History
                </span>
              </a>
              <a routerLink="/rewards" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>🎁</span> Rewards Hub
                </span>
              </a>

              <a routerLink="/profile" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>👤</span> Dietary Profile
                </span>
              </a>
            </div>

            <!-- Section 3: Help & Info -->
            <div class="space-y-1 pt-2 border-t border-white/5">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/50 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>❓</span> How It Works
                </span>
              </a>
              <a routerLink="/contact" routerLinkActive="active-tab"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/50 hover:text-white transition">
                <span class="relative z-10 flex items-center gap-2.5">
                  <span>✉️</span> Contact Support
                </span>
              </a>
            </div>
          </ng-container>

          <!-- Store Owner Navigation -->
          <ng-container *ngIf="authService.isStoreOwner()">
            <a routerLink="/owner" routerLinkActive="active-tab"
              class="glare-hover flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition">
              <span class="relative z-10 flex items-center gap-3">
                <span>📊</span> Merchant Portal
              </span>
            </a>
          </ng-container>

          <!-- Platform Admin Navigation -->
          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active-tab"
              class="glare-hover flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition">
              <span class="relative z-10 flex items-center gap-3">
                <span>🛡️</span> Admin Console
              </span>
            </a>
          </ng-container>
        </nav>

        <!-- Footer / Session Status -->
        <div class="p-4 border-t border-white/10 space-y-3 bg-[#050508]">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-red-400">
              {{ (authService.currentUser()?.fullName ?? 'U').substring(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold truncate text-white">{{ authService.currentUser()?.fullName }}</p>
              <p class="text-[10px] text-white/40 truncate capitalize">{{ authService.currentUser()?.roles?.[0] }}</p>
            </div>
          </div>
          <button (click)="handleLogout()"
            class="glare-hover w-full py-2.5 rounded-xl border border-white/10 hover:border-red-500 hover:bg-red-600/10 text-xs font-bold text-white/70 hover:text-red-400 transition flex items-center justify-center gap-2">
            <span class="relative z-10 flex items-center gap-2">
              <span>🚪</span> Sign Out
            </span>
          </button>
        </div>
        </div><!-- /relative z-10 wrapper -->
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="flex-1 flex flex-col lg:pl-64 min-w-0">
        <!-- TOP NAV HEADER — slim: search · location · bell · cart -->
        <header class="h-16 border-b border-white/10 flex items-center gap-3 px-6 lg:px-8 z-30 bg-[#0A0D18]/40 backdrop-blur-md sticky top-0">

          <!-- Smart search (customers) -->
          <div *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
            class="hidden sm:flex items-center gap-2.5 flex-1 max-w-md glass-soft rounded-full px-4 py-2">
            <span class="text-white/35 text-sm">🔍</span>
            <input
              [(ngModel)]="searchQuery"
              (keydown.enter)="submitSearch()"
              placeholder="Search pizza, stores, deals…"
              class="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
          </div>
          <div class="flex-1 sm:hidden"></div>
          <div *ngIf="authService.isStoreOwner() || authService.isAdmin()" class="flex-1"></div>

          <div class="flex items-center gap-2">
            <!-- Favourites top nav chip -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
               routerLink="/favourites" routerLinkActive="active-tab-top"
               class="flex items-center gap-1.5 glass-soft rounded-full px-3.5 py-2 text-xs font-black text-white/70 hover:text-white transition-all hover:bg-white/10 border border-white/5 shadow-md">
              <span class="text-red-500 animate-pulse">❤️</span> Favourites
            </a>

            <!-- Location chip -->
            <button *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
              class="hidden md:flex items-center gap-1.5 glass-soft rounded-full px-3.5 py-2 text-xs font-bold text-white/70 hover:text-white transition">
              <span>📍</span> Detroit, MI
            </button>

            <!-- Notifications bell -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
              routerLink="/notifications"
              class="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition">
              <span>🔔</span>
            </a>

            <!-- Cart with badge -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
               routerLink="/cart" class="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition">
              <span>🛒</span>
              <span *ngIf="cartService.cartItemCount() > 0" class="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full text-[9px] font-black flex items-center justify-center text-white">
                {{ cartService.cartItemCount() }}
              </span>
            </a>
          </div>
        </header>

        <!-- ROUTER OUTLET CONTAINER -->
        <main class="flex-1 p-6 lg:p-8 z-10">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>
  `,
  styles: [`
    .glare-hover {
      --gh-angle: -30deg;
      --gh-rgba: rgba(232, 5, 5, 0.4);
      --gh-duration: 900ms;
      --gh-size: 200%;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.01);
    }

    .glare-hover::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        var(--gh-angle),
        rgba(0, 0, 0, 0) 50%,
        var(--gh-rgba) 65%,
        rgba(0, 0, 0, 0) 80%
      );
      transition: background-position var(--gh-duration) cubic-bezier(0.16, 1, 0.3, 1);
      background-size: var(--gh-size) var(--gh-size);
      background-repeat: no-repeat;
      background-position: -150% -150%;
      pointer-events: none;
      z-index: 5;
    }

    .glare-hover:hover::before {
      background-position: 150% 150%;
    }

    .active-tab {
      background: rgba(220, 38, 38, 0.25) !important;
      color: #fca5a5 !important;
      border: 1px solid rgba(239, 68, 68, 0.4) !important;
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.15);
    }

    .active-tab-top {
      background: rgba(220, 38, 38, 0.3) !important;
      color: #ffffff !important;
      border: 1px solid rgba(239, 68, 68, 0.6) !important;
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.2);
    }
  `]
})
export class LayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  showIntro = signal(false);
  searchQuery = '';
  logoActive = signal(false);

  toggleLogoAnimation(event: Event) {
    event.preventDefault();
    this.logoActive.update(v => !v);
  }

  submitSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.router.navigate(['/home'], { queryParams: { q } });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    }
    // Space intro once per browser session, customers only
    try {
      const seen = sessionStorage.getItem('mislice_intro_seen');
      if (!seen && !this.authService.isStoreOwner() && !this.authService.isAdmin()) {
        this.showIntro.set(true);
      }
    } catch { /* ignore */ }
  }

  dismissIntro() {
    this.showIntro.set(false);
    try { sessionStorage.setItem('mislice_intro_seen', '1'); } catch { /* ignore */ }
  }

  sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  handleLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/welcome']);
      }
    });
  }
}
