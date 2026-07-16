import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { LocationService } from '../../core/services/location.service';
import { UserProfile, AuthResponse } from '../../shared/models';
import { LocationPromptModalComponent } from '../../shared/components/location-prompt-modal.component';
import { WelcomePosterComponent } from '../../shared/components/welcome-poster.component';

type Mode = 'login' | 'store' | 'demo' | 'admin' | 'register';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LocationPromptModalComponent, WelcomePosterComponent],
  template: `
    <div class="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-black text-white bg-cover bg-center select-none" 
      style="background-image: url('/pizza_hero_bg.png');">
      
      <!-- Gradient overlays to match UberEats landing layout -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-[1]"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 z-[1]"></div>

      <!-- HEADER NAVIGATION -->
      <header class="relative z-10 w-full px-6 py-5 flex items-center justify-between">
        <!-- Logo -->
        <a routerLink="/home" class="flex items-center gap-2 select-none">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-inner animate-pulse" style="background: var(--gradient-mislice);">🍕</div>
          <span class="font-black text-lg tracking-tight"><span class="text-[#FF8A00]">MI</span><span class="text-[#D4AF37]">Slice</span></span>
        </a>
        <div class="flex items-center gap-3">
          <button (click)="openSignInModal('login')" class="px-4.5 py-2 rounded-full text-xs font-black bg-white text-black hover:bg-neutral-200 transition">Log in</button>
          <button (click)="openSignInModal('register')" class="px-4.5 py-2 rounded-full text-xs font-black bg-[#D4AF37] text-black hover:brightness-110 transition">Sign up</button>
        </div>
      </header>

      <!-- HERO BANNER SECTION -->
      <main class="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 sm:py-24 my-auto space-y-8 text-left">
        <!-- Error Alert -->
        <div *ngIf="error() && !loginModalOpen()" class="mb-4 max-w-3xl p-3.5 rounded-2xl text-xs font-bold bg-red-950/70 border border-red-500/30 text-red-400">
          ⚠️ {{ error() }}
        </div>

        <!-- Hero text -->
        <div class="space-y-4">
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#D4AF37] text-black shadow-md">✦ Detroit-Style Comparison</span>
          <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-2xl text-white">
            Find the best <span class="text-[#D4AF37]">pizza deals</span> near you
          </h1>
          <p class="text-neutral-300 text-sm sm:text-base max-w-md">
            Compare live prices, custom builds, and delivery speeds from top local pizzerias instantly.
          </p>
        </div>

        <!-- UBEREATS STYLE INPUT CONSOLE -->
        <div class="bg-[#0A0A0A]/95 border border-[#D4AF37]/25 rounded-[24px] p-2.5 shadow-2xl flex flex-col md:flex-row items-stretch gap-2.5 max-w-3xl">
          <!-- Location Input -->
          <div class="relative flex-1 flex items-center bg-[#111111] border border-[#D4AF37]/15 rounded-xl px-4 py-3 min-w-0">
            <span class="text-lg mr-2.5">📍</span>
            <input type="text" [(ngModel)]="location" placeholder="Enter your city (e.g. Detroit, Ann Arbor)" 
              class="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
            <button *ngIf="location" (click)="location = ''" class="text-[10px] font-bold text-neutral-400 hover:text-white uppercase tracking-widest shrink-0 ml-2">Clear</button>
          </div>

          <!-- Phone Number Input -->
          <div class="relative flex-1 flex items-center bg-[#111111] border border-[#D4AF37]/15 rounded-xl px-4 py-3 min-w-0">
            <span class="text-lg mr-2.5">📞</span>
            <input type="tel" [(ngModel)]="phoneNumber" placeholder="Phone Number" 
              class="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none" />
          </div>

          <!-- Action Button -->
          <button (click)="findPizza()" [disabled]="loading()"
            class="bg-[#D4AF37] hover:brightness-110 text-black font-black text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-2">
            <span>{{ loading() ? 'Searching...' : 'Find Pizza' }}</span>
          </button>
        </div>

        <div class="text-xs text-neutral-400 font-medium">
          Already have an account? <button (click)="openSignInModal('login')" class="text-[#D4AF37] hover:underline font-bold">Or Sign In</button>
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="relative z-10 w-full px-6 py-4 border-t border-[#D4AF37]/10 bg-black/60 backdrop-blur-sm text-center text-[10px] text-neutral-500">
        © 2026 MiSlice. All rights reserved. Served by GAE production default service.
      </footer>

      <!-- TRADITIONAL LOGIN OVERLAY MODAL -->
      <div *ngIf="loginModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
        <div class="relative w-full max-w-lg rounded-[32px] p-6 sm:p-8 border border-[#D4AF37] shadow-2xl bg-gradient-to-br from-[#2D0B5A] via-[#1E053D] to-[#0E011E] text-white overflow-y-auto max-h-[90vh] scrollbar-none">
          
          <!-- Close button -->
          <button (click)="loginModalOpen.set(false)" class="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-sm">✕</button>

          <!-- Error Alert inside modal -->
          <div *ngIf="error()" class="mb-4 p-3.5 rounded-2xl text-xs font-bold bg-red-950/70 border border-red-500/30 text-red-400">
            ⚠️ {{ error() }}
          </div>

          <!-- ROLE SELECTION MODAL (For first time Google Registration) -->
          <div *ngIf="roleRequired()" class="space-y-6 py-3">
            <h2 class="text-xl font-black text-center text-[#D4AF37]">Complete Registration</h2>
            <p class="text-xs text-neutral-300 text-center">Choose your role to finalize setting up your account.</p>

            <div class="grid grid-cols-2 gap-4">
              <button type="button" (click)="selectedSocialRole.set('CUSTOMER')"
                [class]="'p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ' + (selectedSocialRole() === 'CUSTOMER' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-[#D4AF37]/20 bg-transparent text-neutral-400 hover:border-[#D4AF37]/55')">
                <span class="text-3xl">🍕</span>
                <span class="text-xs font-black">Customer</span>
              </button>
              <button type="button" (click)="selectedSocialRole.set('RESTAURANT_OWNER')"
                [class]="'p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ' + (selectedSocialRole() === 'RESTAURANT_OWNER' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-[#D4AF37]/20 bg-transparent text-neutral-400 hover:border-[#D4AF37]/55')">
                <span class="text-3xl">🏪</span>
                <span class="text-xs font-black">Restaurant Owner</span>
              </button>
            </div>

            <!-- Optional Restaurant Info for Social Register -->
            <div *ngIf="selectedSocialRole() === 'RESTAURANT_OWNER'" class="space-y-3.5 pt-3 border-t border-[#D4AF37]/25 animate-fadeIn">
              <p class="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Business Details</p>
              <div>
                <label class="block text-xs font-bold text-neutral-400 mb-1">Restaurant Name</label>
                <input type="text" [(ngModel)]="restaurantName" placeholder="e.g. Detroit Slice Shop" class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-neutral-400 mb-1">City</label>
                  <input type="text" [(ngModel)]="city" placeholder="Detroit" class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 mb-1">ZIP Code</label>
                  <input type="text" [(ngModel)]="postalCode" placeholder="48201" class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
            </div>

            <button type="button" (click)="completeGoogleRegistration()" [disabled]="loading() || !selectedSocialRole()"
              class="w-full py-3.5 rounded-xl font-black bg-[#D4AF37] text-black text-sm shadow-lg hover:brightness-110 transition duration-200">
              {{ loading() ? 'Saving Profile...' : 'Complete Registration' }}
            </button>
          </div>

          <!-- DEMO MODE SELECTION -->
          <div *ngIf="mode() === 'demo' && !roleRequired()" class="space-y-3">
            <button (click)="setMode('login')" class="text-xs font-bold text-[#D4AF37] hover:underline mb-2 flex items-center gap-1">
              ← Back to Sign In
            </button>
            <p class="text-center text-neutral-300 text-xs font-bold uppercase tracking-widest mb-4">Try without signing in</p>
            
            <button (click)="startDemo('CUSTOMER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-[#D4AF37]/20 bg-transparent text-left transition hover:bg-[#D4AF37]/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg">🍕</div>
                <div>
                  <p class="text-sm font-bold text-white">Customer Demo</p>
                  <p class="text-xs text-neutral-400">Browse & compare pizza quotes</p>
                </div>
              </div>
              <span class="text-[#D4AF37]">→</span>
            </button>

            <button (click)="startDemo('RESTAURANT_OWNER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-[#D4AF37]/20 bg-transparent text-left transition hover:bg-[#D4AF37]/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">🏪</div>
                <div>
                  <p class="text-sm font-bold text-white">Store Owner Demo</p>
                  <p class="text-xs text-neutral-400">Manage menu, hours, and orders</p>
                </div>
              </div>
              <span class="text-[#D4AF37]">→</span>
            </button>

            <button (click)="startDemo('ADMIN')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-[#D4AF37]/20 bg-transparent text-left transition hover:bg-[#D4AF37]/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg text-blue-400">🛡️</div>
                <div>
                  <p class="text-sm font-bold text-white">Platform Admin</p>
                  <p class="text-xs text-neutral-400">Approve applications & operations</p>
                </div>
              </div>
              <span class="text-[#D4AF37]">→</span>
            </button>
          </div>

          <!-- TRADITIONAL LOGIN -->
          <div *ngIf="mode() === 'login' && !roleRequired()">
            <h2 class="text-xl font-bold text-white mb-4 text-[#D4AF37]">Sign In</h2>

            <!-- Sub-tabs for Customer vs Store Owner -->
            <div class="flex gap-1.5 p-1 bg-white/5 rounded-2xl mb-5">
              <button type="button" (click)="loginType.set('customer'); error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (loginType() === 'customer' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-neutral-400 hover:bg-white/5')">
                🍕 Customer
              </button>
              <button type="button" (click)="loginType.set('owner'); error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (loginType() === 'owner' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-neutral-400 hover:bg-white/5')">
                🏪 Store Owner
              </button>
            </div>

            <form (submit)="handleLogin($event)" class="space-y-4">
              <div *ngIf="loginType() === 'customer'">
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" [required]="loginType() === 'customer'"
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div *ngIf="loginType() === 'owner'">
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Store ID / Slug</label>
                <input type="text" [(ngModel)]="storeId" name="storeId" [required]="loginType() === 'owner'" placeholder="e.g. shamz-pizza"
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-bold text-neutral-400 uppercase">Password</label>
                </div>
                <div class="relative">
                  <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl pl-4 pr-11 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                  <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm">
                    {{ showPassword() ? '👁️' : '🙈' }}
                  </button>
                </div>
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[#D4AF37] text-black text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>

            <!-- Google Sign In Separator (Only for customers) -->
            <div *ngIf="loginType() === 'customer'" class="relative flex items-center justify-center my-5">
              <div class="absolute inset-x-0 h-px bg-white/10"></div>
              <span class="relative z-10 px-3 bg-[#0A0A0A] text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Or continue with</span>
            </div>

            <!-- Google Sign In Button -->
            <button *ngIf="loginType() === 'customer'" type="button" (click)="handleGoogleLogin()" [disabled]="loading()"
              class="w-full py-3 rounded-xl font-bold text-white text-sm bg-transparent border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 flex items-center justify-center gap-2.5 transition duration-200">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </button>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('register')" class="font-bold text-[#D4AF37] hover:underline">
                Create a new account
              </button>
              <button (click)="setMode('demo')" class="font-bold text-neutral-300 hover:text-white">
                Explore as Guest / Demo Mode
              </button>
            </div>
          </div>

          <!-- REGISTER -->
          <div *ngIf="mode() === 'register' && !roleRequired()">
            <h2 class="text-xl font-bold text-[#D4AF37] mb-4">Register</h2>

            <!-- Sub-tabs for Customer vs Owner Register -->
            <div class="flex gap-1.5 p-1 bg-white/5 rounded-2xl mb-5">
              <button type="button" (click)="regRole = 'CUSTOMER'; error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (regRole === 'CUSTOMER' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-neutral-400 hover:bg-white/5')">
                🍕 Customer
              </button>
              <button type="button" (click)="regRole = 'RESTAURANT_OWNER'; error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (regRole === 'RESTAURANT_OWNER' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-neutral-400 hover:bg-white/5')">
                🏪 Store Owner
              </button>
            </div>

            <form (submit)="handleRegister($event)" class="space-y-4">
              <!-- Customer Profile Specific Fields -->
              <div *ngIf="regRole === 'CUSTOMER'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">First Name</label>
                  <input type="text" [(ngModel)]="firstName" name="firstName" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Last Name</label>
                  <input type="text" [(ngModel)]="lastName" name="lastName" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>

              <!-- Owner Specific Business Fields -->
              <div *ngIf="regRole === 'RESTAURANT_OWNER'" class="space-y-3.5">
                <p class="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Business Details</p>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Owner Name</label>
                  <input type="text" [(ngModel)]="fullName" name="fullName" placeholder="e.g. John Doe" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Restaurant Name</label>
                  <input type="text" [(ngModel)]="restaurantName" name="restaurantName" placeholder="e.g. Detroit Slice Shop" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Street Address</label>
                  <input type="text" [(ngModel)]="addressLine" name="addressLine" placeholder="e.g. 123 Woodward Ave" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">City</label>
                    <input type="text" [(ngModel)]="city" name="city" placeholder="Detroit" required
                      class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">ZIP</label>
                    <input type="text" [(ngModel)]="postalCode" name="postalCode" placeholder="48201" required
                      class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Restaurant Description</label>
                  <textarea [(ngModel)]="description" name="description" placeholder="A brief description of your pizzeria..." required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] h-20 resize-none"></textarea>
                </div>
              </div>

              <!-- Shared credentials fields -->
              <p class="text-[10px] font-black text-neutral-300 uppercase tracking-widest pt-2 border-t border-[#D4AF37]/20">Credentials</p>
              <div>
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Phone Number (optional)</label>
                <input type="text" [(ngModel)]="phone" name="phone" placeholder="e.g. 313-555-0123"
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Password</label>
                  <input type="password" [(ngModel)]="password" name="password" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Confirm</label>
                  <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                    class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>

              <div class="flex items-start gap-2.5 pt-2 select-none">
                <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required id="acceptTerms"
                  class="mt-1 rounded border-[#D4AF37]/20 bg-transparent text-[#D4AF37] focus:ring-0 focus:outline-none" />
                <label for="acceptTerms" class="text-xs text-neutral-300 leading-snug">
                  I accept the <a class="text-[#D4AF37] hover:underline">Terms of Service</a> &amp; <a class="text-[#D4AF37] hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[#D4AF37] text-black text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Registering...' : 'Register' }}
              </button>
            </form>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('login')" class="font-bold text-[#D4AF37] hover:underline">
                Already have an account? Sign In
              </button>
            </div>
          </div>

          <!-- ADMIN LOGIN -->
          <div *ngIf="mode() === 'admin' && !roleRequired()">
            <button (click)="setMode('demo')" class="text-xs font-bold text-[#D4AF37] hover:underline mb-5 flex items-center gap-1">
              ← Back to Demo
            </button>
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-red-500/20 text-red-500">
                🛡️
              </div>
              <p class="text-lg font-black text-white">Platform Admin</p>
              <p class="text-xs text-neutral-400 mt-1">Restricted access — administrators only</p>
            </div>

            <form (submit)="handleLogin($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Admin Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-neutral-400 uppercase mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[#D4AF37] text-black text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Authenticating...' : 'Sign In as Admin' }}
              </button>
            </form>
          </div>

        </div>
      </div>

      <!-- Location Modal (shown after login) -->
      <app-location-prompt-modal
        *ngIf="showLocationModal()"
        (locationSelected)="onLocationSelected($event)"
        (skipped)="onLocationSkipped()">
      </app-location-prompt-modal>

      <!-- Welcome Poster (shown after location) -->
      <app-welcome-poster
        *ngIf="showWelcomePoster()"
        (closed)="onPosterClosed()">
      </app-welcome-poster>

    </div>
  `,
  styles: [`
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class WelcomeComponent {
  private readonly authService = inject(AuthService);
  private readonly onboarding = inject(OnboardingService);
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);

  // Redesigned Welcome input states
  location = '';
  phoneNumber = '';

  // traditional modal toggle
  loginModalOpen = signal(false);
  showLocationModal = signal(false);
  showWelcomePoster = signal(false);
  pendingUser = signal<UserProfile | null>(null);

  mode = signal<Mode>('login');
  loginType = signal<'customer' | 'owner'>('customer');
  loading = signal(false);
  error = signal('');

  // Credentials
  email = '';
  storeId = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  phone = '';
  regRole = 'CUSTOMER';
  acceptTerms = false;

  // Customer detailed name fields
  firstName = '';
  lastName = '';

  // Restaurant details fields
  restaurantName = '';
  addressLine = '';
  city = '';
  state = 'MI';
  postalCode = '';
  description = '';
  website = '';

  // Google OAuth registration state
  socialUid = '';
  socialEmail = '';
  socialName = '';
  roleRequired = signal(false);
  selectedSocialRole = signal<'CUSTOMER' | 'RESTAURANT_OWNER' | null>(null);

  // Toggle Password
  showPassword = signal(false);

  openSignInModal(startMode: Mode) {
    this.mode.set(startMode);
    this.loginModalOpen.set(true);
  }

  setMode(newMode: Mode) {
    this.error.set('');
    this.mode.set(newMode);
  }

  findPizza() {
    if (!this.location.trim() || !this.phoneNumber.trim()) {
      this.error.set('Please enter both your Location and Phone Number.');
      return;
    }
    this.error.set('');
    this.loading.set(true);

    // Save location to selection
    this.locationService.selectCity(this.location.trim());

    // Login as Customer demo guest session
    this.authService.demoLogin('CUSTOMER').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user!);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Failed to initialize session.');
      }
    });
  }

  handleLogin(e: Event) {
    e.preventDefault();
    this.error.set('');
    this.loading.set(true);

    if (this.loginType() === 'owner') {
      if (!this.storeId.trim()) {
        this.error.set('Please enter a Store ID.');
        this.loading.set(false);
        return;
      }
      this.authService.resolveStoreOwnerEmail(this.storeId.trim()).subscribe({
        next: (res) => {
          this.authService.login(res.email, this.password).subscribe({
            next: (loginRes) => this.onLoginResult(loginRes),
            error: (err) => {
              this.loading.set(false);
              this.error.set(err.error?.message || err.message || 'Login failed. Please verify password.');
            }
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Store ID not found or no owner associated.');
        }
      });
    } else {
      this.authService.login(this.email, this.password).subscribe({
        next: (res) => this.onLoginResult(res),
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || err.message || 'Login failed. Please verify credentials.');
        }
      });
    }
  }

  private onLoginResult(res: AuthResponse) {
    this.loading.set(false);
    if (res.roleRequired || !res.user) {
      const fbUser = (this.authService as any).firebaseAuth.currentUser;
      if (fbUser) {
        this.socialUid = fbUser.uid;
        this.socialEmail = fbUser.email || this.email || '';
        this.socialName = fbUser.displayName || (this.socialEmail ? this.socialEmail.split('@')[0] : 'User');
      }
      this.roleRequired.set(true);
      return;
    }
    this.loginModalOpen.set(false);
    this.redirectUser(res.user);
  }

  handleGoogleLogin() {
    this.error.set('');
    this.loading.set(true);

    this.authService.loginWithGoogle().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.roleRequired) {
          const fbUser = (this.authService as any).firebaseAuth.currentUser;
          if (fbUser) {
            this.socialUid = fbUser.uid;
            this.socialEmail = fbUser.email || '';
            this.socialName = fbUser.displayName || 'Google User';
          }
          this.roleRequired.set(true);
        } else {
          this.loginModalOpen.set(false);
          this.redirectUser(res.user!);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Google Authentication failed.');
      }
    });
  }

  completeGoogleRegistration() {
    const role = this.selectedSocialRole();
    if (!role) return;

    this.error.set('');
    this.loading.set(true);

    if (role === 'RESTAURANT_OWNER') {
      if (!this.restaurantName.trim() || !this.city.trim() || !this.postalCode.trim()) {
        this.error.set('Please fill out all required Business Details.');
        this.loading.set(false);
        return;
      }
    }

    this.authService.registerSocialUser(
      this.socialUid,
      this.socialEmail,
      this.socialName,
      role,
      undefined,
      role === 'RESTAURANT_OWNER' ? this.restaurantName.trim() : undefined,
      role === 'RESTAURANT_OWNER' ? this.addressLine.trim() : undefined,
      role === 'RESTAURANT_OWNER' ? this.city.trim() : undefined,
      role === 'RESTAURANT_OWNER' ? 'MI' : undefined,
      role === 'RESTAURANT_OWNER' ? this.postalCode.trim() : undefined,
      role === 'RESTAURANT_OWNER' ? this.description.trim() : undefined,
      role === 'RESTAURANT_OWNER' ? this.website.trim() : undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.roleRequired.set(false);
        this.loginModalOpen.set(false);
        this.redirectUser(res.user!);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Failed to complete registration.');
      }
    });
  }

  handleRegister(e: Event) {
    e.preventDefault();
    this.error.set('');

    if (!this.acceptTerms) {
      this.error.set('You must accept the Terms of Service & Privacy Policy.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(this.password)) {
      this.error.set('Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.');
      return;
    }

    if (this.regRole === 'RESTAURANT_OWNER') {
      if (!this.restaurantName.trim() || !this.fullName.trim() || !this.addressLine.trim() || !this.city.trim() || !this.postalCode.trim()) {
        this.error.set('Please fill out all required Business Details.');
        return;
      }
    }

    this.loading.set(true);

    const resolvedName = this.regRole === 'CUSTOMER' 
      ? `${this.firstName.trim()} ${this.lastName.trim()}`.trim()
      : this.fullName.trim();

    this.authService.register(
      this.email.trim(),
      this.password,
      resolvedName,
      this.phone ? this.phone.trim() : undefined,
      this.regRole,
      this.regRole === 'RESTAURANT_OWNER' ? this.restaurantName.trim() : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? this.addressLine.trim() : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? this.city.trim() : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? 'MI' : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? this.postalCode.trim() : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? this.description.trim() : undefined,
      this.regRole === 'RESTAURANT_OWNER' ? this.website.trim() : undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loginModalOpen.set(false);
        this.redirectUser(res.user!);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Registration failed. Try again.');
      }
    });
  }

  startDemo(role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN') {
    this.error.set('');
    this.loading.set(true);

    this.authService.demoLogin(role).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loginModalOpen.set(false);
        this.redirectUser(res.user!);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Failed to start demo session. Ensure backend is running.');
      }
    });
  }

  private redirectUser(user: UserProfile) {
    // For customers, show location modal → poster → redirect to home
    // For owners/admins, skip location and redirect directly
    const roles = user.roles ?? [];

    if (roles.includes('RESTAURANT_OWNER') || roles.includes('RESTAURANT_STAFF') || roles.includes('ADMIN')) {
      // Skip location flow for owners/admins
      this.performFinalRedirect(user);
    } else {
      // Show location modal for customers
      this.pendingUser.set(user);
      this.showLocationModal.set(true);
    }
  }

  onLocationSelected(location: { city: string; state?: string; phone?: string }) {
    // Save location to localStorage or service
    localStorage.setItem('user_location', JSON.stringify(location));
    this.showLocationModal.set(false);
    this.showWelcomePoster.set(true);
  }

  onLocationSkipped() {
    // Skip location, go straight to poster
    this.showLocationModal.set(false);
    this.showWelcomePoster.set(true);
  }

  onPosterClosed() {
    // After seeing poster, redirect to home
    this.showWelcomePoster.set(false);
    const user = this.pendingUser();
    if (user) {
      this.performFinalRedirect(user);
    }
  }

  private performFinalRedirect(user: UserProfile) {
    const roles = user.roles ?? [];
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (roles.includes('RESTAURANT_OWNER') || roles.includes('RESTAURANT_STAFF')) {
      this.router.navigate(['/owner']);
    } else {
      this.onboarding.triggerWelcome();
      this.router.navigate(['/home']);
    }
  }
}
