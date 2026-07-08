import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../shared/models';
import { LightfallComponent } from '../../shared/lightfall/lightfall.component';

type Mode = 'login' | 'store' | 'demo' | 'admin' | 'register';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, LightfallComponent],
  template: `
    <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden bg-transparent">

      <!-- Lightfall animated background -->
      <div class="fixed inset-0 z-0 pointer-events-none">
        <app-lightfall></app-lightfall>
      </div>
      <!-- vignette over the animation -->
      <div class="fixed inset-0 z-[1] pointer-events-none"
        style="background: radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%);"></div>

      <!-- Floating ingredient emojis -->
      <div class="fixed inset-0 z-[2] pointer-events-none select-none" aria-hidden="true">
        @for (ing of ingredients; track ing.emoji) {
          <span class="floating-ingredient text-2xl sm:text-3xl opacity-25"
            [style.left]="ing.x" [style.top]="ing.y"
            [style.animation]="'float ' + ing.dur + 's ease-in-out infinite'"
            [style.animation-delay]="ing.delay + 's'">{{ ing.emoji }}</span>
        }
      </div>

      <div class="relative z-10 w-full max-w-md">
        <!-- Brand -->
        <div class="flex flex-col items-center text-center mb-7">
          <div class="w-20 h-20 rounded-[28px] flex items-center justify-center mb-4"
            style="background: linear-gradient(135deg, #dc2626, #f97316); box-shadow: 0 8px 32px rgba(220,38,38,0.5)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 11h.01M11 15h.01M16 16h.01M12 11h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"/>
            </svg>
          </div>
          <h1 class="text-5xl font-black text-white tracking-tight" style="text-shadow: 0 2px 20px rgba(220,38,38,0.4)">
            MiSlice
          </h1>
          <p class="text-white/50 text-sm mt-2 font-medium">Michigan's pizza marketplace</p>
        </div>

        <!-- Glass container -->
        <div class="glass rounded-[32px] overflow-hidden p-7 sm:p-9 border border-white/10 shadow-2xl">
          <!-- Error alert -->
          <div *ngIf="error()" class="mb-4 p-3 rounded-2xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-300">
            {{ error() }}
          </div>

          <!-- DEMO MODE SELECTION -->
          <div *ngIf="mode() === 'demo'" class="space-y-3">
            <button (click)="setMode('login')" class="text-xs font-bold text-white/40 hover:text-white/70 mb-2 flex items-center gap-1">
              ← Back to Sign In
            </button>
            <p class="text-center text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Try without signing in</p>
            
            <button (click)="startDemo('CUSTOMER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 text-left transition hover:bg-white/10 hover:border-white/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">🍕</div>
                <div>
                  <p class="text-sm font-bold text-white">Customer Demo</p>
                  <p class="text-xs text-white/40">Browse & compare pizza quotes</p>
                </div>
              </div>
              <span class="text-white/30">→</span>
            </button>

            <button (click)="startDemo('RESTAURANT_OWNER')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 text-left transition hover:bg-white/10 hover:border-white/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">🏪</div>
                <div>
                  <p class="text-sm font-bold text-white">Store Owner Demo</p>
                  <p class="text-xs text-white/40">Manage menu, hours, and orders</p>
                </div>
              </div>
              <span class="text-white/30">→</span>
            </button>

            <button (click)="setMode('admin')" class="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 text-left transition hover:bg-white/10 hover:border-white/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">🛡️</div>
                <div>
                  <p class="text-sm font-bold text-white">Platform Admin</p>
                  <p class="text-xs text-white/40">Approve applications & operations</p>
                </div>
              </div>
              <span class="text-white/30">→</span>
            </button>
          </div>

          <!-- TRADITIONAL LOGIN -->
          <div *ngIf="mode() === 'login'">
            <h2 class="text-xl font-bold text-white mb-6">Sign In</h2>
            <form (submit)="handleLogin($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black text-white text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:from-red-500 hover:to-red-400 transition duration-200">
                {{ loading() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>

            <!-- Google Sign In Separator -->
            <div class="relative flex items-center justify-center my-5">
              <div class="absolute inset-x-0 h-px bg-white/10"></div>
              <span class="relative z-10 px-3 bg-[#0f0005] text-[10px] font-bold text-white/30 uppercase tracking-widest">Or continue with</span>
            </div>

            <!-- Google Sign In Button -->
            <button type="button" (click)="handleGoogleLogin()" [disabled]="loading()"
              class="w-full py-3 rounded-xl font-bold text-white text-sm bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2.5 transition duration-200">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </button>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('register')" class="font-bold text-red-400 hover:underline">
                Create a new account
              </button>
              <button (click)="setMode('demo')" class="font-bold text-white/40 hover:text-white/60">
                Explore as Guest / Demo Mode
              </button>
            </div>
          </div>

          <!-- REGISTER -->
          <div *ngIf="mode() === 'register'">
            <h2 class="text-xl font-bold text-white mb-6">Register</h2>
            <form (submit)="handleRegister($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Full Name</label>
                <input type="text" [(ngModel)]="fullName" name="fullName" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">I am registering as</label>
                <select [(ngModel)]="regRole" name="regRole"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500">
                  <option value="CUSTOMER">Customer</option>
                  <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                </select>
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black text-white text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:from-red-500 hover:to-red-400 transition duration-200">
                {{ loading() ? 'Registering...' : 'Register' }}
              </button>
            </form>

            <div class="mt-6 flex flex-col items-center gap-3 text-xs">
              <button (click)="setMode('login')" class="font-bold text-red-400 hover:underline">
                Already have an account? Sign In
              </button>
            </div>
          </div>

          <!-- ADMIN LOGIN -->
          <div *ngIf="mode() === 'admin'">
            <button (click)="setMode('demo')" class="text-xs font-bold text-white/40 hover:text-white/70 mb-5 flex items-center gap-1">
              ← Back to Demo
            </button>
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style="background: linear-gradient(135deg,#dc2626,#7f1d1d); box-shadow: 0 6px 20px rgba(220,38,38,0.4)">
                🛡️
              </div>
              <p class="text-lg font-black text-white">Platform Admin</p>
              <p class="text-xs text-white/40 mt-1">Restricted access — administrators only</p>
            </div>

            <form (submit)="handleLogin($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Admin Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-white/40 uppercase mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <button type="submit" [disabled]="loading()"
                class="w-full py-3.5 rounded-xl font-black text-white text-sm bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:from-red-500 hover:to-red-400 transition duration-200">
                {{ loading() ? 'Authenticating...' : 'Sign In as Admin' }}
              </button>
            </form>
          </div>

        </div>

        <!-- Showcase: same pizza, compared -->
        <div class="mt-6">
          <p class="text-center text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
            Same large pepperoni — compared live
          </p>
          <div class="grid grid-cols-3 gap-2">
            @for (s of showcase; track s.store) {
              <div class="glass-soft rounded-2xl p-3 text-center relative"
                [class.ring-1]="s.best" [class.ring-red-500]="s.best">
                <span *ngIf="s.best"
                  class="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-0.5 rounded-full">
                  Best
                </span>
                <p class="text-lg">{{ s.emoji }}</p>
                <p class="text-[10px] font-bold text-white/60 truncate">{{ s.store }}</p>
                <p class="text-sm font-black" [class.text-orange-400]="s.best" [class.text-white]="!s.best">{{ s.price }}</p>
                <p class="text-[9px] text-white/35">{{ s.eta }}</p>
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
  loading = signal(false);
  error = signal('');

  email = '';
  password = '';
  fullName = '';
  regRole = 'CUSTOMER';

  setMode(newMode: Mode) {
    this.error.set('');
    this.mode.set(newMode);
  }

  handleLogin(e: Event) {
    e.preventDefault();
    this.error.set('');
    this.loading.set(true);
    
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Login failed. Please verify credentials.');
      }
    });
  }

  handleGoogleLogin() {
    this.error.set('');
    this.loading.set(true);

    this.authService.loginWithGoogle().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Google Authentication failed.');
      }
    });
  }

  handleRegister(e: Event) {
    e.preventDefault();
    this.error.set('');
    this.loading.set(true);

    this.authService.register(this.email, this.password, this.fullName, undefined, this.regRole).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Registration failed. Try again.');
      }
    });
  }

  startDemo(role: 'CUSTOMER' | 'RESTAURANT_OWNER') {
    this.error.set('');
    this.loading.set(true);

    this.authService.demoLogin(role).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user);
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
