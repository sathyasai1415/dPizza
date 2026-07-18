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
import { WelcomeShowcaseComponent } from '../../shared/welcome-showcase/welcome-showcase.component';
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
    WelcomeShowcaseComponent,
    ElectricBorderComponent,
    NotificationBarComponent
  ],
  template: `
    <app-video-intro *ngIf="showIntro()" (done)="dismissIntro()"></app-video-intro>
    <app-welcome-showcase *ngIf="onboarding.showWelcome()" (done)="onboarding.dismissWelcome(); openAddressModalAfterWelcome()"></app-welcome-showcase>
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
        <!-- LOCATION ICON - TOP (Mobile Only) -->
        <div *ngIf="!authService.isStoreOwner() && !authService.isAdmin()" class="flex sm:hidden items-center justify-between px-4 py-2 bg-[#0A0A0A]/50">
          <button (click)="openAddressModal($event)" [title]="'Current location: ' + locationService.selectedCity()" class="icon-fx relative w-9 h-9 flex items-center justify-center text-[#D4AF37] hover:text-white rounded-full transition">
            <span class="icon-fx-fill" aria-hidden="true"></span>
            <svg xmlns="http://www.w3.org/2000/svg" class="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </button>
          <span class="text-xs font-bold text-[#D4AF37]">{{ locationService.selectedCity() === 'All' ? 'Select Location' : locationService.selectedCity() }}</span>
          <div class="w-9"></div>
        </div>

        <!-- TOP NAV HEADER — Redesigned Modern Premium Navigation -->
        <header class="sticky top-0 z-30 w-full bg-white shadow-sm">
          <!-- Row 1: Logo (left) + Location (right) -->
          <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-gray-100">
            <!-- Logo on left -->
            <div class="flex items-center gap-3">
              <button *ngIf="!authService.isStoreOwner() && !authService.isAdmin() && authService.isAuthenticated()"
                (click)="toggleSidebar()"
                class="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <a routerLink="/home" class="flex items-center gap-2.5 select-none cursor-pointer">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-base shadow-sm" style="background: linear-gradient(135deg, #FF8A00 0%, #D4AF37 100%);">🍕</div>
                <span class="hidden sm:block font-black text-lg tracking-tight">
                  <span style="color: #1a1a1a">MiSlice</span>
                </span>
              </a>
            </div>

            <!-- Location on right (visible on mobile and desktop) -->
            <div class="flex items-center gap-2">
              <button (click)="openAddressModal($event)" class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                <span class="text-lg">📍</span>
                <span class="hidden sm:inline">{{ locationService.selectedCity() === 'All' ? 'All Cities' : locationService.selectedCity() }}</span>
                <span class="sm:hidden">{{ locationService.selectedCity() === 'All' ? 'All' : locationService.selectedCity().substring(0, 8) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Row 2: Search Bar + Action Buttons (Customer only) -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
              <!-- Search Bar (75-80% width) -->
              <div class="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 hover:border-gray-300 transition">
                <span class="text-xl select-none">🔍</span>
                <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="submitSearch()"
                  placeholder="Search pizzas, restaurants, toppings..."
                  class="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-medium" />
              </div>

              <!-- Three Action Buttons (right side) -->
              <div class="flex items-center gap-2 shrink-0">
                <!-- Hot Deals Button -->
                <button routerLink="/deals" title="Hot Deals"
                  class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#E53935] hover:shadow-lg hover:scale-105 transition-all text-white font-bold text-lg shadow-md">
                  🔥
                </button>

                <!-- Cart Button -->
                <a routerLink="/cart" title="Cart"
                  class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 hover:bg-gray-300 hover:shadow-lg hover:scale-105 transition-all text-gray-800 font-bold text-lg relative shadow-md">
                  🛒
                  <span *ngIf="cartService.cartItemCount() > 0" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-black flex items-center justify-center shadow-md">
                    {{ cartService.cartItemCount() }}
                  </span>
                </a>

                <!-- Favorites Button -->
                <a routerLink="/favourites" title="Favorites"
                  class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 hover:bg-gray-300 hover:shadow-lg hover:scale-105 transition-all text-gray-800 font-bold text-lg shadow-md">
                  ❤️
                </a>
              </div>
            </div>
          </ng-container>

          <!-- Owner/Admin Navigation -->
          <ng-container *ngIf="authService.isStoreOwner() || authService.isAdmin()">
            <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <!-- Owner global search -->
              <div *ngIf="authService.isStoreOwner()" class="flex-1 max-w-md flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 hover:border-gray-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-gray-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input [(ngModel)]="ownerSearch" placeholder="Search orders, menu, deals…" class="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
              </div>
              <div *ngIf="authService.isAdmin()" class="flex-1"></div>

              <!-- Action buttons -->
              <div class="flex items-center gap-3 shrink-0">
                <button *ngIf="authService.isStoreOwner()" (click)="bellOpen.set(!bellOpen()); profileOpen.set(false)" title="Notifications"
                  class="relative w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span *ngIf="alerts.unreadCount() > 0" class="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-black flex items-center justify-center">{{ alerts.unreadCount() }}</span>
                </button>

                <!-- Profile menu -->
                <div class="relative">
                  <button (click)="profileOpen.set(!profileOpen()); bellOpen.set(false)"
                    class="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-sm font-black text-white transition shadow-md">
                    {{ (authService.currentUser()?.fullName ?? 'U').substring(0,1).toUpperCase() }}
                  </button>
                  <div *ngIf="profileOpen()" class="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-50 py-1.5">
                    <div class="px-4 py-3 border-b border-gray-100"><p class="text-sm font-bold text-gray-900 truncate">{{ authService.currentUser()?.fullName }}</p><p class="text-xs text-gray-500 truncate">{{ authService.currentUser()?.email }}</p></div>
                    <a *ngIf="authService.isStoreOwner()" [routerLink]="['/owner']" [queryParams]="{ tab: 'settings' }" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">🏪 Restaurant Profile</a>
                    <a routerLink="/profile" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">⚙️ Account Settings</a>
                    <a *ngIf="authService.isStoreOwner()" [routerLink]="['/owner']" [queryParams]="{ tab: 'financials' }" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">💳 Billing</a>
                    <button (click)="handleLogout()" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-gray-50 rounded-b-xl border-t border-gray-100">🚪 Logout</button>
                  </div>
                </div>

                <!-- Theme Toggle -->
                <button (click)="themeService.toggleTheme()" [title]="themeService.theme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                  class="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition">
                  <svg *ngIf="themeService.theme() === 'dark'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <svg *ngIf="themeService.theme() === 'light'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                </button>
              </div>
            </div>
          </ng-container>

        </header>

        <!-- ROUTER OUTLET CONTAINER -->
        <main class="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-28 sm:pb-8 z-10">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- MOBILE BOTTOM TAB BAR — replaces the sidebar below the lg breakpoint -->
      <nav *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
        class="lg:hidden fixed bottom-0 inset-x-0 h-20 z-40 backdrop-blur-md bg-[#0A0A0A]/95 border-t border-[#D4AF37]/25 flex items-center justify-around safe-area-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]">
        <div class="relative flex-1 h-full">
          <button (click)="$event.stopPropagation(); buildMenuOpen.set(!buildMenuOpen()); accountMenuOpen.set(false); supportMenuOpen.set(false)"
            [class]="'w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold ' + ((buildMenuOpen() || currentRoute() === '/builder' || currentRoute() === '/compare') ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-white')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M3 12h18M12 12m-9 0a9 9 0 1 1 18 0 9 9 0 1 1-18 0" />
            </svg>
            <span>Build</span>
          </button>
          <div *ngIf="buildMenuOpen()" class="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0A] shadow-2xl py-1.5 z-50">
            <a routerLink="/builder" (click)="buildMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">🍕 Build a Pizza</a>
            <a routerLink="/compare" (click)="buildMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">⚖️ Compare Prices</a>
          </div>
        </div>

        <a routerLink="/deals" routerLinkActive="text-[#D4AF37]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.103-5.102a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          <span>Deals</span>
        </a>

        <div class="relative flex-1 h-full">
          <button (click)="$event.stopPropagation(); accountMenuOpen.set(!accountMenuOpen()); buildMenuOpen.set(false); supportMenuOpen.set(false)"
            [class]="'w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold ' + ((accountMenuOpen() || currentRoute() === '/orders' || currentRoute() === '/rewards') ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-white')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <span>Account</span>
          </button>
          <div *ngIf="accountMenuOpen()" class="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0A] shadow-2xl py-1.5 z-50">
            <a routerLink="/orders" (click)="accountMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">📦 Order History</a>
            <a routerLink="/rewards" (click)="accountMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">🎁 Rewards Hub</a>
            <button (click)="handleLogout(); accountMenuOpen.set(false)" class="w-full text-left px-4 py-2.5 text-xs font-bold text-[#FF8A00] hover:bg-[#D4AF37]/10 rounded-b-2xl border-t border-[#D4AF37]/15">🚪 Sign Out</button>
          </div>
        </div>

        <div class="relative flex-1 h-full">
          <button (click)="$event.stopPropagation(); supportMenuOpen.set(!supportMenuOpen()); buildMenuOpen.set(false); accountMenuOpen.set(false)"
            [class]="'w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold ' + ((supportMenuOpen() || currentRoute() === '/how-it-works' || currentRoute() === '/contact') ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-white')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <span>Support</span>
          </button>
          <div *ngIf="supportMenuOpen()" class="absolute bottom-[calc(100%+10px)] right-1/2 translate-x-1/2 w-44 rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0A] shadow-2xl py-1.5 z-50">
            <a routerLink="/how-it-works" (click)="supportMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">❓ How It Works</a>
            <a routerLink="/contact" (click)="supportMenuOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20">✉️ Contact Support</a>
          </div>
        </div>

        <a routerLink="/profile" routerLinkActive="text-[#D4AF37]" [routerLinkActiveOptions]="{exact: true}"
          class="flex-1 h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white">
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
