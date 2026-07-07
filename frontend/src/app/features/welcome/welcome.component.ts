import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../shared/models';

type Mode = 'login' | 'store' | 'demo' | 'admin' | 'register';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden"
      style="background: #0f0005;">

      <!-- Ambient Background Elements -->
      <div class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.2)_0%,transparent_70%)]"></div>

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
        <div class="glass rounded-[32px] overflow-hidden p-7 sm:p-9">
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
      </div>
    </div>
  `
})
export class WelcomeComponent {
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
        this.error.set(err.error?.message || 'Login failed. Please verify credentials.');
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
        this.error.set(err.error?.message || 'Registration failed. Try again.');
      }
    });
  }

  startDemo(role: 'CUSTOMER' | 'RESTAURANT_OWNER') {
    this.error.set('');
    this.loading.set(true);
    // Authenticate with seeded demo users from V2/V4 seed data
    const email = role === 'CUSTOMER' ? 'demo@mislice.com' : 'owner@shamzpizza.com';
    const password = 'password';

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectUser(res.user);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to start demo session. Ensure backend database is running and seeded.');
      }
    });
  }

  private redirectUser(user: UserProfile) {
    const roles = user.roles ?? [];
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (roles.includes('RESTAURANT_OWNER') || roles.includes('RESTAURANT_STAFF')) {
      this.router.navigate(['/owner/dashboard']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
