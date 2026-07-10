import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../shared/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-3xl mx-auto py-6 space-y-7 px-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">My Profile & Preferences</h1>
        <p class="text-white/50 text-sm mt-1">Manage your personal details, dietary profile, and allergen warnings.</p>
      </div>

      <!-- Account Card -->
      <section class="glass rounded-3xl p-6 flex items-center gap-4 bg-black/40 border border-white/5 shadow-xl">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-md shadow-red-500/20">
          {{ (fullName || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-lg font-black text-white truncate">{{ fullName || 'Customer' }}</p>
          <p class="text-sm text-white/50 truncate">{{ user()?.email }}</p>
        </div>
        <span class="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-full">
          {{ user()?.roles?.[0] || 'Customer' }}
        </span>
      </section>

      <!-- Personal Info -->
      <section class="glass rounded-3xl p-6 space-y-4 bg-black/40 border border-white/5">
        <p class="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Personal Details</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-1.5">Full Name</label>
            <input type="text" [(ngModel)]="fullName" (ngModelChange)="saved.set(false)"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 focus:bg-white/10 transition" />
          </div>
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-1.5">Phone Number</label>
            <input type="text" [(ngModel)]="phone" (ngModelChange)="saved.set(false)" placeholder="e.g. 313-555-0199"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 focus:bg-white/10 transition" />
          </div>
        </div>
      </section>

      <!-- Dietary Profile Toggles -->
      <section class="glass rounded-3xl p-6 space-y-4 bg-black/40 border border-white/5">
        <p class="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Dietary Profile</p>
        <div class="grid sm:grid-cols-2 gap-3">
          @for (d of diets; track d.key) {
            <button (click)="toggleDiet(d.key)"
              [class]="'flex items-center gap-3 p-4 rounded-2xl border text-left transition ' +
                (getDietState(d.key) ? 'bg-red-600/10 border-red-500/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10')">
              <span class="text-xl">{{ d.emoji }}</span>
              <div class="flex-1">
                <p class="text-sm font-bold text-white">{{ d.label }}</p>
                <p class="text-[11px] text-white/40">{{ d.desc }}</p>
              </div>
              <span [class]="'w-9 h-5 rounded-full relative transition ' + (getDietState(d.key) ? 'bg-red-500' : 'bg-white/15')">
                <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  [style.left]="getDietState(d.key) ? '18px' : '2px'"></span>
              </span>
            </button>
          }
        </div>
      </section>

      <!-- Meat Preferences -->
      <section class="glass rounded-3xl p-6 space-y-4 bg-black/40 border border-white/5">
        <p class="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Meat Selections</p>
        <div class="flex flex-wrap gap-2.5">
          @for (meat of meatOptions; track meat.name) {
            <button (click)="toggleMeat(meat.name)"
              [class]="'px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition ' +
                (meatPrefs.includes(meat.name) 
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md' 
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10')">
              <span>{{ meat.emoji }}</span>
              <span>{{ meat.name }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Allergens / Allergic Preferences -->
      <section class="glass rounded-3xl p-6 space-y-4 bg-black/40 border border-white/5">
        <p class="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Avoid Allergens</p>
        <p class="text-xs text-white/45">Select any ingredients you are allergic to. We will highlight warnings on pizzas containing them.</p>
        <div class="flex flex-wrap gap-2">
          @for (a of allergenOptions; track a) {
            <button (click)="toggleAllergen(a)"
              [class]="'px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ' +
                (avoidedAllergens.includes(a) ? 'bg-red-600/35 border border-red-500 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10')">
              🚫 {{ a }}
            </button>
          }
        </div>
      </section>

      <!-- Save Button -->
      <button (click)="save()" [disabled]="loading()"
        class="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-orange-400 disabled:opacity-50 transition">
        {{ loading() ? 'Saving Profile...' : (saved() ? '✓ Saved Successfully!' : 'Save Profile & Preferences') }}
      </button>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  user = this.auth.currentUser;

  fullName = '';
  phone = '';
  vegetarian = false;

  // Diet toggles
  diets = [
    { key: 'vegan', label: 'Vegan', emoji: '🌱', desc: 'No animal products' },
    { key: 'halal', label: 'Halal', emoji: '🕌', desc: 'Halal-certified ingredients' },
    { key: 'glutenFree', label: 'Gluten Free', emoji: '🌾', desc: 'Gluten-free crust and toppings' },
  ];
  vegan = false;
  halal = false;
  glutenFree = false;

  // Meat selection options
  meatOptions = [
    { name: 'Pepperoni', emoji: '🍕' },
    { name: 'Italian Sausage', emoji: '🍖' },
    { name: 'Bacon', emoji: '🥓' },
    { name: 'Chicken', emoji: '🍗' },
    { name: 'Ham', emoji: '🍖' },
    { name: 'Beef', emoji: '🥩' },
    { name: 'Lamb', emoji: '🐑' },
  ];
  meatPrefs: string[] = [];

  // Allergen options
  allergenOptions = ['Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Wheat', 'Gluten'];
  avoidedAllergens: string[] = [];

  saved = signal(false);
  loading = signal(false);

  ngOnInit(): void {
    // Load fresh details from backend
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.initializeProfile(profile);
      },
      error: () => {
        // Fallback to local session details if offline
        const localUser = this.user();
        if (localUser) {
          this.initializeProfile(localUser);
        }
      }
    });
  }

  private initializeProfile(profile: UserProfile) {
    this.fullName = profile.fullName || '';
    this.phone = profile.phone || '';
    this.vegetarian = profile.vegetarian || false;

    // Parse dietary prefs
    const prefs = profile.dietaryPrefs ?? [];
    this.vegan = prefs.includes('VEGAN');
    this.halal = prefs.includes('HALAL');
    this.glutenFree = prefs.includes('GLUTEN_FREE');

    // Filter out allergy tags
    this.avoidedAllergens = prefs
      .filter(p => p.startsWith('ALLERGY_'))
      .map(p => p.substring(8)); // remove 'ALLERGY_' prefix

    // Parse meat prefs
    this.meatPrefs = profile.meatPrefs ?? [];
    this.saved.set(false);
  }

  getDietState(key: string): boolean {
    if (key === 'vegan') return this.vegan;
    if (key === 'halal') return this.halal;
    if (key === 'glutenFree') return this.glutenFree;
    return false;
  }

  toggleDiet(key: string): void {
    if (key === 'vegan') this.vegan = !this.vegan;
    if (key === 'halal') this.halal = !this.halal;
    if (key === 'glutenFree') this.glutenFree = !this.glutenFree;
    
    // Auto-align vegetarian: if vegan is chosen, vegetarian is implicitly true!
    if (key === 'vegan' && this.vegan) {
      this.vegetarian = true;
    }
    
    this.saved.set(false);
  }

  toggleMeat(meat: string): void {
    if (this.meatPrefs.includes(meat)) {
      this.meatPrefs = this.meatPrefs.filter(m => m !== meat);
    } else {
      this.meatPrefs = [...this.meatPrefs, meat];
      // If adding meat, they can't be strictly vegetarian/vegan
      if (this.vegetarian || this.vegan) {
        this.vegetarian = false;
        this.vegan = false;
      }
    }
    this.saved.set(false);
  }

  toggleAllergen(allergen: string): void {
    if (this.avoidedAllergens.includes(allergen)) {
      this.avoidedAllergens = this.avoidedAllergens.filter(a => a !== allergen);
    } else {
      this.avoidedAllergens = [...this.avoidedAllergens, allergen];
    }
    this.saved.set(false);
  }

  save(): void {
    this.loading.set(true);
    this.saved.set(false);

    // Build the list of dietary prefs
    const updatedPrefs: string[] = [];
    if (this.vegan) updatedPrefs.push('VEGAN');
    if (this.halal) updatedPrefs.push('HALAL');
    if (this.glutenFree) updatedPrefs.push('GLUTEN_FREE');
    
    // Map allergens to 'ALLERGY_<ALLERGEN>' tags
    this.avoidedAllergens.forEach(a => {
      updatedPrefs.push(`ALLERGY_${a.toUpperCase()}`);
    });

    const updateRequest: Partial<UserProfile> = {
      fullName: this.fullName.trim(),
      phone: this.phone.trim(),
      vegetarian: this.vegetarian,
      dietaryPrefs: updatedPrefs,
      meatPrefs: this.meatPrefs
    };

    // Save preferences to local storage legacy key for backward compatibility
    localStorage.setItem('mislice_diet', JSON.stringify({
      state: { vegetarian: this.vegetarian, vegan: this.vegan, halal: this.halal, glutenFree: this.glutenFree },
      avoided: this.avoidedAllergens
    }));

    // Update profile on backend database
    this.auth.updateProfile(updateRequest).subscribe({
      next: (updatedProfile) => {
        this.initializeProfile(updatedProfile);
        this.loading.set(false);
        this.saved.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to update user profile preferences:', err);
      }
    });
  }
}
