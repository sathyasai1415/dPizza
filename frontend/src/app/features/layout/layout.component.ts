import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { GridScanComponent } from '../../shared/gridscan/gridscan.component';
import { VideoIntroComponent } from '../../shared/video-intro/video-intro.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, GridScanComponent, VideoIntroComponent],
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

        <!-- Sidebar Brand Logo -->
        <a routerLink="/home" class="flex items-center gap-3 px-6 py-6 border-b border-white/10 hover:bg-white/5 transition duration-150">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-600 to-red-500 shadow-md">
            🍕
          </div>
          <div class="text-left">
            <span class="font-black text-lg tracking-tight block text-white">MiSlice</span>
            <span class="text-[10px] text-white/40 font-medium tracking-widest uppercase">Pizza Tech</span>
          </div>
        </a>

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          <!-- Customer navigation -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <!-- Section 1: Core Marketplace -->
            <div class="space-y-1">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Marketplace</p>
              <a routerLink="/home" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20" [routerLinkActiveOptions]="{exact: true}"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>🏠</span> Home / Discover
              </a>
              <a routerLink="/builder" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>🍕</span> Build a Pizza
              </a>
              <a routerLink="/compare" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>⚖️</span> Compare Prices
              </a>
              <a routerLink="/deals" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>🏷️</span> Deals &amp; Offers
              </a>
            </div>

            <!-- Section 2: Personal Account -->
            <div class="space-y-1 pt-2 border-t border-white/5">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">My Account</p>
              <a routerLink="/orders" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>📦</span> Order History
              </a>
              <a routerLink="/rewards" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>🎁</span> Rewards Hub
              </a>
              <a routerLink="/saved-pizzas" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>💾</span> Saved Creations
              </a>
              <a routerLink="/profile" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <span>👤</span> Dietary Profile
              </a>
            </div>

            <!-- Section 3: Help & Info -->
            <div class="space-y-1 pt-2 border-t border-white/5">
              <p class="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/50 hover:bg-white/5 hover:text-white transition">
                <span>❓</span> How It Works
              </a>
              <a routerLink="/contact" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/20"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/50 hover:bg-white/5 hover:text-white transition">
                <span>✉️</span> Contact Support
              </a>
            </div>
          </ng-container>

          <!-- Store Owner Navigation -->
          <ng-container *ngIf="authService.isStoreOwner()">
            <a routerLink="/owner" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/30"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition">
              <span>📊</span> Merchant Portal
            </a>
          </ng-container>

          <!-- Platform Admin Navigation -->
          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="bg-red-600/20 text-red-400 border border-red-500/30"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition">
              <span>🛡️</span> Admin Console
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
            class="w-full py-2.5 rounded-xl border border-white/10 hover:border-red-500 hover:bg-red-600/10 text-xs font-bold text-white/70 hover:text-red-400 transition flex items-center justify-center gap-2">
            <span>🚪</span> Sign Out
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
  `
})
export class LayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  showIntro = signal(false);
  searchQuery = '';

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
