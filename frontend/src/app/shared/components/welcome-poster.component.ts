import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-poster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn overflow-y-auto" style="background: linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.95) 50%, rgba(26,26,26,0.95) 100%);">
      <div class="relative w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl bg-gradient-to-br from-black via-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37]/40 my-8 backdrop-blur-xl">
        
        <!-- Close Button -->
        <button (click)="close()" class="absolute top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white font-bold">✕</button>

        <!-- Poster Content -->
        <div class="bg-gradient-to-br from-[#0f0f0f] via-black to-[#1a1a1a] text-white p-6 sm:p-10 space-y-6 relative overflow-hidden">
          <!-- Decorative background elements -->
          <div class="absolute inset-0 opacity-10 pointer-events-none">
            <div class="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 right-0 w-80 h-80 bg-[#E53935] rounded-full blur-3xl"></div>
          </div>
          <div class="relative z-10">
          
          <!-- HERO TOP ROW: Text + Pizza/Phone Visuals -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center border-b border-white/10 pb-8">
            <div class="space-y-6">
              <div class="flex items-center gap-2">
                <span class="text-3xl">🍕</span>
                <span class="text-2xl font-black tracking-tight text-white">MiSlice</span>
              </div>
              <h1 class="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] text-white">
                The Smarter Way<br />
                to Pizza. <span class="text-[#D4AF37]">Revolutionized.</span>
              </h1>
              <p class="text-sm sm:text-base text-neutral-300 font-semibold leading-relaxed">
                AI helps you find the best pizza, compare real-time prices, and order from the best local spots — <span class="text-[#D4AF37]">in seconds.</span>
              </p>
              
              <!-- 4 Features grid -->
              <div class="grid grid-cols-2 gap-4 pt-2">
                <div class="flex items-start gap-2.5">
                  <span class="text-xl mt-0.5">⏱️</span>
                  <div>
                    <h4 class="text-xs font-black text-white uppercase tracking-wider">Save Time</h4>
                    <p class="text-[10px] text-neutral-400 font-medium">AI finds the best options instantly.</p>
                  </div>
                </div>
                <div class="flex items-start gap-2.5">
                  <span class="text-xl mt-0.5">💰</span>
                  <div>
                    <h4 class="text-xs font-black text-white uppercase tracking-wider">Save Money</h4>
                    <p class="text-[10px] text-neutral-400 font-medium">Compare prices live & get deals.</p>
                  </div>
                </div>
                <div class="flex items-start gap-2.5">
                  <span class="text-xl mt-0.5">🛡️</span>
                  <div>
                    <h4 class="text-xs font-black text-white uppercase tracking-wider">Reliable Choices</h4>
                    <p class="text-[10px] text-neutral-400 font-medium">Accurate info, real reviews.</p>
                  </div>
                </div>
                <div class="flex items-start gap-2.5">
                  <span class="text-xl mt-0.5">📍</span>
                  <div>
                    <h4 class="text-xs font-black text-white uppercase tracking-wider">Authentic Taste</h4>
                    <p class="text-[10px] text-neutral-400 font-medium">Find real local pizzerias.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side Visuals (Detroit Pizza + AI Search phone mock) -->
            <div class="relative flex items-center justify-center h-64 sm:h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E22] to-black border border-white/5">
              <!-- Pizza -->
              <img src="/pizza_hero_bg.png" class="absolute w-4/5 h-4/5 object-contain -left-10 -bottom-10 rotate-12 scale-110 opacity-80" alt="" />
              <!-- Phone Mock -->
              <div class="absolute right-6 w-48 bg-[#0A0A0A] rounded-[24px] border-4 border-[#2B2B31] shadow-2xl p-3 space-y-2 text-[9px] scale-95 sm:scale-100">
                <div class="flex justify-between items-center text-[7px] text-neutral-500 font-bold border-b border-white/5 pb-1">
                  <span>9:41</span>
                  <span>📶 🔋</span>
                </div>
                <div class="bg-[#111] p-1.5 rounded-lg border border-white/5">
                  <span class="text-[#D4AF37]">✦ AI Search</span>
                  <p class="text-[7px] text-neutral-400 mt-0.5 truncate">"Cheapest large pepperoni near me"</p>
                </div>
                <div class="space-y-1">
                  <span class="text-[7px] font-bold text-neutral-400">Best Match Found ✦</span>
                  <!-- Phone Pizzerias list -->
                  <div class="flex items-center justify-between p-1 bg-white/5 rounded border border-white/5">
                    <span class="font-bold text-white truncate">🟢 YAYA'S PIZZA</span>
                    <span class="font-black text-[#22C55E]">$16.49</span>
                  </div>
                  <div class="flex items-center justify-between p-1 bg-white/10 rounded border border-[#D4AF37]/30">
                    <span class="font-bold text-[#D4AF37] truncate">🔴 SAL'S PIZZA</span>
                    <span class="font-black text-[#22C55E] font-black">$15.25</span>
                  </div>
                  <div class="flex items-center justify-between p-1 bg-white/5 rounded border border-white/5">
                    <span class="font-bold text-white truncate">🔵 SHIELDS PIZZA</span>
                    <span class="font-black text-[#22C55E]">$17.99</span>
                  </div>
                </div>
                <div class="bg-[#22C55E]/10 border border-[#22C55E]/30 p-1 rounded text-center text-[#22C55E] font-black text-[7px] uppercase tracking-wider">
                  💵 You Save $3.50 by choosing Sal's Pizza
                </div>
              </div>
            </div>
          </div>

          <!-- MIDDLE ROW: Comparison infograph + AI list -->
          <div class="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
            
            <!-- Left: Pizzeria live comparison showcase -->
            <div class="rounded-3xl p-6 sm:p-8 bg-[#F9F6F0] text-[#1F1F1F] space-y-6">
              <div class="text-center space-y-1">
                <h3 class="text-xl sm:text-2xl font-black text-black">One Pizza. Four Local Places. <span class="text-[#E53935]">Live Prices.</span></h3>
                <p class="text-xs text-neutral-600 font-semibold">Instantly check the price of your build across different local pizzerias.</p>
              </div>
              
              <div class="flex flex-col md:flex-row items-center justify-center gap-6 relative py-4">
                
                <!-- Cards Left -->
                <div class="flex flex-col gap-4 w-full md:w-44 shrink-0">
                  <div class="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm relative group">
                    <p class="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Yaya's Pizza</p>
                    <p class="text-xl font-black text-[#1F1F1F] mt-0.5">$16.49</p>
                    <p class="text-[9px] text-neutral-500 font-semibold mt-1">20-30 min · 2.1 mi</p>
                    <span class="absolute -bottom-2.5 right-3 text-[8px] font-black bg-[#EBFDF2] text-[#15803d] border border-[#bbf7d0] px-2 py-0.5 rounded-full">★ Great Value</span>
                  </div>
                  <div class="bg-white p-3.5 rounded-2xl border-2 border-[#E53935] shadow-sm relative group">
                    <p class="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Sal's Pizza</p>
                    <p class="text-xl font-black text-[#E53935] mt-0.5">$15.25</p>
                    <p class="text-[9px] text-neutral-500 font-semibold mt-1">25-35 min · 1.8 mi</p>
                    <span class="absolute -bottom-2.5 right-3 text-[8px] font-black bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-full">🔥 Best Price</span>
                  </div>
                </div>

                <!-- Pizza Center -->
                <div class="relative w-40 h-40 shrink-0 flex items-center justify-center">
                  <div class="absolute inset-0 rounded-full bg-[#1F1F1F]/5 blur-lg"></div>
                  <img src="/pizza_hero_bg.png" class="w-full h-full object-contain drop-shadow-2xl rotate-6" alt="" />
                  <div class="absolute -bottom-4 bg-white border border-[#22C55E]/40 text-[#16a34a] px-3.5 py-1.5 rounded-full shadow-md text-[9px] font-black whitespace-nowrap">
                    💵 You Save $3.50
                  </div>
                </div>

                <!-- Cards Right -->
                <div class="flex flex-col gap-4 w-full md:w-44 shrink-0">
                  <div class="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm relative group">
                    <p class="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Shields Pizza</p>
                    <p class="text-xl font-black text-[#1F1F1F] mt-0.5">$17.99</p>
                    <p class="text-[9px] text-neutral-500 font-semibold mt-1">20-30 min · 2.6 mi</p>
                    <span class="absolute -bottom-2.5 right-3 text-[8px] font-black bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2 py-0.5 rounded-full">★ Popular Choice</span>
                  </div>
                  <div class="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm relative group">
                    <p class="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Bunchy's Pizza</p>
                    <p class="text-xl font-black text-[#1F1F1F] mt-0.5">$18.75</p>
                    <p class="text-[9px] text-neutral-500 font-semibold mt-1">30-40 min · 3.2 mi</p>
                    <span class="absolute -bottom-2.5 right-3 text-[8px] font-black bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF] px-2 py-0.5 rounded-full">★ Top Rated</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Right: AI list -->
            <div class="rounded-3xl p-6 bg-white text-[#1F1F1F] flex flex-col justify-between">
              <div>
                <h4 class="text-sm font-black text-black border-b border-neutral-100 pb-2 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                  ✨ AI That Works for You
                </h4>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">🔍</span>
                    <div>
                      <h5 class="text-xs font-black text-black">AI Smart Search</h5>
                      <p class="text-[10px] text-neutral-500 font-medium leading-relaxed mt-0.5">Search anything, our AI understands what you want.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">🍕</span>
                    <div>
                      <h5 class="text-xs font-black text-black">Build & Customize</h5>
                      <p class="text-[10px] text-neutral-500 font-medium leading-relaxed mt-0.5">Create your perfect pizza, your way.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">🏷️</span>
                    <div>
                      <h5 class="text-xs font-black text-black">Exclusive Deals</h5>
                      <p class="text-[10px] text-neutral-500 font-medium leading-relaxed mt-0.5">Get local offers, coupons & student discounts.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">🛵</span>
                    <div>
                      <h5 class="text-xs font-black text-black">Faster Delivery</h5>
                      <p class="text-[10px] text-neutral-500 font-medium leading-relaxed mt-0.5">See real-time delivery times, fees & options.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-7 h-7 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs shrink-0">⭐</span>
                    <div>
                      <h5 class="text-xs font-black text-black">Top Rated Picks</h5>
                      <p class="text-[10px] text-neutral-500 font-medium leading-relaxed mt-0.5">Real reviews from real pizza lovers like you.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- BOTTOM ROW: Stats + Why MiSlice -->
          <div class="grid grid-cols-1 md:grid-cols-[1.8fr_1.2fr] gap-6 border-t border-white/10 pt-6">
            
            <!-- Left: Why MiSlice features -->
            <div class="bg-neutral-900/50 rounded-2xl p-5 border border-white/5 space-y-3">
              <h4 class="text-xs font-black text-[#D4AF37] uppercase tracking-widest">Why MiSlice is the Best Place to Find Pizza</h4>
              <div class="flex flex-wrap gap-4 text-[10px] font-semibold text-neutral-400">
                <span>🔮 AI-Powered</span>
                <span>📊 Live Price Comparison</span>
                <span>❤️ Local First</span>
                <span>⚡ All in One</span>
                <span>🔒 Secure & Easy</span>
              </div>
            </div>

            <!-- Right: Stats & Loved by -->
            <div class="flex items-center justify-between gap-4 bg-neutral-900/50 rounded-2xl p-5 border border-white/5">
              <div class="flex flex-col gap-1">
                <!-- Avatar stack -->
                <div class="flex -space-x-2 overflow-hidden">
                  <span class="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-neutral-800 text-[10px] flex items-center justify-center font-bold">👩</span>
                  <span class="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-neutral-800 text-[10px] flex items-center justify-center font-bold">👨</span>
                  <span class="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-neutral-800 text-[10px] flex items-center justify-center font-bold">🧑</span>
                </div>
                <p class="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Loved by 10,000+ pizza lovers</p>
              </div>
              <!-- Stats row -->
              <div class="flex items-center gap-4 text-right">
                <div>
                  <p class="text-sm font-black text-[#D4AF37]">12,000+</p>
                  <p class="text-[8px] text-neutral-500 uppercase tracking-widest font-black">Pizzas</p>
                </div>
                <div>
                  <p class="text-sm font-black text-[#D4AF37]">400+</p>
                  <p class="text-[8px] text-neutral-500 uppercase tracking-widest font-black">Local Shops</p>
                </div>
              </div>
            </div>

          </div>

          <!-- CTA ACTION BAR -->
          <div class="space-y-3 pt-4">
            <button (click)="close()"
              class="w-full py-4.5 rounded-2xl font-black text-black text-lg bg-gradient-to-r from-[#D4AF37] to-[#FF8A00] hover:brightness-110 transition-all duration-300 shadow-xl uppercase tracking-widest flex items-center justify-center gap-2">
              <span>Let's Find Your Perfect Slice</span>
              <span class="text-xl leading-none">➔</span>
            </button>
            <p class="text-center text-[10px] text-neutral-500 font-semibold">
              📍 We'll ask for your location to show nearby deals & delivery options.
            </p>
          </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `]
})
export class WelcomePosterComponent {
  @Output() closed = new EventEmitter<void>();
  private readonly router = inject(Router);

  close() {
    this.closed.emit();
    if (this.router.url === '/welcome-poster') {
      this.router.navigate(['/home']);
    }
  }
}
