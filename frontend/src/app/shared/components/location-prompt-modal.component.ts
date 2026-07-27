import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-location-prompt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
      <div class="w-full max-w-md rounded-[28px] p-6 sm:p-8 border border-[#D4AF37]/35 shadow-2xl bg-gradient-to-br from-[#2D0B5A] via-[#1E053D] to-[#0E011E] text-white space-y-5">

        <div class="text-center space-y-2">
          <h2 class="text-2xl sm:text-3xl font-black text-[#D4AF37]">📍 Delivery Location</h2>
          <p class="text-xs sm:text-sm text-neutral-300">Set your delivery address to compare local prices</p>
        </div>

        <!-- GPS Locate Button (Clean Glassmorphism design) -->
        <button
          (click)="locateWithGPS()"
          [disabled]="locating()"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-300 shadow-md">
          <span>🎯</span> {{ locating() ? 'Locating with GPS...' : 'Use Current Location (GPS)' }}
        </button>

        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-white/10"></div>
          <span class="text-[10px] uppercase font-bold text-neutral-400">or enter address</span>
          <div class="flex-1 h-px bg-white/10"></div>
        </div>

        <div class="space-y-3">
          <!-- Street Address -->
          <div class="relative">
            <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Street Address</label>
            <input
              type="text"
              [(ngModel)]="street"
              placeholder="e.g. 123 Main St"
              class="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- City Input -->
            <div class="relative">
              <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">City</label>
              <input
                type="text"
                [(ngModel)]="city"
                placeholder="e.g. Detroit"
                class="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
            </div>

            <!-- State -->
            <div class="relative">
              <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">State</label>
              <input
                type="text"
                [(ngModel)]="state"
                placeholder="e.g. MI"
                class="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
            </div>
          </div>

          <!-- Zip Code -->
          <div class="relative">
            <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Zip Code</label>
            <input
              type="text"
              [(ngModel)]="zip"
              placeholder="e.g. 48201"
              class="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
          </div>
        </div>

        <p *ngIf="gpsError()" class="text-xs text-red-400 text-center">{{ gpsError() }}</p>

        <!-- Action Buttons -->
        <div class="pt-2">
          <button
            (click)="submit()"
            [disabled]="!city().trim() || !street().trim()"
            class="w-full py-3.5 rounded-xl font-black text-sm bg-[#D4AF37] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-lg">
            Save &amp; Continue
          </button>
        </div>
      </div>
    </div>
  `
})
export class LocationPromptModalComponent {
  @Input() isOpen = true;
  @Output() locationSelected = new EventEmitter<{ street: string; city: string; state?: string; zip?: string }>();
  @Output() skipped = new EventEmitter<void>();

  street = signal('');
  city = signal('');
  state = signal('');
  zip = signal('');

  locating = signal(false);
  gpsError = signal('');

  locateWithGPS() {
    if (!navigator.geolocation) {
      this.gpsError.set('Geolocation is not supported by your browser.');
      return;
    }
    this.locating.set(true);
    this.gpsError.set('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        // Mock a Detroit address for GPS coordinate resolution
        this.street.set('Woodward Avenue');
        this.city.set('Detroit');
        this.state.set('MI');
        this.zip.set('48201');
        this.locating.set(false);
      },
      err => {
        console.error(err);
        this.gpsError.set('Unable to retrieve GPS coordinates.');
        this.locating.set(false);
      },
      { timeout: 8000 }
    );
  }

  submit() {
    const cityValue = this.city();
    const streetValue = this.street();
    if (cityValue && cityValue.trim() && streetValue && streetValue.trim()) {
      this.locationSelected.emit({
        street: streetValue.trim(),
        city: cityValue.trim(),
        state: this.state().trim() || undefined,
        zip: this.zip().trim() || undefined
      });
    }
  }

  skip() {
    this.skipped.emit();
  }
}
