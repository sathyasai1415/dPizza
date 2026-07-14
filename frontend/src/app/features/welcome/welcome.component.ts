import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, AuthResponse } from '../../shared/models';
import { LightfallComponent } from '../../shared/lightfall/lightfall.component';

type Mode = 'login' | 'store' | 'demo' | 'admin' | 'register';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, LightfallComponent],
  template: `
    <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden bg-[color:var(--color-hero-bg)]">

      <!-- Lightfall animated background -->
      <div class="fixed inset-0 z-0 pointer-events-none">
        <app-lightfall [backgroundColor]="'#FF9A39'"></app-lightfall>
      </div>
      <!-- vignette over the animation -->
      <div class="fixed inset-0 z-[1] pointer-events-none"
        style="background: radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.25) 100%);"></div>

      <!-- Floating ingredient emojis -->
      <div class="fixed inset-0 z-[2] pointer-events-none select-none" aria-hidden="true">
        @for (ing of ingredients; track ing.emoji) {
          <span class="floating-ingredient text-2xl sm:text-3xl opacity-25"
            [style.left]="ing.x" [style.top]="ing.y"
            [style.animation]="'float ' + ing.dur + 's ease-in-out infinite'"
            [style.animation-delay]="ing.delay + 's'">{{ ing.emoji }}</span>
        }
      </div>

      <div class="relative z-10 w-full max-w-lg">
        <!-- Brand -->
        <div class="flex flex-col items-center text-center mb-7">
          <div class="w-20 h-20 rounded-[28px] flex items-center justify-center mb-4"
            style="background: linear-gradient(135deg, #dc2626, #f97316); box-shadow: 0 8px 32px rgba(220,38,38,0.5)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-brand-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 11h.01M11 15h.01M16 16h.01M12 11h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"/>
            </svg>
          </div>
          <h1 class="text-5xl font-black text-[color:var(--color-hero-text)] tracking-tight" style="text-shadow: 0 2px 20px rgba(220,38,38,0.4)">
            MiSlice
          </h1>
          <p class="text-[color:var(--color-hero-text)] text-sm mt-2 font-medium">Michigan's pizza marketplace</p>
        </div>

        <!-- Glass container -->
        <div class="clay rounded-[32px] overflow-hidden p-6 sm:p-8 border border-brand-black shadow-2xl bg-brand-white">
          <!-- Error alert -->
          <div *ngIf="error()" class="mb-4 p-3.5 rounded-2xl text-xs font-bold bg-brand-red text-brand-white border border-brand-red text-brand-red">
            ⚠️ {{ error() }}
          </div>

          <!-- ROLE SELECTION MODAL (For first time Google Registration) -->
          <div *ngIf="roleRequired()" class="space-y-6 animate-fadeIn py-3">
            <h2 class="text-xl font-black text-brand-black text-center">Complete Registration</h2>
            <p class="text-xs text-brand-black text-center">Choose your role to finalize setting up your account.</p>

            <div class="grid grid-cols-2 gap-4">
              <button type="button" (click)="selectedSocialRole.set('CUSTOMER')"
                [class]="'p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ' + (selectedSocialRole() === 'CUSTOMER' ? 'border-[color:var(--color-brand-blue)] bg-[color:var(--color-brand-blue)] text-brand-white' : 'border-brand-black bg-brand-white text-brand-black hover:border-brand-black')">
                <span class="text-3xl">🍕</span>
                <span class="text-xs font-black">Customer</span>
              </button>
              <button type="button" (click)="selectedSocialRole.set('RESTAURANT_OWNER')"
                [class]="'p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ' + (selectedSocialRole() === 'RESTAURANT_OWNER' ? 'border-[color:var(--color-brand-blue)] bg-[color:var(--color-brand-blue)] text-brand-white' : 'border-brand-black bg-brand-white text-brand-black hover:border-brand-black')">
                <span class="text-3xl">🏪</span>
                <span class="text-xs font-black">Restaurant Owner</span>
              </button>
            </div>

            <!-- Optional Restaurant Info for Social Register -->
            <div *ngIf="selectedSocialRole() === 'RESTAURANT_OWNER'" class="space-y-3.5 pt-3 border-t border-brand-black animate-fadeIn">
              <p class="text-[10px] font-black text-brand-black uppercase tracking-widest">Business Details</p>
              <div>
                <label class="block text-xs font-bold text-brand-black mb-1">Restaurant Name</label>
                <input type="text" [(ngModel)]="restaurantName" placeholder="e.g. Detroit Slice Shop" class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-xs outline-none focus:border-brand-red" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-brand-black mb-1">City</label>
                  <input type="text" [(ngModel)]="city" placeholder="Detroit" class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-xs outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black mb-1">ZIP Code</label>
                  <input type="text" [(ngModel)]="postalCode" placeholder="48201" class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-xs outline-none focus:border-brand-red" />
                </div>
              </div>
            </div>

            <button type="button" (click)="completeGoogleRegistration()" [disabled]="loading() || !selectedSocialRole()"
              class="w-full py-3.5 rounded-xl font-black bg-[color:var(--color-brand-blue)] text-brand-white text-sm shadow-lg hover:brightness-110 transition duration-200">
              {{ loading() ? 'Saving Profile...' : 'Complete Registration' }}
            </button>
          </div>

          <!-- DEMO MODE SELECTION -->
          <div *ngIf="mode() === 'demo' && !roleRequired()" class="space-y-3">
            <button (click)="setMode('login')" class="text-xs font-bold text-brand-black hover:text-brand-black mb-2 flex items-center gap-1">
              ← Back to Sign In
            </button>
            <p class="text-center text-brand-black text-xs font-bold uppercase tracking-widest mb-4">Try without signing in</p>
            
            <button (click)="startDemo('CUSTOMER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-black bg-brand-white text-left transition hover:bg-brand-white hover:border-brand-black">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-red text-brand-white flex items-center justify-center text-brand-red">🍕</div>
                <div>
                  <p class="text-sm font-bold text-brand-black">Customer Demo</p>
                  <p class="text-xs text-brand-black">Browse & compare pizza quotes</p>
                </div>
              </div>
              <span class="text-brand-black">→</span>
            </button>

            <button (click)="startDemo('RESTAURANT_OWNER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-black bg-brand-white text-left transition hover:bg-brand-white hover:border-brand-black">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-orange text-brand-white flex items-center justify-center text-brand-orange">🏪</div>
                <div>
                  <p class="text-sm font-bold text-brand-black">Store Owner Demo</p>
                  <p class="text-xs text-brand-black">Manage menu, hours, and orders</p>
                </div>
              </div>
              <span class="text-brand-black">→</span>
            </button>

            <button (click)="startDemo('ADMIN')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-black bg-brand-white text-left transition hover:bg-brand-white hover:border-brand-black">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">🛡️</div>
                <div>
                  <p class="text-sm font-bold text-brand-black">Platform Admin</p>
                  <p class="text-xs text-brand-black">Approve applications & operations</p>
                </div>
              </div>
              <span class="text-brand-black">→</span>
            </button>
          </div>

          <!-- TRADITIONAL LOGIN -->
          <div *ngIf="mode() === 'login' && !roleRequired()">
            <h2 class="text-xl font-bold text-brand-black mb-4">Sign In</h2>

            <!-- Sub-tabs for Customer vs Store Owner -->
            <div class="flex gap-1.5 p-1 bg-brand-white rounded-2xl mb-5">
              <button type="button" (click)="loginType.set('customer'); error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (loginType() === 'customer' ? 'bg-brand-black text-brand-white shadow-lg' : 'text-brand-black hover:bg-black/5')">
                🍕 Customer
              </button>
              <button type="button" (click)="loginType.set('owner'); error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (loginType() === 'owner' ? 'bg-brand-black text-brand-white shadow-lg' : 'text-brand-black hover:bg-black/5')">
                🏪 Store Owner
              </button>
            </div>

            <form (submit)="handleLogin($event)" class="space-y-4">
              <div *ngIf="loginType() === 'customer'">
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" [required]="loginType() === 'customer'"
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div *ngIf="loginType() === 'owner'">
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Store ID / Slug</label>
                <input type="text" [(ngModel)]="storeId" name="storeId" [required]="loginType() === 'owner'" placeholder="e.g. shamz-pizza"
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-bold text-brand-black uppercase">Password</label>
                </div>
                <div class="relative">
                  <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl pl-4 pr-11 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                  <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-black hover:text-brand-black text-sm">
                    {{ showPassword() ? '👁️' : '🙈' }}
                  </button>
                </div>
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[color:var(--color-brand-blue)] text-brand-white text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>

            <!-- Google Sign In Separator (Only for customers) -->
            <div *ngIf="loginType() === 'customer'" class="relative flex items-center justify-center my-5">
              <div class="absolute inset-x-0 h-px bg-brand-black"></div>
              <span class="relative z-10 px-3 bg-brand-white text-[10px] font-bold text-brand-black uppercase tracking-widest">Or continue with</span>
            </div>

            <!-- Google Sign In Button -->
            <button *ngIf="loginType() === 'customer'" type="button" (click)="handleGoogleLogin()" [disabled]="loading()"
              class="w-full py-3 rounded-xl font-bold text-brand-black text-sm bg-brand-white border border-brand-black hover:bg-brand-white flex items-center justify-center gap-2.5 transition duration-200">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </button>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('register')" class="font-bold text-brand-red hover:underline">
                Create a new account
              </button>
              <button (click)="setMode('demo')" class="font-bold text-brand-black hover:text-brand-black">
                Explore as Guest / Demo Mode
              </button>
            </div>
          </div>

          <!-- REGISTER -->
          <div *ngIf="mode() === 'register' && !roleRequired()">
            <h2 class="text-xl font-bold text-brand-black mb-4">Register</h2>

            <!-- Sub-tabs for Customer vs Owner Register -->
            <div class="flex gap-1.5 p-1 bg-brand-white rounded-2xl mb-5">
              <button type="button" (click)="regRole = 'CUSTOMER'; error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (regRole === 'CUSTOMER' ? 'bg-brand-black text-brand-white shadow-lg' : 'text-brand-black hover:bg-black/5')">
                🍕 Customer
              </button>
              <button type="button" (click)="regRole = 'RESTAURANT_OWNER'; error.set('')"
                [class]="'flex-1 py-2 text-center rounded-xl text-xs font-black transition-all ' + (regRole === 'RESTAURANT_OWNER' ? 'bg-brand-black text-brand-white shadow-lg' : 'text-brand-black hover:bg-black/5')">
                🏪 Store Owner
              </button>
            </div>

            <form (submit)="handleRegister($event)" class="space-y-4">
              <!-- Customer Profile Specific Fields -->
              <div *ngIf="regRole === 'CUSTOMER'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">First Name</label>
                  <input type="text" [(ngModel)]="firstName" name="firstName" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Last Name</label>
                  <input type="text" [(ngModel)]="lastName" name="lastName" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
              </div>

              <!-- Owner Specific Business Fields -->
              <div *ngIf="regRole === 'RESTAURANT_OWNER'" class="space-y-3.5">
                <p class="text-[10px] font-black text-brand-black uppercase tracking-widest">Business Details</p>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Owner Name</label>
                  <input type="text" [(ngModel)]="fullName" name="fullName" placeholder="e.g. John Doe" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Restaurant Name</label>
                  <input type="text" [(ngModel)]="restaurantName" name="restaurantName" placeholder="e.g. Detroit Slice Shop" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Street Address</label>
                  <input type="text" [(ngModel)]="addressLine" name="addressLine" placeholder="e.g. 123 Woodward Ave" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-brand-black uppercase mb-1">City</label>
                    <input type="text" [(ngModel)]="city" name="city" placeholder="Detroit" required
                      class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-brand-black uppercase mb-1">ZIP</label>
                    <input type="text" [(ngModel)]="postalCode" name="postalCode" placeholder="48201" required
                      class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Restaurant Description</label>
                  <textarea [(ngModel)]="description" name="description" placeholder="A brief description of your pizzeria..." required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red h-20 resize-none"></textarea>
                </div>
              </div>

              <!-- Shared credentials fields -->
              <p class="text-[10px] font-black text-brand-black uppercase tracking-widest pt-2 border-t border-brand-black">Credentials</p>
              <div>
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div>
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Phone Number (optional)</label>
                <input type="text" [(ngModel)]="phone" name="phone" placeholder="e.g. 313-555-0123"
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Password</label>
                  <input type="password" [(ngModel)]="password" name="password" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-brand-black uppercase mb-1">Confirm</label>
                  <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                    class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
                </div>
              </div>

              <div class="flex items-start gap-2.5 pt-2 select-none">
                <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required id="acceptTerms"
                  class="mt-1 rounded border-brand-black bg-brand-white text-brand-red accent-red-600 focus:ring-0 focus:outline-none" />
                <label for="acceptTerms" class="text-xs text-brand-black leading-snug">
                  I accept the <a class="text-brand-red hover:underline">Terms of Service</a> &amp; <a class="text-brand-red hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[color:var(--color-brand-blue)] text-brand-white text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Registering...' : 'Register' }}
              </button>
            </form>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('login')" class="font-bold text-brand-red hover:underline">
                Already have an account? Sign In
              </button>
            </div>
          </div>

          <!-- ADMIN LOGIN -->
          <div *ngIf="mode() === 'admin' && !roleRequired()">
            <button (click)="setMode('demo')" class="text-xs font-bold text-brand-black hover:text-brand-black mb-5 flex items-center gap-1">
              ← Back to Demo
            </button>
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style="background: linear-gradient(135deg,#dc2626,#7f1d1d); box-shadow: 0 6px 20px rgba(220,38,38,0.4)">
                🛡️
              </div>
              <p class="text-lg font-black text-brand-black">Platform Admin</p>
              <p class="text-xs text-brand-black mt-1">Restricted access — administrators only</p>
            </div>

            <form (submit)="handleLogin($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Admin Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div>
                <label class="block text-xs font-bold text-brand-black uppercase mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black bg-[color:var(--color-brand-blue)] text-brand-white text-sm shadow-lg transition duration-200 hover:brightness-110">
                {{ loading() ? 'Authenticating...' : 'Sign In as Admin' }}
              </button>
            </form>
          </div>

        </div>

        <!-- Showcase: same pizza, compared -->
        <div class="mt-6">
          <p class="text-center text-[10px] font-black uppercase tracking-widest text-brand-black mb-3">
            Same large pepperoni — compared live
          </p>
          <div class="grid grid-cols-3 gap-2">
            @for (s of showcase; track s.store) {
              <div class="clay-soft rounded-2xl p-3 text-center relative"
                [class.ring-1]="s.best" [class.ring-red-500]="s.best">
                <span *ngIf="s.best"
                  class="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-brand-black px-2 py-0.5 rounded-full">
                  Best
                </span>
                <p class="text-lg">{{ s.emoji }}</p>
                <p class="text-[10px] font-bold text-brand-black truncate">{{ s.store }}</p>
                <p class="text-sm font-black" [class.text-brand-orange]="s.best" [class.text-brand-black]="!s.best">{{ s.price }}</p>
                <p class="text-[9px] text-brand-black">{{ s.eta }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomeComponent {
  // Floating ingredient atmosphere (spec: 🌿 🧀 🍅 🫒 🌶️ 🧅)
  ingredients = [
    { emoji: '🌿', x: '8%',  y: '18%', dur: 7,  delay: 0 },
    { emoji: '🧀', x: '85%', y: '12%', dur: 9,  delay: 1.2 },
    { emoji: '🍅', x: '12%', y: '72%', dur: 8,  delay: 0.6 },
    { emoji: '🫒', x: '88%', y: '65%', dur: 10, delay: 2 },
    { emoji: '🌶️', x: '75%', y: '85%', dur: 7.5, delay: 0.3 },
    { emoji: '🧅', x: '20%', y: '42%', dur: 8.5, delay: 1.8 },
  ];

  // Demo comparison strip (spec: cheapest highlighted as "Best")
  showcase = [
    { store: "Domino's",    emoji: '🍕', price: '$14.99', eta: '25 min', best: false },
    { store: 'Shamz Pizza', emoji: '🔥', price: '$11.99', eta: '18 min', best: true },
    { store: 'Pizza Hut',   emoji: '🍕', price: '$13.49', eta: '30 min', best: false },
  ];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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

  setMode(newMode: Mode) {
    this.error.set('');
    this.mode.set(newMode);
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

  /**
   * Shared handling for a successful Firebase auth. If the account has no backend
   * profile yet the API returns roleRequired=true with a null user — surface the
   * role-selection modal instead of crashing on a null user.
   */
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
    this.redirectUser(res.user);
  }

  handleGoogleLogin() {
    this.error.set('');
    this.loading.set(true);

    this.authService.loginWithGoogle().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.roleRequired) {
          // Trigger the role selection modal!
          // We can retrieve details from current Firebase Auth State
          const fbUser = (this.authService as any).firebaseAuth.currentUser;
          if (fbUser) {
            this.socialUid = fbUser.uid;
            this.socialEmail = fbUser.email || '';
            this.socialName = fbUser.displayName || 'Google User';
          }
          this.roleRequired.set(true);
        } else {
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

    // Form validations
    if (!this.acceptTerms) {
      this.error.set('You must accept the Terms of Service & Privacy Policy.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    // Password strength check (8+ chars, upper, lower, digit, special)
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
        this.redirectUser(res.user!);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Failed to start demo session. Ensure backend is running.');
      }
    });
  }

  private redirectUser(user: UserProfile) {
    const roles = user.roles ?? [];
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (roles.includes('RESTAURANT_OWNER') || roles.includes('RESTAURANT_STAFF')) {
      this.router.navigate(['/owner']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
