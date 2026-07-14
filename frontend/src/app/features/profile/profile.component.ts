import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../shared/models';

type Section = 'home' | 'personal' | 'security' | 'privacy';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto py-6 px-4 space-y-6">

      <!-- MAIN HEADER CONSOLE -->
      <div class="clay rounded-[2rem] p-6 border border-brand-black flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl bg-brand-white">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="text-3xl">👤</span>
            <div>
              <h2 class="text-2xl font-black text-brand-black tracking-tight">Profile Settings</h2>
              <p class="text-xs text-brand-black font-medium">Manage your personal information, security preferences, and food choices.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT CONSOLE -->
      <div class="clay rounded-[2rem] border border-brand-black bg-brand-white shadow-2xl overflow-hidden">
        <div class="grid md:grid-cols-[240px_1fr]">

          <!-- Left Sub Navigation with Dashboard Pill Styling -->
          <nav class="md:border-r border-brand-black p-4 space-y-2 bg-neutral-900/5">
            <div class="text-[10px] font-black text-brand-black uppercase tracking-widest px-3 mb-3">Settings Console</div>
            @for (s of sections; track s.id) {
              <button (click)="section.set(s.id)"
                [class]="'w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ' +
                  (section() === s.id 
                    ? 'border border-brand-black bg-brand-red text-white font-black shadow-md shadow-red-600/20' 
                    : 'text-brand-black hover:bg-neutral-800/10')">
                <span>
                  @if (s.id === 'home') { 🏠 }
                  @else if (s.id === 'personal') { 📝 }
                  @else if (s.id === 'security') { 🔒 }
                  @else if (s.id === 'privacy') { 🛡️ }
                </span>
                {{ s.label }}
              </button>
            }
          </nav>

          <!-- Content Panel -->
          <div class="p-6 sm:p-10 min-h-[520px] bg-brand-white">

            <!-- ============ HOME ============ -->
            @if (section() === 'home') {
              <div class="max-w-md mx-auto text-center space-y-6">
                <div class="w-24 h-24 mx-auto rounded-full bg-brand-white border border-brand-black flex items-center justify-center overflow-hidden shadow-inner">
                  <svg viewBox="0 0 24 24" class="w-14 h-14 text-brand-black" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/></svg>
                </div>
                <div>
                  <h2 class="text-2xl font-black text-brand-black tracking-tight">{{ fullName || 'Customer' }}</h2>
                  <p class="text-xs text-brand-black font-semibold mt-0.5 opacity-80">{{ user()?.email }}</p>
                </div>

                <!-- Quick cards -->
                <div class="grid grid-cols-3 gap-3">
                  <button (click)="section.set('personal')" class="clay hover:border-brand-red bg-brand-white p-5 rounded-2xl flex flex-col items-center gap-2 transition hover:-translate-y-0.5 shadow-sm">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" class="text-brand-black"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    <span class="text-[11px] font-black text-brand-black leading-tight">Personal Info</span>
                  </button>
                  <button (click)="section.set('security')" class="clay hover:border-brand-red bg-brand-white p-5 rounded-2xl flex flex-col items-center gap-2 transition hover:-translate-y-0.5 shadow-sm">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" class="text-brand-black"><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z"/></svg>
                    <span class="text-[11px] font-black text-brand-black leading-tight">Security</span>
                  </button>
                  <button (click)="section.set('privacy')" class="clay hover:border-brand-red bg-brand-white p-5 rounded-2xl flex flex-col items-center gap-2 transition hover:-translate-y-0.5 shadow-sm">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" class="text-brand-black"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 0 1 6 0v3H9Z"/></svg>
                    <span class="text-[11px] font-black text-brand-black leading-tight">Privacy</span>
                  </button>
                </div>

                <!-- Suggestions -->
                <div class="clay rounded-3xl p-6 border border-brand-black bg-brand-white shadow-md text-left space-y-3">
                  <div class="flex items-start justify-between gap-4">
                    <h4 class="text-base font-black text-brand-black leading-snug">Complete your account checkup</h4>
                    <svg viewBox="0 0 48 40" class="w-10 h-8 shrink-0"><rect x="10" y="6" width="34" height="24" rx="3" fill="#111"/><rect x="4" y="12" width="34" height="24" rx="3" fill="#3b82f6"/><circle cx="13" cy="21" r="4" fill="#fff"/><rect x="20" y="18" width="14" height="2.5" rx="1.25" fill="#fff"/><rect x="20" y="24" width="10" height="2.5" rx="1.25" fill="#fff"/></svg>
                  </div>
                  <p class="text-[11px] text-brand-black font-semibold opacity-75">Complete your account checkup to make MiSlice work better for you and keep you secure.</p>
                  <button (click)="section.set('personal')" class="clay-btn font-extrabold px-5 py-2.5 rounded-xl transition shadow-sm hover:bg-brand-black hover:text-brand-white text-xs">Begin checkup</button>
                </div>
              </div>
            }

            <!-- ============ PERSONAL INFO ============ -->
            @if (section() === 'personal') {
              <div class="max-w-lg space-y-6">
                <div>
                  <h2 class="text-2xl font-black text-brand-black tracking-tight">Personal info</h2>
                  <p class="text-xs text-brand-black font-semibold opacity-75 mt-0.5">Manage your details and food preferences.</p>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-[10px] font-black text-brand-black uppercase tracking-wider mb-1.5">Full name</label>
                    <input [(ngModel)]="fullName" (ngModelChange)="saved.set(false)"
                      class="w-full clay rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-red bg-brand-white font-medium text-brand-black transition" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-brand-black uppercase tracking-wider mb-1.5">Email</label>
                    <input [value]="user()?.email" disabled
                      class="w-full clay rounded-xl px-4 py-3 text-sm bg-neutral-100 border-neutral-300 text-neutral-400 font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-brand-black uppercase tracking-wider mb-1.5">Phone</label>
                    <input [(ngModel)]="phone" (ngModelChange)="saved.set(false)" placeholder="e.g. 313-555-0199"
                      class="w-full clay rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-red bg-brand-white font-medium text-brand-black transition" />
                  </div>
                </div>

                <!-- Food preferences -->
                <div>
                  <h3 class="text-xs font-black uppercase tracking-wider text-brand-black mb-3">Dietary preferences</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (d of diets; track d.key) {
                      <button (click)="toggleDiet(d.key)"
                        [class]="'clay px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ' + 
                          (getDietState(d.key) 
                            ? 'bg-brand-red text-brand-white border-brand-red shadow-md shadow-red-600/10' 
                            : 'bg-brand-white text-brand-black border-brand-black hover:border-brand-black')">
                        {{ d.emoji }} {{ d.label }}
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <h3 class="text-xs font-black uppercase tracking-wider text-brand-black mb-3">Avoid allergens</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (a of allergenOptions; track a) {
                      <button (click)="toggleAllergen(a)"
                        [class]="'clay px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ' + 
                          (avoidedAllergens.includes(a) 
                            ? 'bg-brand-red text-brand-white border-brand-red shadow-md shadow-red-600/10' 
                            : 'bg-brand-white text-brand-black border-brand-black hover:border-brand-black')">
                        {{ a }}
                      </button>
                    }
                  </div>
                </div>

                <button (click)="save()" [disabled]="loading()"
                  class="clay-accent font-black px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition select-none flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 text-xs">
                  {{ loading() ? 'Saving…' : (saved() ? '✓ Saved' : 'Save changes') }}
                </button>
              </div>
            }

            <!-- ============ SECURITY ============ -->
            @if (section() === 'security') {
              <div class="max-w-lg space-y-6">
                <div>
                  <h2 class="text-2xl font-black text-brand-black tracking-tight">Security</h2>
                  <p class="text-xs text-brand-black font-semibold opacity-75 mt-0.5">Manage how you sign in to MiSlice.</p>
                </div>

                <div class="clay rounded-2xl border border-brand-black bg-brand-white shadow-sm overflow-hidden divide-y divide-neutral-200">
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-black text-sm">Email</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">{{ user()?.email }}</p>
                    </div>
                    <span class="text-xs font-bold text-brand-green bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">Verified</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-black text-sm">Password</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">Change your account password</p>
                    </div>
                    <button (click)="resetPassword()" [disabled]="resetSent()" class="clay-btn text-xs font-black px-4 py-2 hover:bg-brand-black hover:text-brand-white transition">
                      {{ resetSent() ? 'Reset link sent ✓' : 'Change password' }}
                    </button>
                  </div>
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-black text-sm">Sign out</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">Sign out of this device</p>
                    </div>
                    <button (click)="signOut()" class="clay border border-brand-red bg-brand-white hover:bg-brand-red text-brand-red hover:text-brand-white text-xs font-black px-4 py-2 transition-all rounded-xl">
                      Sign out
                    </button>
                  </div>
                </div>
                @if (resetSent()) { <p class="text-xs font-semibold text-brand-green">We've sent a password reset link to {{ user()?.email }}.</p> }
              </div>
            }

            <!-- ============ PRIVACY & DATA ============ -->
            @if (section() === 'privacy') {
              <div class="max-w-lg space-y-6">
                <div>
                  <h2 class="text-2xl font-black text-brand-black tracking-tight">Privacy &amp; Data</h2>
                  <p class="text-xs text-brand-black font-semibold opacity-75 mt-0.5">Control your data and privacy on MiSlice.</p>
                </div>

                <div class="clay rounded-2xl border border-brand-black bg-brand-white shadow-sm overflow-hidden divide-y divide-neutral-200">
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-black text-sm">Download your data</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">Get a copy of your MiSlice data</p>
                    </div>
                    <button (click)="downloadData()" class="clay-btn text-xs font-black px-4 py-2 hover:bg-brand-black hover:text-brand-white transition">
                      Download
                    </button>
                  </div>
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-black text-sm">Marketing notifications</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">Deals and updates by email</p>
                    </div>
                    <button (click)="notif = !notif" [class]="'w-11 h-6 rounded-full relative transition border border-brand-black ' + (notif ? 'bg-brand-red' : 'bg-neutral-200')">
                      <span class="absolute top-0.5 w-4 h-4 rounded-full bg-brand-white transition-all shadow-md" [style.left]="notif ? '22px' : '2px'"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between px-5 py-4">
                    <div>
                      <p class="font-bold text-brand-red text-sm">Delete account</p>
                      <p class="text-xs text-brand-black opacity-75 mt-0.5">Permanently delete your account</p>
                    </div>
                    <button (click)="deleteAccount()" class="clay border border-brand-red bg-brand-white hover:bg-brand-red text-brand-red hover:text-brand-white text-xs font-black px-4 py-2 transition-all rounded-xl">
                      Delete
                    </button>
                  </div>
                </div>
                @if (privacyMsg()) { <p class="text-xs text-brand-black">{{ privacyMsg() }}</p> }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  user = this.auth.currentUser;

  section = signal<Section>('home');
  sections: { id: Section; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'personal', label: 'Personal info' },
    { id: 'security', label: 'Security' },
    { id: 'privacy', label: 'Privacy & Data' },
  ];

  fullName = '';
  phone = '';
  vegetarian = false;
  vegan = false; halal = false; glutenFree = false;
  diets = [
    { key: 'vegan', label: 'Vegan', emoji: '🌱', desc: 'No animal products' },
    { key: 'halal', label: 'Halal', emoji: '🕌', desc: 'Halal-certified' },
    { key: 'glutenFree', label: 'Gluten Free', emoji: '🌾', desc: 'Gluten-free' },
  ];
  allergenOptions = ['Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Wheat', 'Gluten'];
  avoidedAllergens: string[] = [];
  meatPrefs: string[] = [];
  notif = true;

  saved = signal(false);
  loading = signal(false);
  resetSent = signal(false);
  privacyMsg = signal('');

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (p) => this.initializeProfile(p),
      error: () => { const u = this.user(); if (u) this.initializeProfile(u); },
    });
  }

  private initializeProfile(profile: UserProfile) {
    this.fullName = profile.fullName || '';
    this.phone = profile.phone || '';
    this.vegetarian = profile.vegetarian || false;
    this.notif = profile.notificationsEnabled ?? true;
    const prefs = profile.dietaryPrefs ?? [];
    this.vegan = prefs.includes('VEGAN');
    this.halal = prefs.includes('HALAL');
    this.glutenFree = prefs.includes('GLUTEN_FREE');
    this.avoidedAllergens = prefs.filter(p => p.startsWith('ALLERGY_')).map(p => p.substring(8));
    this.meatPrefs = profile.meatPrefs ?? [];
    this.saved.set(false);
  }

  getDietState(key: string): boolean {
    return key === 'vegan' ? this.vegan : key === 'halal' ? this.halal : key === 'glutenFree' ? this.glutenFree : false;
  }
  toggleDiet(key: string): void {
    if (key === 'vegan') { this.vegan = !this.vegan; if (this.vegan) this.vegetarian = true; }
    if (key === 'halal') this.halal = !this.halal;
    if (key === 'glutenFree') this.glutenFree = !this.glutenFree;
    this.saved.set(false);
  }
  toggleAllergen(a: string): void {
    this.avoidedAllergens = this.avoidedAllergens.includes(a) ? this.avoidedAllergens.filter(x => x !== a) : [...this.avoidedAllergens, a];
    this.saved.set(false);
  }

  save(): void {
    this.loading.set(true); this.saved.set(false);
    const prefs: string[] = [];
    if (this.vegan) prefs.push('VEGAN');
    if (this.halal) prefs.push('HALAL');
    if (this.glutenFree) prefs.push('GLUTEN_FREE');
    this.avoidedAllergens.forEach(a => prefs.push(`ALLERGY_${a.toUpperCase()}`));
    this.auth.updateProfile({
      fullName: this.fullName.trim(), phone: this.phone.trim(),
      vegetarian: this.vegetarian, dietaryPrefs: prefs, meatPrefs: this.meatPrefs,
      notificationsEnabled: this.notif,
    }).subscribe({
      next: (p) => { this.initializeProfile(p); this.loading.set(false); this.saved.set(true); },
      error: () => this.loading.set(false),
    });
  }

  resetPassword(): void {
    const email = this.user()?.email;
    if (!email) return;
    this.auth.sendPasswordReset(email).subscribe({
      next: () => this.resetSent.set(true),
      error: () => this.resetSent.set(true), // avoid leaking whether an email exists
    });
  }

  signOut(): void {
    this.auth.logout().subscribe({ next: () => this.router.navigate(['/welcome']) });
  }

  downloadData(): void {
    const data = JSON.stringify(this.user() ?? {}, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mislice-account-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.auth.deleteAccount().subscribe({
        next: () => {
          this.auth.logout().subscribe(() => {
            this.router.navigate(['/']);
          });
        },
        error: (err: any) => {
          console.error('Failed to delete account', err);
          this.privacyMsg.set('Failed to delete account. Please try again.');
        }
      });
    }
  }
}
