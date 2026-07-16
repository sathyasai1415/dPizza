import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-poster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl bg-black border border-[#D4AF37]/30">

        <!-- Close Button -->
        <button (click)="close()" class="absolute top-6 right-6 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white font-bold">✕</button>

        <!-- Poster Content -->
        <div class="relative bg-gradient-to-br from-[#1a1a1a] to-black text-white p-8 md:p-12 space-y-8">

          <!-- Header -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <span class="text-4xl">🍕</span>
              <h1 class="text-4xl md:text-5xl font-black tracking-tight">
                MiSlice<br />
                <span class="text-[#D4AF37]">Revolutionized</span>
              </h1>
            </div>
            <p class="text-lg text-neutral-300 max-w-lg">
              AI helps you find the best pizza, compare real-time prices, and order from the best local spots — in seconds.
            </p>
          </div>

          <!-- Features Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition">
              <span class="text-3xl">⚡</span>
              <span class="text-xs font-bold uppercase tracking-wider">Save Time</span>
              <span class="text-[10px] text-neutral-400">Find best options instantly</span>
            </div>

            <div class="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition">
              <span class="text-3xl">💰</span>
              <span class="text-xs font-bold uppercase tracking-wider">Save Money</span>
              <span class="text-[10px] text-neutral-400">Compare live prices & deals</span>
            </div>

            <div class="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition">
              <span class="text-3xl">✅</span>
              <span class="text-xs font-bold uppercase tracking-wider">Reliable</span>
              <span class="text-[10px] text-neutral-400">Accurate real-time data</span>
            </div>

            <div class="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition">
              <span class="text-3xl">📍</span>
              <span class="text-xs font-bold uppercase tracking-wider">Local</span>
              <span class="text-[10px] text-neutral-400">Real pizzerias near you</span>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="flex gap-3 pt-4">
            <button
              (click)="close()"
              class="flex-1 py-4 rounded-xl font-black text-white text-lg bg-[#D4AF37] text-black hover:brightness-110 transition shadow-lg">
              Let's Find Your Perfect Slice ✨
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div class="text-center">
              <p class="text-2xl font-black text-[#D4AF37]">12,000+</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-widest">Pizzas</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-black text-[#D4AF37]">400+</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-widest">Local Shops</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-black text-[#D4AF37]">Live</p>
              <p class="text-[10px] text-neutral-400 uppercase tracking-widest">Prices Updated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomePosterComponent {
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
