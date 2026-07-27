import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { MerchantAlertsService } from '../../core/services/merchant-alerts.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MERCHANT_TABS } from '../owner/merchant-nav';
import { CartService } from '../../core/services/cart.service';
import { VideoIntroComponent } from '../../shared/video-intro/video-intro.component';
import { ElectricBorderComponent } from '../../shared/electric-border/electric-border.component';
import { LocationService } from '../../core/services/location.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationBarComponent } from '../../shared/components/notification-bar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VideoIntroComponent,
    ElectricBorderComponent,
    NotificationBarComponent
  ],
  template: `
    <app-video-intro *ngIf="showIntro()" (done)="dismissIntro()"></app-video-intro>
    <div class="min-h-screen flex text-brand-black bg-transparent relative">

      <!-- SIDEBAR NAVIGATION — desktop visible, mobile overlay -->
      <aside [class.lg:w-20]="navCollapsed()" [class.lg:w-64]="!navCollapsed()" [class.translate-x-0]="sidebarOpen()" [class.-translate-x-full]="!sidebarOpen()"
        class="fixed lg:sticky lg:top-0 lg:bottom-0 lg:left-0 top-0 left-0 z-40 w-64 h-screen flex-col transition-all duration-300 border-r border-[#2B2B31] text-[#D4AF37] overflow-y-auto overflow-x-hidden bg-[#0E0E10] lg:flex lg:translate-x-0" [class.flex]="sidebarOpen()" [class.hidden]="!sidebarOpen() && !authService.isStoreOwner() && !authService.isAdmin()">

        <div class="relative z-10 flex flex-col h-full">

        <!-- Sidebar Brand Logo (red "MI" + dark "Slice" wordmark) -->
        <div class="px-4 py-5 border-b border-[#D4AF37]/25 select-none flex items-center gap-1">
          <div routerLink="/home" class="cursor-pointer flex-1 min-w-0">
            <app-electric-border *ngIf="logoActive()" [borderRadius]="16" [chaos]="0.02" [speed]="0.8" color="#FF8A00">
              <div class="flex items-center gap-2.5 p-2.5 bg-[#0A0A0A] rounded-2xl shadow-sm border border-[#D4AF37]/25" [class.justify-center]="navCollapsed()">
                <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base shadow-inner" style="background: var(--gradient-mislice);">🍕</div>
                <div class="text-left leading-none" [class.lg:hidden]="navCollapsed()">
                  <span class="font-black text-base tracking-tight block leading-none">
                    <span style="color: #FF8A00">MI</span><span style="color: #D4AF37">Slice</span>
                  </span>
                  <span class="text-[9px] text-[#D4AF37]/70 font-bold tracking-widest uppercase mt-1 block">Pizza Tech</span>
                </div>
              </div>
            </app-electric-border>

            <div *ngIf="!logoActive()" class="flex items-center gap-2.5 p-2.5 bg-[#0A0A0A] rounded-2xl shadow-sm border border-[#D4AF37]/25 hover:shadow-md transition duration-150" [class.justify-center]="navCollapsed()">
              <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base shadow-inner" style="background: var(--gradient-mislice);">🍕</div>
              <div class="text-left leading-none" [class.lg:hidden]="navCollapsed()">
                <span class="font-black text-base tracking-tight block leading-none">
                  <span style="color: #FF8A00">MI</span><span style="color: #D4AF37">Slice</span>
                </span>
                <span class="text-[9px] text-[#D4AF37]/70 font-medium tracking-widest uppercase mt-1 block">Pizza Tech</span>
              </div>
            </div>
          </div>

          <!-- Collapse toggle (desktop only) -->
          <button (click)="toggleNavCollapsed()" [title]="navCollapsed() ? 'Expand menu' : 'Collapse menu'"
            class="hidden lg:flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-300" [class.rotate-180]="navCollapsed()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <!-- Navigation Links -->
        <nav [class.overflow-visible]="navCollapsed()" [class.overflow-y-auto]="!navCollapsed()" [class.overflow-x-hidden]="!navCollapsed()" class="flex-1 px-3 py-4 space-y-4">
          <!-- Customer navigation -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <!-- Section 1: Core Marketplace -->
            <div class="space-y-1">
              <p [class.lg:hidden]="navCollapsed()" class="text-[12px] font-bold tracking-[0.15em] uppercase text-[#B28D2C] px-3 mb-2">Marketplace</p>
              <a routerLink="/order" routerLinkActive="active-tab" title="Order Food"
                [attr.data-tooltip]="navCollapsed() ? 'Order Food' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🛍️</span> <span [class.lg:hidden]="navCollapsed()">Order Food</span>
                </span>
              </a>
              <a routerLink="/compare" routerLinkActive="active-tab" title="Compare Prices"
                [attr.data-tooltip]="navCollapsed() ? 'Compare Prices' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">⚖️</span> <span [class.lg:hidden]="navCollapsed()">Compare Prices</span>
                </span>
              </a>
              <a routerLink="/deals" routerLinkActive="active-tab" title="Deals & Offers"
                [attr.data-tooltip]="navCollapsed() ? 'Deals & Offers' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🏷️</span> <span [class.lg:hidden]="navCollapsed()">Deals &amp; Offers</span>
                </span>
              </a>
            </div>

            <!-- Section 2: Personal Account -->
            <div class="space-y-1 pt-2 border-t border-[#2B2B31]/40">
              <p [class.lg:hidden]="navCollapsed()" class="text-[12px] font-bold tracking-[0.15em] uppercase text-[#B28D2C] px-3 mb-2">My Account</p>
              <a routerLink="/orders" routerLinkActive="active-tab" title="Order History"
                [attr.data-tooltip]="navCollapsed() ? 'Order History' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">📦</span> <span [class.lg:hidden]="navCollapsed()">Order History</span>
                </span>
              </a>
              <a routerLink="/rewards" routerLinkActive="active-tab" title="Rewards Hub"
                [attr.data-tooltip]="navCollapsed() ? 'Rewards Hub' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🎁</span> <span [class.lg:hidden]="navCollapsed()">Rewards Hub</span>
                </span>
              </a>
            </div>

            <!-- Section 3: Help & Info -->
            <div class="space-y-1 pt-2 border-t border-[#2B2B31]/40">
              <p [class.lg:hidden]="navCollapsed()" class="text-[12px] font-bold tracking-[0.15em] uppercase text-[#B28D2C] px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="active-tab" title="How It Works"
                [attr.data-tooltip]="navCollapsed() ? 'How It Works' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">❓</span> <span [class.lg:hidden]="navCollapsed()">How It Works</span>
                </span>
              </a>
              <a routerLink="/contact" routerLinkActive="active-tab" title="Contact Support"
                [attr.data-tooltip]="navCollapsed() ? 'Contact Support' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[18px] font-semibold text-[#9C9C9C] bg-[#0E0E10] border border-[#2B2B31]/30 hover:text-[#EDEDED] transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">✉️</span> <span [class.lg:hidden]="navCollapsed()">Contact Support</span>
                </span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="authService.isStoreOwner()">
            <div class="space-y-1">
              <p [class.lg:hidden]="navCollapsed()" class="text-caption text-[#D4AF37]/70 uppercase tracking-widest px-3 mb-2">🏪 Merchant Portal</p>
              <a *ngFor="let t of merchantTabs" [routerLink]="['/owner']" [queryParams]="{ tab: t.id }" [title]="t.name"
                [attr.data-tooltip]="navCollapsed() ? t.name : null"
                [class.lg:justify-center]="navCollapsed()"
                (click)="closeSidebar()"
                [class]="'glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-nav transition-all ' + (currentTab() === t.id ? 'active-tab' : 'text-[#D4AF37] bg-[#0A0A0A] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10')">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">{{ t.icon }}</span> <span [class.lg:hidden]="navCollapsed()">{{ t.name }}</span>
                </span>
              </a>
            </div>
            <div class="space-y-1 pt-2 border-t border-[#D4AF37]/25">
              <p [class.lg:hidden]="navCollapsed()" class="text-caption text-[#D4AF37]/70 uppercase tracking-widest px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="active-tab" title="Help Center"
                [attr.data-tooltip]="navCollapsed() ? 'Help Center' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-nav text-[#D4AF37] bg-[#0A0A0A] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()"><span class="shrink-0">❓</span> <span [class.lg:hidden]="navCollapsed()">Help Center</span></span>
              </a>
              <a routerLink="/contact" routerLinkActive="active-tab" title="Contact Support"
                [attr.data-tooltip]="navCollapsed() ? 'Contact Support' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-nav text-[#D4AF37] bg-[#0A0A0A] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()"><span class="shrink-0">✉️</span> <span [class.lg:hidden]="navCollapsed()">Contact Support</span></span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active-tab" title="Admin Console"
              [attr.data-tooltip]="navCollapsed() ? 'Admin Console' : null"
              [class.lg:justify-center]="navCollapsed()"
              class="glare-hover flex items-center gap-3 px-4 py-3 rounded-xl text-nav text-[#D4AF37] bg-[#0A0A0A] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 transition">
              <span class="relative z-10 flex items-center gap-3" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                <span class="shrink-0">🛡️</span> <span [class.lg:hidden]="navCollapsed()">Admin Console</span>
              </span>
            </a>
          </ng-container>
        </nav>

        <!-- Footer / Session Status -->
        <div class="p-3 border-t border-[#D4AF37]/25 space-y-2.5 bg-[#0A0A0A]">
          <!-- Interactive User Profile Card -->
          <div routerLink="/profile" title="Profile"
            [attr.data-tooltip]="navCollapsed() ? 'Profile Settings' : null"
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-[#D4AF37]/20 cursor-pointer group transition-all duration-200" [class.lg:justify-center]="navCollapsed()">
            <div class="w-9 h-9 shrink-0 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/40 flex items-center justify-center text-sm font-bold text-[#D4AF37] group-hover:scale-105 transition-transform">
              {{ (authService.currentUser()?.fullName ?? 'U').substring(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1" [class.lg:hidden]="navCollapsed()">
              <p class="text-xs font-bold truncate text-[#D4AF37] transition-colors">{{ authService.currentUser()?.fullName }}</p>
              <p class="text-[10px] text-[#D4AF37]/70 truncate capitalize">{{ authService.currentUser()?.roles?.[0] }}</p>
            </div>
            <span [class.lg:hidden]="navCollapsed()" class="text-[#D4AF37]/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity pr-1">→</span>
          </div>

          <!-- Explicit Profile Navigation Button -->
          <a routerLink="/profile" routerLinkActive="active-tab" title="Profile"
            [attr.data-tooltip]="navCollapsed() ? 'Profile Info' : null"
            class="glare-hover w-full py-2.5 rounded-xl border border-[#D4AF37]/25 hover:border-[#FF8A00]/60 hover:bg-[#D4AF37]/20 text-btn text-[#D4AF37] transition flex items-center justify-center gap-2 select-none">
            <span class="relative z-10 flex items-center gap-2">
              <span class="shrink-0">👤</span> <span [class.lg:hidden]="navCollapsed()">Profile</span>
            </span>
          </a>

          <!-- Sign Out Button -->
          <button (click)="handleLogout()" title="Sign Out"
            [attr.data-tooltip]="navCollapsed() ? 'Sign Out' : null"
            class="glare-hover w-full py-2.5 rounded-xl border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-btn text-[#D4AF37] hover:text-[#D4AF37] transition flex items-center justify-center gap-2">
            <span class="relative z-10 flex items-center gap-2">
              <span class="shrink-0">🚪</span> <span [class.lg:hidden]="navCollapsed()">Sign Out</span>
            </span>
          </button>
          <!-- Mobile Close Button -->
          <button *ngIf="sidebarOpen()" (click)="closeSidebar()" class="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        </div><!-- /relative z-10 wrapper -->
      </aside>

      <!-- MOBILE SIDEBAR OVERLAY BACKDROP -->
      <div *ngIf="sidebarOpen()" (click)="closeSidebar()" class="fixed inset-0 lg:hidden bg-black/50 z-30 backdrop-blur-sm transition-opacity duration-300"></div>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="flex-1 flex flex-col min-w-0 transition-all duration-300" [class.lg:pl-64]="!navCollapsed()" [class.lg:pl-20]="navCollapsed()">

        <!-- TOP NAV HEADER — Redesigned Modern Premium Navigation -->
        <header class="sticky top-0 z-30 w-full bg-[#0E011E]/95 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-md">
          <!-- Row 1: Brand Logo (Left) + Location, Notifications, Theme Toggle, Profile Menu (Right) -->
          <div class="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between border-b border-[#D4AF37]/10">
            <!-- Logo & Sidebar Trigger on left + Location Selector next to it -->
            <div class="flex items-center gap-2.5 sm:gap-3">
              <button *ngIf="authService.isAuthenticated()"
                (click)="toggleSidebar()"
                class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-white bg-white/5 border border-white/10 hover:bg-white/15 transition cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <!-- Manually edit location (Clean compact glassmorphism icon button) -->
              <button *ngIf="!authService.isStoreOwner() && !authService.isAdmin()" (click)="openAddressModal($event)"
                [title]="'Current location: ' + locationService.selectedCity()"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer select-none">
                <span class="text-base">📍</span>
              </button>
            </div>

            <!-- Right Controls: Favourites, Cart, Notifications, Theme Toggle, User Profile -->
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Merchant Portal Badge (Store Owner only) -->
              <div *ngIf="authService.isStoreOwner()" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                <span>🏪 Merchant Console</span>
              </div>

              <!-- Customer Favourites Button -->
              <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin() && authService.isAuthenticated()"
                routerLink="/favourites" title="Favorites"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/15 rounded-xl transition cursor-pointer">
                <span class="text-base sm:text-lg">❤️</span>
              </a>

              <!-- Customer Cart Button -->
              <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin() && authService.isAuthenticated()"
                routerLink="/cart" title="Cart"
                class="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/15 rounded-xl transition cursor-pointer">
                <span class="text-base sm:text-lg">🛒</span>
                <span *ngIf="cartService.cartItemCount() > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md">
                  {{ cartService.cartItemCount() }}
                </span>
              </a>

              <!-- Customer Notifications Bell -->
              <button *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
                (click)="$event.stopPropagation(); notificationBar.isOpen.set(!notificationBar.isOpen())" title="Notifications"
                class="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/15 rounded-xl transition cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span *ngIf="notificationBar.unreadCount() > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md">
                  {{ notificationBar.unreadCount() }}
                </span>
              </button>

              <!-- Owner Notifications Bell -->
              <div *ngIf="authService.isStoreOwner()" class="relative">
                <button (click)="$event.stopPropagation(); bellOpen.set(!bellOpen()); profileOpen.set(false)" title="Notifications"
                  class="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/15 rounded-xl transition cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span *ngIf="alerts.unreadCount() > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md">{{ alerts.unreadCount() }}</span>
                </button>
                <div *ngIf="bellOpen()" (click)="$event.stopPropagation()" class="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0E011E]/95 backdrop-blur-xl shadow-2xl z-50">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0E011E]/95 backdrop-blur-xl">
                    <span class="text-sm font-black text-[#D4AF37]">Notifications</span>
                    <button (click)="alerts.markAllRead()" class="text-[10px] font-bold text-[#FF8A00] hover:opacity-70">Mark all read</button>
                  </div>
                  <div class="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none border-b border-white/10">
                    @for (f of alertFilters; track f) {
                      <button (click)="alertFilter.set(f)" [class]="'px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ' + (alertFilter() === f ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-[#D4AF37]/70 hover:bg-[#D4AF37]/10')">{{ f }}</button>
                    }
                  </div>
                  <div class="p-2 space-y-1">
                    @for (a of filteredAlerts(); track a.id) {
                      <div class="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/10">
                        <span class="text-base">{{ a.icon }}</span>
                        <div class="min-w-0"><p class="text-xs font-bold text-[#D4AF37]">{{ a.title }}</p><p class="text-[10px] text-[#D4AF37]/70 mt-0.5">{{ a.detail }}</p></div>
                      </div>
                    }
                    @if (filteredAlerts().length === 0) { <p class="text-[11px] text-[#D4AF37]/70 text-center py-6">🎉 All caught up.</p> }
                  </div>
                </div>
              </div>



              <!-- Profile Dropdown (If Logged In) -->
              <div *ngIf="authService.isAuthenticated()" class="relative">
                <button (click)="$event.stopPropagation(); profileOpen.set(!profileOpen()); bellOpen.set(false)"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A13] hover:brightness-110 flex items-center justify-center text-sm font-black text-white transition shadow-[0_0_12px_rgba(255,138,0,0.35)] cursor-pointer">
                  {{ (authService.currentUser()?.fullName ?? 'U').substring(0,1).toUpperCase() }}
                </button>
                <div *ngIf="profileOpen()" (click)="$event.stopPropagation()" class="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0E011E]/95 backdrop-blur-xl shadow-2xl z-50 py-1.5">
                  <div class="px-4 py-3 border-b border-white/10">
                    <p class="text-sm font-bold text-white truncate">{{ authService.currentUser()?.fullName }}</p>
                    <p class="text-xs text-neutral-400 truncate">{{ authService.currentUser()?.email }}</p>
                  </div>
                  <a *ngIf="authService.isStoreOwner()" [routerLink]="['/owner']" [queryParams]="{ tab: 'settings' }" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/10">🏪 Restaurant Profile</a>
                  <a routerLink="/profile" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/10">⚙️ Account Settings</a>
                  <a routerLink="/orders" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/10">📦 My Orders</a>
                  <a routerLink="/favourites" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/10">❤️ Saved Favorites</a>
                  <button (click)="handleLogout()" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-white/10 rounded-b-xl border-t border-white/10 cursor-pointer">🚪 Logout</button>
                </div>
              </div>

              <!-- Sign In Link (If Not Logged In) -->
              <a *ngIf="!authService.isAuthenticated()" routerLink="/welcome"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A13] hover:brightness-110 text-white font-bold text-xs sm:text-sm transition shadow-md">
                Sign In
              </a>
            </div>
          </div>

          <!-- Row 2: Customer Navigation Bar (Search + Deals) -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <div class="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
              <!-- Search Bar -->
              <div class="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 hover:bg-white/10 hover:border-white/20 focus-within:border-[#D4AF37]/50 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300">
                <span class="text-xl select-none">🔍</span>
                <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="submitSearch()"
                  placeholder="Search pizzas, restaurants, toppings..."
                  class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none font-medium" />
              </div>

              <!-- Hot Deals Button -->
              <a routerLink="/deals" title="Hot Deals"
                class="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#FF7A22] to-[#F0530A] hover:shadow-lg hover:scale-105 transition-all text-white font-bold text-base sm:text-lg shadow-md shrink-0">
                🔥
              </a>
            </div>
          </ng-container>

          <!-- Owner / Admin Row 2 -->
          <ng-container *ngIf="authService.isStoreOwner() || authService.isAdmin()">
            <div class="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <div *ngIf="authService.isStoreOwner()" class="flex-1 max-w-md flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-neutral-400 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input [(ngModel)]="ownerSearch" placeholder="Search orders, menu, deals…" class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
              </div>
              <div *ngIf="authService.isAdmin()" class="flex-1"></div>
            </div>
          </ng-container>
        </header>

        <!-- ROUTER OUTLET CONTAINER -->
        <main class="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-28 sm:pb-8 z-10"
          [ngClass]="(!authService.isStoreOwner() && !authService.isAdmin()) ? 'bg-transparent' : ''">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- MOBILE BOTTOM TAB BAR — Customer Navigation (simplified, light/dark themed) -->
      <nav *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
        class="lg:hidden fixed bottom-0 inset-x-0 h-20 z-40 backdrop-blur-md bg-[#0E011E]/95 border-t border-[#D4AF37]/20 flex items-center justify-around safe-area-bottom shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)] transition-colors duration-200">

        <!-- Home Tab -->
        <a routerLink="/home" routerLinkActive="text-[#FF8A00]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-[#9C9C9C] hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Home</span>
        </a>

        <!-- Deals Tab -->
        <a routerLink="/deals" routerLinkActive="text-[#FF8A00]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-[#9C9C9C] hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9Z" />
            <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          <span>Deals</span>
        </a>

        <!-- Compare Tab (signature, elevated center) -->
        <a routerLink="/compare" class="flex-1 h-full flex flex-col items-center justify-center gap-1.5 -mt-8">
          <span class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_14px_24px_-8px_rgba(240,83,10,0.7)] border-4 border-[#0E011E]"
            style="background:linear-gradient(180deg,#FF7A22,#F0530A)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.9" stroke="#fff" class="w-6 h-6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v18M7 21h10" />
              <path d="M5 7 2.4 12.5a2.6 2.6 0 0 0 5.2 0Z" />
              <path d="M19 7l-2.6 5.5a2.6 2.6 0 0 0 5.2 0Z" />
              <path d="M5 7l7-2 7 2" />
            </svg>
          </span>
          <span class="text-[10px] font-bold text-[#FF8A00]">Compare</span>
        </a>

        <!-- Orders Tab -->
        <a routerLink="/orders" routerLinkActive="text-[#FF8A00]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-[#9C9C9C] hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m6-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3 20.25v-4.5a6 6 0 0 1 6-6h.75a.75.75 0 0 0 .75-.75V9a6 6 0 0 1 6-6h.75a.75.75 0 0 1 .75.75v.75a6 6 0 0 1-6 6h-.75a.75.75 0 0 0-.75.75v4.5a6 6 0 0 1-6 6h-.75a.75.75 0 0 1-.75-.75Z" />
          </svg>
          <span>Orders</span>
        </a>

        <!-- Profile Tab -->
        <a routerLink="/profile" routerLinkActive="text-[#FF6A13]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-[#9B8B77] hover:text-[#241C15] transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span>Profile</span>
        </a>
      </nav>

      <!-- MOBILE BOTTOM TAB BAR — merchant (owner) -->
      <nav *ngIf="authService.isStoreOwner()"
        class="lg:hidden fixed bottom-5 inset-x-4 h-16 z-40 backdrop-blur-md bg-[#0A0A0A]/90 border border-[#D4AF37]/35 rounded-2xl flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <a *ngFor="let t of merchantTabs.slice(0, 4)" [routerLink]="['/owner']" [queryParams]="{ tab: t.id }"
          [class]="'flex-1 h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold ' + (currentTab() === t.id ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-white')">
          <span class="text-xl leading-none">{{ t.icon }}</span>
          <span>{{ t.name }}</span>
        </a>
        <div class="relative flex-1 h-full">
          <button (click)="$event.stopPropagation(); ownerMoreOpen.set(!ownerMoreOpen())"
            [class]="'w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold ' + (ownerMoreOpen() ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-white')">
            <span class="text-xl leading-none">⋯</span>
            <span>More</span>
          </button>
          <div *ngIf="ownerMoreOpen()" class="absolute bottom-[calc(100%+10px)] right-0 w-48 rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0A] shadow-2xl py-1.5 z-50">
            <a *ngFor="let t of merchantTabs.slice(4)" [routerLink]="['/owner']" [queryParams]="{ tab: t.id }" (click)="ownerMoreOpen.set(false)"
              class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">{{ t.icon }} {{ t.name }}</a>
            <a routerLink="/profile" (click)="ownerMoreOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">⚙️ Account Settings</a>
          </div>
        </div>
      </nav>

      <!-- Floating Build Your Pizza Action Button (Customer only) -->
      <div *ngIf="!authService.isStoreOwner() && !authService.isAdmin() && currentRoute() !== '/builder'"
        class="fixed bottom-6 right-6 z-[99] hidden lg:block">
        <button routerLink="/builder"
          class="flex items-center gap-2 px-5 py-3.5 rounded-full font-black text-xs bg-[#E53935] hover:bg-[#E53935]/90 text-white border border-[#D4AF37]/50 shadow-[0_4px_24px_rgba(229,57,53,0.4)] hover:shadow-[0_4px_24px_rgba(229,57,53,0.6)] hover:scale-105 transition-all duration-300 uppercase tracking-widest">
          <span>🍕</span> Build your pizza
        </button>
      </div>

      <!-- Redesigned Notification Side Panel and Trigger -->
      <app-notification-bar #notificationBar></app-notification-bar>

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
      background: #18181B !important;
      color: #EDEDED !important;
      border: 1px solid #D4AF37 !important;
      box-shadow: none;
    }

    .active-tab-top {
      background: #18181B !important;
      color: #EDEDED !important;
      border: 1px solid #D4AF37 !important;
    }

    /* ===== Pill nav hover-fill effect (reactbits PillNav-style) ===== */
    .pill-fx {
      position: relative;
      isolation: isolate;
      overflow: hidden;
    }
    .pill-fx .pill-fx-fill {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 3.4em;
      height: 3.4em;
      border-radius: 9999px;
      transform: translate(-50%, 65%) scale(0);
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 0;
      pointer-events: none;
    }
    .pill-fx-blue .pill-fx-fill { background: #D4AF37; }
    .pill-fx-red .pill-fx-fill { background: #D4AF37; }
    .pill-fx-solid .pill-fx-fill { background: rgba(212, 175, 55, 0.15); }
    .pill-fx:hover .pill-fx-fill { transform: translate(-50%, 65%) scale(1); }
    .pill-fx-content { transition: color 0.3s ease 0.05s; }
    .pill-fx-blue:hover .pill-fx-content,
    .pill-fx-red:hover .pill-fx-content { color: #0A0A0A; }

    /* Circular icon buttons: soft centered fill on hover */
    .icon-fx .icon-fx-fill {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: #D4AF37;
      opacity: 0;
      transform: scale(0.5);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }
    .icon-fx:hover .icon-fx-fill { opacity: 0.85; transform: scale(1); }
    .icon-fx:hover { color: #0A0A0A !important; }
  `]
})
export class LayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly onboarding = inject(OnboardingService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  readonly locationService = inject(LocationService);

  showIntro = signal(false);
  searchQuery = '';
  logoActive = signal(false);
  addressModalOpen = signal(false);
  customAddressInput = '';

  savedAddresses = [
    { label: 'Work', address: '22701 Gratiot Ave, Eastpointe, MI 48021, USA' },
    { label: 'Home', address: '35301 Drakeshire Ln, Farmington, MI 48335, USA' },
    { label: 'Alternate', address: '28500 Franklin River Dr, 308, Southfield, MI 48034, USA' },
    { label: 'Campus', address: '21870 Green Hill Rd, Farmington, MI 48335, USA' }
  ];

  // Mobile bottom tab bar popovers (customer)
  buildMenuOpen = signal(false);
  accountMenuOpen = signal(false);
  supportMenuOpen = signal(false);
  currentRoute = signal('');

  // Mobile bottom tab bar popover (owner "More" tab)
  ownerMoreOpen = signal(false);

  // Merchant portal sub-navigation (driven by the ?tab= URL param)
  merchantTabs = MERCHANT_TABS;
  currentTab = signal('dashboard');

  // Top-nav (owner): notifications bell + profile menu + search
  readonly alerts = inject(MerchantAlertsService);
  bellOpen = signal(false);
  profileOpen = signal(false);
  ownerSearch = '';
  alertFilter = signal('All');
  alertFilters = ['All', 'Orders', 'Payments', 'Deals', 'System', 'Menu Updates'];
  filteredAlerts = computed(() => {
    const f = this.alertFilter();
    return f === 'All' ? this.alerts.alerts() : this.alerts.alerts().filter(a => a.type === f);
  });

  // Sidebar collapse (desktop). Persisted so the owner's choice sticks across visits.
  navCollapsed = signal(this.readCollapsedPref());

  private readCollapsedPref(): boolean {
    try { return localStorage.getItem('mislice_nav_collapsed') === '1'; } catch { return false; }
  }

  toggleNavCollapsed(): void {
    const next = !this.navCollapsed();
    this.navCollapsed.set(next);
    try { localStorage.setItem('mislice_nav_collapsed', next ? '1' : '0'); } catch { /* ignore */ }
  }

  private syncTab() {
    const tab = this.router.parseUrl(this.router.url).queryParams['tab'];
    this.currentTab.set(this.router.url.startsWith('/owner') ? (tab || 'dashboard') : '');
    this.currentRoute.set(this.router.url.split('?')[0]);
  }

  toggleLogoAnimation(event: Event) {
    event.preventDefault();
    this.logoActive.update(v => !v);
  }

  submitSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.router.navigate(['/order'], { queryParams: { q } });
  }

  ngOnInit() {
    this.syncTab();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.syncTab());
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

  @HostListener('document:click')
  closeDropdowns() {
    this.buildMenuOpen.set(false);
    this.accountMenuOpen.set(false);
    this.supportMenuOpen.set(false);
    this.ownerMoreOpen.set(false);
    this.profileOpen.set(false);
    this.bellOpen.set(false);
  }

  openAddressModal(event: Event) {
    event.stopPropagation();
    this.addressModalOpen.set(true);
  }

  selectCustomAddress(label?: string) {
    const addr = label 
      ? this.savedAddresses.find(a => a.label === label)?.address 
      : this.customAddressInput.trim();
    
    if (addr) {
      this.selectCity(addr);
      this.customAddressInput = '';
    }
  }

  selectCity(city: string) {
    this.locationService.selectCity(city);
    this.addressModalOpen.set(false);
  }

  navigateToExplore() {
    this.router.navigate(['/home']);
  }

  scrollToMap() {
    this.router.navigate(['/home']).then(() => {
      setTimeout(() => {
        const el = document.getElementById('price-map');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });
  }

  openAddressModalAfterWelcome() {
    if (!localStorage.getItem('mislice_customer_location')) {
      setTimeout(() => this.addressModalOpen.set(true), 300);
    }
  }
}
