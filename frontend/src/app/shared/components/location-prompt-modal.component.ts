import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-location-prompt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-[28px] p-8 border border-[#D4AF37] shadow-2xl bg-gradient-to-br from-[#2D0B5A] via-[#1E053D] to-[#0E011E] text-white space-y-6">

        <div class="text-center space-y-3">
          <h2 class="text-3xl font-black text-[#D4AF37]">📍 Where's Your Pizza?</h2>
          <p class="text-sm text-neutral-300">Tell us your location to see the best deals nearby</p>
        </div>

        <div class="space-y-4">
          <!-- City Input -->
          <div class="relative">
            <label class="block text-xs font-bold text-neutral-400 uppercase mb-2">City Name</label>
            <input
              type="text"
              [(ngModel)]="city"
              placeholder="e.g. Detroit, Ann Arbor"
              (keyup.enter)="submit()"
              class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
          </div>

          <!-- State/Zip (Optional) -->
          <div class="relative">
            <label class="block text-xs font-bold text-neutral-400 uppercase mb-2">State (Optional)</label>
            <input
              type="text"
              [(ngModel)]="state"
              placeholder="e.g. MI"
              (keyup.enter)="submit()"
              class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
          </div>

          <!-- Phone (Optional but encouraged) -->
          <div class="relative">
            <label class="block text-xs font-bold text-neutral-400 uppercase mb-2">Phone (Optional)</label>
            <input
              type="tel"
              [(ngModel)]="phone"
              placeholder="e.g. 313-555-0123"
              (keyup.enter)="submit()"
              class="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37] transition" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            (click)="skip()"
            class="flex-1 py-3 rounded-xl font-bold text-sm bg-transparent border border-[#D4AF37]/20 text-neutral-300 hover:bg-[#D4AF37]/10 transition">
            Skip
          </button>
          <button
            (click)="submit()"
            [disabled]="!city()"
            class="flex-1 py-3 rounded-xl font-black text-sm bg-[#D4AF37] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition">
            Find Pizza
          </button>
        </div>

        <p class="text-[10px] text-neutral-500 text-center">
          We use your location only to show nearby pizza deals.
        </p>
      </div>
    </div>
  `
})
export class LocationPromptModalComponent {
  @Input() isOpen = true;
  @Output() locationSelected = new EventEmitter<{ city: string; state?: string; phone?: string }>();
  @Output() skipped = new EventEmitter<void>();

  city = signal('');
  state = signal('');
  phone = signal('');

  submit() {
    const cityValue = this.city().trim();
    if (cityValue) {
      this.locationSelected.emit({
        city: cityValue,
        state: this.state().trim() || undefined,
        phone: this.phone().trim() || undefined
      });
    }
  }

  skip() {
    this.skipped.emit();
  }
}
