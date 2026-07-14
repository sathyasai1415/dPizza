import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { MerchantAlertsService } from '../../core/services/merchant-alerts.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MERCHANT_TABS } from '../owner/merchant-nav';
import { CartService } from '../../core/services/cart.service';
import { GridScanComponent } from '../../shared/gridscan/gridscan.component';
import { VideoIntroComponent } from '../../shared/video-intro/video-intro.component';
import { ElectricBorderComponent } from '../../shared/electric-border/electric-border.component';
import { LocationService } from '../../core/services/location.service';

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
    <div class="min-h-screen flex text-brand-black bg-transparent relative">

      <!-- MOBILE HAMBURGER BUTTON -->
      <button (click)="toggleSidebar()" class="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95 hover:hover:to-red-400">
        <svg *ngIf="!sidebarOpen()" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg *ngIf="sidebarOpen()" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        <span class="text-brand-black font-black text-sm tracking-tight">Menu</span>
      </button>

      <!-- MOBILE BACKDROP -->
      <div *ngIf="sidebarOpen()" (click)="closeSidebar()" class="lg:hidden fixed inset-0 bg-brand-white backdrop-blur-sm z-40"></div>

      <!-- SIDEBAR NAVIGATION (collapsible on desktop; full-width overlay on mobile) -->
      <aside [class.translate-x-0]="sidebarOpen()" [class.-translate-x-full]="!sidebarOpen()"
        [class.lg:w-20]="navCollapsed()" [class.lg:w-64]="!navCollapsed()"
        class="fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-all duration-300 lg:translate-x-0 border-r border-[#EBEDEB]/10 bg-[color:var(--color-brand-scarlet)] text-[#EBEDEB] overflow-visible">

        <!-- GridScan animated background -->
        <div class="absolute inset-0 z-0 pointer-events-none opacity-50">
          <app-gridscan></app-gridscan>
        </div>
        <div class="relative z-10 flex flex-col h-full">

        <!-- Sidebar Brand Logo (navy "MI" + orange "Slice" wordmark on a white badge, gradient icon chip) -->
        <div class="px-4 py-5 border-b border-[#EBEDEB]/10 select-none flex items-center gap-1">
          <div routerLink="/home" class="cursor-pointer flex-1 min-w-0">
            <app-electric-border *ngIf="logoActive()" [borderRadius]="16" [chaos]="0.02" [speed]="0.8" color="#F57C00">
              <div class="flex items-center gap-2.5 p-2.5 bg-brand-white rounded-2xl shadow-md" [class.justify-center]="navCollapsed()">
                <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base shadow-inner" style="background: var(--gradient-mislice);">🍕</div>
                <div class="text-left leading-none" [class.lg:hidden]="navCollapsed()">
                  <span class="font-black text-base tracking-tight block leading-none">
                    <span style="color: var(--color-brand-navy)">MI</span><span style="color: var(--color-brand-orange)">Slice</span>
                  </span>
                  <span class="text-[9px] text-neutral-500 font-bold tracking-widest uppercase mt-1 block">Pizza Tech</span>
                </div>
              </div>
            </app-electric-border>

            <div *ngIf="!logoActive()" class="flex items-center gap-2.5 p-2.5 bg-brand-white rounded-2xl shadow-md hover:shadow-lg transition duration-150" [class.justify-center]="navCollapsed()">
              <div class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base shadow-inner" style="background: var(--gradient-mislice);">🍕</div>
              <div class="text-left leading-none" [class.lg:hidden]="navCollapsed()">
                <span class="font-black text-base tracking-tight block leading-none">
                  <span style="color: var(--color-brand-navy)">MI</span><span style="color: var(--color-brand-orange)">Slice</span>
                </span>
                <span class="text-[9px] text-neutral-500 font-medium tracking-widest uppercase mt-1 block">Pizza Tech</span>
              </div>
            </div>
          </div>

          <!-- Collapse toggle (desktop only) -->
          <button (click)="toggleNavCollapsed()" [title]="navCollapsed() ? 'Expand menu' : 'Collapse menu'"
            class="hidden lg:flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-[#EBEDEB]/60 hover:text-white hover:bg-white/10 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-300" [class.rotate-180]="navCollapsed()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
          <!-- Customer navigation -->
          <ng-container *ngIf="!authService.isStoreOwner() && !authService.isAdmin()">
            <!-- Section 1: Core Marketplace -->
            <div class="space-y-1">
              <p [class.lg:hidden]="navCollapsed()" class="text-[9px] font-black text-[#EBEDEB]/50 uppercase tracking-widest px-3 mb-2">Marketplace</p>
              <a routerLink="/builder" routerLinkActive="active-tab" title="Build a Pizza"
                [attr.data-tooltip]="navCollapsed() ? 'Build a Pizza' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🍕</span> <span [class.lg:hidden]="navCollapsed()">Build a Pizza</span>
                </span>
              </a>
              <a routerLink="/compare" routerLinkActive="active-tab" title="Compare Prices"
                [attr.data-tooltip]="navCollapsed() ? 'Compare Prices' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">⚖️</span> <span [class.lg:hidden]="navCollapsed()">Compare Prices</span>
                </span>
              </a>
              <a routerLink="/deals" routerLinkActive="active-tab" title="Deals & Offers"
                [attr.data-tooltip]="navCollapsed() ? 'Deals & Offers' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🏷️</span> <span [class.lg:hidden]="navCollapsed()">Deals &amp; Offers</span>
                </span>
              </a>
            </div>

            <!-- Section 2: Personal Account -->
            <div class="space-y-1 pt-2 border-t border-[#EBEDEB]/10">
              <p [class.lg:hidden]="navCollapsed()" class="text-[9px] font-black text-[#EBEDEB]/50 uppercase tracking-widest px-3 mb-2">My Account</p>
              <a routerLink="/orders" routerLinkActive="active-tab" title="Order History"
                [attr.data-tooltip]="navCollapsed() ? 'Order History' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">📦</span> <span [class.lg:hidden]="navCollapsed()">Order History</span>
                </span>
              </a>
              <a routerLink="/rewards" routerLinkActive="active-tab" title="Rewards Hub"
                [attr.data-tooltip]="navCollapsed() ? 'Rewards Hub' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">🎁</span> <span [class.lg:hidden]="navCollapsed()">Rewards Hub</span>
                </span>
              </a>
            </div>

            <!-- Section 3: Help & Info -->
            <div class="space-y-1 pt-2 border-t border-[#EBEDEB]/10">
              <p [class.lg:hidden]="navCollapsed()" class="text-[9px] font-black text-[#EBEDEB]/50 uppercase tracking-widest px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="active-tab" title="How It Works"
                [attr.data-tooltip]="navCollapsed() ? 'How It Works' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">❓</span> <span [class.lg:hidden]="navCollapsed()">How It Works</span>
                </span>
              </a>
              <a routerLink="/contact" routerLinkActive="active-tab" title="Contact Support"
                [attr.data-tooltip]="navCollapsed() ? 'Contact Support' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">✉️</span> <span [class.lg:hidden]="navCollapsed()">Contact Support</span>
                </span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="authService.isStoreOwner()">
            <div class="space-y-1">
              <p [class.lg:hidden]="navCollapsed()" class="text-[9px] font-black text-[#EBEDEB]/50 uppercase tracking-widest px-3 mb-2">🏪 Merchant Portal</p>
              <a *ngFor="let t of merchantTabs" [routerLink]="['/owner']" [queryParams]="{ tab: t.id }" [title]="t.name"
                [attr.data-tooltip]="navCollapsed() ? t.name : null"
                [class.lg:justify-center]="navCollapsed()"
                (click)="closeSidebar()"
                [class]="'glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-white/5 ' + (currentTab() === t.id ? 'active-tab' : 'text-[#EBEDEB]/80 hover:text-white')">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                  <span class="shrink-0">{{ t.icon }}</span> <span [class.lg:hidden]="navCollapsed()">{{ t.name }}</span>
                </span>
              </a>
            </div>
            <div class="space-y-1 pt-2 border-t border-[#EBEDEB]/10">
              <p [class.lg:hidden]="navCollapsed()" class="text-[9px] font-black text-[#EBEDEB]/50 uppercase tracking-widest px-3 mb-2">Support</p>
              <a routerLink="/how-it-works" routerLinkActive="active-tab" title="Help Center"
                [attr.data-tooltip]="navCollapsed() ? 'Help Center' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()"><span class="shrink-0">❓</span> <span [class.lg:hidden]="navCollapsed()">Help Center</span></span>
              </a>
              <a routerLink="/contact" routerLinkActive="active-tab" title="Contact Support"
                [attr.data-tooltip]="navCollapsed() ? 'Contact Support' : null"
                [class.lg:justify-center]="navCollapsed()"
                class="glare-hover flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
                <span class="relative z-10 flex items-center gap-2.5" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()"><span class="shrink-0">✉️</span> <span [class.lg:hidden]="navCollapsed()">Contact Support</span></span>
              </a>
            </div>
          </ng-container>

          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active-tab" title="Admin Console"
              [attr.data-tooltip]="navCollapsed() ? 'Admin Console' : null"
              [class.lg:justify-center]="navCollapsed()"
              class="glare-hover flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#EBEDEB]/80 hover:text-white hover:bg-white/5 transition">
              <span class="relative z-10 flex items-center gap-3" [class.lg:justify-center]="navCollapsed()" [class.lg:w-full]="navCollapsed()">
                <span class="shrink-0">🛡️</span> <span [class.lg:hidden]="navCollapsed()">Admin Console</span>
              </span>
            </a>
          </ng-container>
        </nav>

        <!-- Footer / Session Status -->
        <div class="p-3 border-t border-[#EBEDEB]/10 space-y-2.5 bg-[#B31C00]">
          <!-- Interactive User Profile Card -->
          <div routerLink="/profile" title="Profile" 
            [attr.data-tooltip]="navCollapsed() ? 'Profile Settings' : null"
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer group transition-all duration-200" [class.lg:justify-center]="navCollapsed()">
            <div class="w-9 h-9 shrink-0 rounded-xl bg-brand-white flex items-center justify-center text-sm font-bold text-brand-red group-hover:scale-105 transition-transform">
              {{ (authService.currentUser()?.fullName ?? 'U').substring(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1" [class.lg:hidden]="navCollapsed()">
              <p class="text-xs font-bold truncate text-[#EBEDEB] group-hover:text-white transition-colors">{{ authService.currentUser()?.fullName }}</p>
              <p class="text-[10px] text-[#EBEDEB]/70 truncate capitalize opacity-70">{{ authService.currentUser()?.roles?.[0] }}</p>
            </div>
            <span [class.lg:hidden]="navCollapsed()" class="text-[#EBEDEB]/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity pr-1">→</span>
          </div>

          <!-- Explicit Profile Navigation Button -->
          <a routerLink="/profile" routerLinkActive="active-tab" title="Profile"
            [attr.data-tooltip]="navCollapsed() ? 'Profile Info' : null"
            class="glare-hover w-full py-2.5 rounded-xl border border-[#EBEDEB]/20 hover:border-[#EBEDEB]/40 hover:bg-white/10 text-[#EBEDEB] hover:text-white transition flex items-center justify-center gap-2 select-none">
            <span class="relative z-10 flex items-center gap-2">
              <span class="shrink-0">👤</span> <span [class.lg:hidden]="navCollapsed()">Profile</span>
            </span>
          </a>

          <!-- Sign Out Button -->
          <button (click)="handleLogout()" title="Sign Out"
            [attr.data-tooltip]="navCollapsed() ? 'Sign Out' : null"
            class="glare-hover w-full py-2.5 rounded-xl border border-[#EBEDEB]/20 hover:border-[color:var(--color-brand-blue)] hover:bg-[color:var(--color-brand-blue)] text-[#EBEDEB] hover:text-white transition flex items-center justify-center gap-2">
            <span class="relative z-10 flex items-center gap-2">
              <span class="shrink-0">🚪</span> <span [class.lg:hidden]="navCollapsed()">Sign Out</span>
            </span>
          </button>
        </div>
        </div><!-- /relative z-10 wrapper -->
      </aside>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="flex-1 flex flex-col min-w-0 transition-all duration-300" [class.lg:pl-64]="!navCollapsed()" [class.lg:pl-20]="navCollapsed()">
        <!-- TOP NAV HEADER — white / blue / red pill navigation -->
        <header class="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 pt-3">
          <div class="h-16 flex items-center gap-3 px-3 sm:px-4 bg-white/90 backdrop-blur-md border border-black/5 rounded-full shadow-[0_4px_24px_rgba(10,95,255,0.08)]">

          <!-- Top Nav buttons for customers -->
          <div *ngIf="!authService.isStoreOwner() && !authService.isAdmin()" class="flex items-center gap-2 flex-1 overflow-x-auto lg:overflow-visible scrollbar-none">

            <!-- Near Me / Map pill -->
            <button (click)="scrollToMap()" class="pill-fx pill-fx-blue shrink-0 flex items-center gap-1.5 border border-[color:var(--color-brand-blue)]/30 text-[color:var(--color-brand-blue)] px-3.5 py-1.5 rounded-full text-xs font-bold transition">
              <span class="pill-fx-fill" aria-hidden="true"></span>
              <span class="pill-fx-content relative z-10 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m-4.179-2.25 8.179 4.409a1.05 1.05 0 0 0 1.07 0L19.75 12M2.25 12l8.179-4.409a1.05 1.05 0 0 1 1.07 0L19.75 12M19.75 12l-4.179 2.25m4.179-2.25-4.179-2.25m0 4.5L12 18.75l-3.571-1.921M12 18.75V12" />
                </svg>
                <span>Near Me</span>
              </span>
            </button>

            <!-- Pick City Location dropdown -->
            <div class="relative shrink-0">
              <button (click)="toggleCityDropdown($event)" class="pill-fx pill-fx-blue flex items-center gap-1.5 border border-[color:var(--color-brand-blue)]/30 text-[color:var(--color-brand-blue)] px-3.5 py-1.5 rounded-full text-xs font-bold transition">
                <span class="pill-fx-fill" aria-hidden="true"></span>
                <span class="pill-fx-content relative z-10 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{{ locationService.selectedCity() === 'All' ? 'Pick City' : locationService.selectedCity() }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 transition-transform duration-200" [class.rotate-180]="cityDropdownOpen()">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div *ngIf="cityDropdownOpen()" class="absolute left-0 mt-2 w-48 rounded-2xl border border-black/10 bg-white shadow-2xl z-50 py-1.5 overflow-hidden animate-fadeIn animate-duration-150">
                <div class="px-3 py-1.5 text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-black/5">Select City</div>
                <button *ngFor="let city of locationService.citiesList()" (click)="selectCity(city)"
                  class="w-full text-left px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-[color:var(--color-brand-blue)]/10 hover:text-[color:var(--color-brand-blue)] transition flex items-center justify-between">
                  <span>{{ city === 'All' ? 'All Cities' : city }}</span>
                  <span *ngIf="locationService.selectedCity() === city" class="text-[color:var(--color-brand-red)] text-xs">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Owner global search -->
          <div *ngIf="authService.isStoreOwner()" class="hidden sm:flex items-center gap-2.5 flex-1 max-w-md bg-black/[0.03] border border-black/5 rounded-full px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-[color:var(--color-brand-blue)] shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input [(ngModel)]="ownerSearch" placeholder="Search orders, menu, deals…" class="flex-1 bg-transparent text-sm text-brand-black placeholder-neutral-400 outline-none" />
          </div>
          <div *ngIf="authService.isAdmin() || (!authService.isStoreOwner() && !authService.isAdmin() && sidebarOpen())" class="flex-1"></div>
          <div *ngIf="!authService.isStoreOwner() && !authService.isAdmin() && !sidebarOpen()" class="flex-1"></div>

          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">

            <!-- OWNER: notifications bell -->
            <div *ngIf="authService.isStoreOwner()" class="relative">
              <button (click)="bellOpen.set(!bellOpen()); profileOpen.set(false)" title="Notifications" class="icon-fx relative w-9 h-9 flex items-center justify-center text-[color:var(--color-brand-blue)] rounded-full transition">
                <span class="icon-fx-fill" aria-hidden="true"></span>
                <svg xmlns="http://www.w3.org/2000/svg" class="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span *ngIf="alerts.unreadCount() > 0" class="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-[color:var(--color-brand-red)] text-white rounded-full text-[9px] font-black flex items-center justify-center z-20">{{ alerts.unreadCount() }}</span>
              </button>
              <div *ngIf="bellOpen()" class="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-2xl z-50">
                <div class="flex items-center justify-between px-4 py-3 border-b border-black/5 sticky top-0 bg-white">
                  <span class="text-sm font-black text-brand-black">Notifications</span>
                  <button (click)="alerts.markAllRead()" class="text-[10px] font-bold text-[color:var(--color-brand-red)] hover:opacity-70">Mark all read</button>
                </div>
                <div class="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none border-b border-black/5">
                  @for (f of alertFilters; track f) {
                    <button (click)="alertFilter.set(f)" [class]="'px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ' + (alertFilter() === f ? 'bg-[color:var(--color-brand-blue)] text-white' : 'text-neutral-500 hover:bg-black/5')">{{ f }}</button>
                  }
                </div>
                <div class="p-2 space-y-1">
                  @for (a of filteredAlerts(); track a.id) {
                    <div class="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-black/[0.03]">
                      <span class="text-base">{{ a.icon }}</span>
                      <div class="min-w-0"><p class="text-xs font-bold text-brand-black">{{ a.title }}</p><p class="text-[10px] text-neutral-500 mt-0.5">{{ a.detail }}</p></div>
                    </div>
                  }
                  @if (filteredAlerts().length === 0) { <p class="text-[11px] text-neutral-400 text-center py-6">🎉 All caught up.</p> }
                </div>
              </div>
            </div>

            <!-- OWNER: help -->
            <a *ngIf="authService.isStoreOwner()" routerLink="/how-it-works" title="Help Center" class="icon-fx relative w-9 h-9 flex items-center justify-center text-[color:var(--color-brand-blue)] rounded-full transition">
              <span class="icon-fx-fill" aria-hidden="true"></span>
              <svg xmlns="http://www.w3.org/2000/svg" class="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 17.25h.008v.008H12v-.008Z" />
              </svg>
            </a>

            <!-- OWNER: profile menu -->
            <div *ngIf="authService.isStoreOwner()" class="relative">
              <button (click)="profileOpen.set(!profileOpen()); bellOpen.set(false)" class="w-9 h-9 rounded-full bg-[color:var(--color-brand-blue)] hover:brightness-110 flex items-center justify-center text-sm font-black text-white transition">{{ (authService.currentUser()?.fullName ?? 'S').substring(0,1).toUpperCase() }}</button>
              <div *ngIf="profileOpen()" class="absolute right-0 mt-2 w-56 rounded-2xl border border-black/10 bg-white shadow-2xl z-50 py-1.5">
                <div class="px-4 py-2 border-b border-black/5"><p class="text-xs font-bold text-brand-black truncate">{{ authService.currentUser()?.fullName }}</p><p class="text-[10px] text-neutral-500 truncate">{{ authService.currentUser()?.email }}</p></div>
                <a [routerLink]="['/owner']" [queryParams]="{ tab: 'settings' }" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-brand-black hover:bg-[color:var(--color-brand-blue)]/10 hover:text-[color:var(--color-brand-blue)]">🏪 Restaurant Profile</a>
                <a routerLink="/profile" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-brand-black hover:bg-[color:var(--color-brand-blue)]/10 hover:text-[color:var(--color-brand-blue)]">⚙️ Account Settings</a>
                <a [routerLink]="['/owner']" [queryParams]="{ tab: 'financials' }" (click)="profileOpen.set(false)" class="block px-4 py-2.5 text-xs font-bold text-brand-black hover:bg-[color:var(--color-brand-blue)]/10 hover:text-[color:var(--color-brand-blue)]">💳 Billing</a>
                <button (click)="handleLogout()" class="w-full text-left px-4 py-2.5 text-xs font-bold text-[color:var(--color-brand-red)] hover:bg-[color:var(--color-brand-red)]/10 rounded-b-2xl">🚪 Logout</button>
              </div>
            </div>

            <!-- Favourites top nav pill -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
               routerLink="/favourites" routerLinkActive="active-tab-top"
               class="pill-fx pill-fx-red hidden sm:flex items-center gap-1.5 border border-[color:var(--color-brand-red)]/25 rounded-full px-3.5 py-2 text-xs font-black text-[color:var(--color-brand-red)] transition-all">
              <span class="pill-fx-fill" aria-hidden="true"></span>
              <span class="pill-fx-content relative z-10 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21s-7.5-4.873-10.09-9.05C.36 9.53 1.2 6.2 4.14 5.02c2.1-.84 4.3-.12 5.86 1.6 1.56-1.72 3.76-2.44 5.86-1.6 2.94 1.18 3.78 4.51 2.23 6.93C19.5 16.127 12 21 12 21Z"/>
                </svg>
                <span>Favourites</span>
              </span>
            </a>

            <!-- Notifications bell -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
              routerLink="/notifications" title="Notifications"
              class="icon-fx relative w-9 h-9 flex items-center justify-center text-[color:var(--color-brand-blue)] rounded-full transition">
              <span class="icon-fx-fill" aria-hidden="true"></span>
              <svg xmlns="http://www.w3.org/2000/svg" class="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </a>

            <!-- Cart with badge -->
            <a *ngIf="!authService.isStoreOwner() && !authService.isAdmin()"
               routerLink="/cart" title="Cart" class="icon-fx relative w-9 h-9 flex items-center justify-center text-[color:var(--color-brand-blue)] rounded-full transition">
              <span class="icon-fx-fill" aria-hidden="true"></span>
              <svg xmlns="http://www.w3.org/2000/svg" class="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.885-4.784 2.253-7.391a1.125 1.125 0 0 0-1.12-1.226H5.25M7.5 14.25 5.106 5.272M6.75 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span *ngIf="cartService.cartItemCount() > 0" class="absolute top-0 right-0 w-4 h-4 bg-[color:var(--color-brand-red)] text-white rounded-full text-[9px] font-black flex items-center justify-center z-20">
                {{ cartService.cartItemCount() }}
              </span>
            </a>
          </div>
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
      background: rgba(10, 95, 255, 0.35) !important;
      color: #ffffff !important;
      border: 1px solid rgba(10, 95, 255, 0.6) !important;
      box-shadow: 0 0 15px rgba(10, 95, 255, 0.25);
    }

    .active-tab-top {
      background: rgba(255, 36, 0, 0.12) !important;
      color: var(--color-brand-red) !important;
      border: 1px solid rgba(255, 36, 0, 0.4) !important;
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
    .pill-fx-blue .pill-fx-fill { background: var(--color-brand-blue); }
    .pill-fx-red .pill-fx-fill { background: var(--color-brand-red); }
    .pill-fx-solid .pill-fx-fill { background: rgba(255, 255, 255, 0.25); }
    .pill-fx:hover .pill-fx-fill { transform: translate(-50%, 65%) scale(1); }
    .pill-fx-content { transition: color 0.3s ease 0.05s; }
    .pill-fx-blue:hover .pill-fx-content,
    .pill-fx-red:hover .pill-fx-content { color: #fff; }

    /* Circular icon buttons: soft centered fill on hover */
    .icon-fx .icon-fx-fill {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: var(--color-brand-blue);
      opacity: 0;
      transform: scale(0.5);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }
    .icon-fx:hover .icon-fx-fill { opacity: 0.12; transform: scale(1); }
    .icon-fx:hover { color: var(--color-brand-blue); }
  `]
})
export class LayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  readonly locationService = inject(LocationService);

  showIntro = signal(false);
  searchQuery = '';
  logoActive = signal(false);
  cityDropdownOpen = signal(false);

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
  }

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
    this.cityDropdownOpen.set(false);
  }

  toggleCityDropdown(event: Event) {
    event.stopPropagation();
    this.cityDropdownOpen.update(v => !v);
  }

  selectCity(city: string) {
    this.locationService.selectCity(city);
    this.cityDropdownOpen.set(false);
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
}
