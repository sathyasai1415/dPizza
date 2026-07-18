import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative min-h-[85vh] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 overflow-hidden">
      <!-- Background Decorative Gradients -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#E53935]/5 blur-[120px] pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-5xl mx-auto space-y-8">
        <!-- Page Header -->
        <div class="text-center sm:text-left">
          <h1 class="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Contact <span class="text-[#E53935] dark:text-[#D4AF37]">Support</span>
          </h1>
          <p class="text-sm mt-2 text-neutral-600 dark:text-neutral-400 max-w-xl">
            Have questions, order issues, or feedback? Drop us a message, and our Detroit team will get back to you within 24 hours.
          </p>
        </div>

        <div class="grid lg:grid-cols-5 gap-8 items-start">
          <!-- Left: Contact Information Cards (2 Cols) -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Card 1: Live Support Phone & Hours -->
            <div class="glass-card rounded-2xl p-5 border border-neutral-200 dark:border-[#D4AF37]/15 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#FF8A00]/5 text-[#D4AF37] flex items-center justify-center text-lg shrink-0 border border-[#D4AF37]/20 shadow-inner">📞</div>
                <div class="space-y-1">
                  <h3 class="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">Call Our Hotline</h3>
                  <p class="text-base font-bold text-[#E53935] dark:text-[#D4AF37]">+1 (313) 555-SLICE</p>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Daily support hours: 10:00 AM - 11:00 PM EST</p>
                </div>
              </div>
            </div>

            <!-- Card 2: HQ Address -->
            <div class="glass-card rounded-2xl p-5 border border-neutral-200 dark:border-[#D4AF37]/15 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#FF8A00]/5 text-[#D4AF37] flex items-center justify-center text-lg shrink-0 border border-[#D4AF37]/20 shadow-inner">📍</div>
                <div class="space-y-1">
                  <h3 class="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">Headquarters</h3>
                  <p class="text-xs font-bold text-neutral-800 dark:text-neutral-300">123 Pizza Parkway</p>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Detroit, Michigan 48201</p>
                </div>
              </div>
            </div>

            <!-- Card 3: Support Response Guarantee -->
            <div class="glass-card rounded-2xl p-5 border border-neutral-200 dark:border-[#D4AF37]/15 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/15 to-[#FF8A00]/5 text-[#D4AF37] flex items-center justify-center text-lg shrink-0 border border-[#D4AF37]/20 shadow-inner">⏱️</div>
                <div class="space-y-1">
                  <h3 class="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">Response Guarantee</h3>
                  <p class="text-xs font-bold text-neutral-800 dark:text-neutral-300">Under 24 Hours Response</p>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Our support queue is audited hourly to ensure fast support.</p>
                </div>
              </div>
            </div>

            <!-- Social Links Panel -->
            <div class="p-3 text-center">
              <p class="text-xs text-neutral-500 uppercase tracking-widest font-black mb-3">Join the community</p>
              <div class="flex justify-center gap-3">
                <a href="#" class="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FF8A00] transition shadow-sm">🍕</a>
                <a href="#" class="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FF8A00] transition shadow-sm">🐦</a>
                <a href="#" class="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FF8A00] transition shadow-sm">📸</a>
              </div>
            </div>
          </div>

          <!-- Right: Interactive Form Panel (3 Cols) -->
          <div class="lg:col-span-3">
            @if (sent()) {
              <!-- Success State Screen -->
              <div class="glass-card rounded-3xl p-8 border border-neutral-200 dark:border-[#D4AF37]/15 text-center space-y-6 shadow-xl animate-fade-in">
                <div class="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-4xl border border-[#D4AF37]/25 shadow-inner mx-auto text-[#D4AF37]">✓</div>
                <div class="space-y-2">
                  <h2 class="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Support Ticket Received!</h2>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    Thanks for reaching out, <span class="font-bold text-[#E53935] dark:text-[#D4AF37]">{{ name }}</span>! Your request under <span class="font-bold">"{{ category }}"</span> has been successfully sent to support.
                  </p>
                </div>
                <div class="border-t border-b border-neutral-200 dark:border-[#D4AF37]/15 py-4 max-w-sm mx-auto space-y-1">
                  <p class="text-xs text-neutral-500 font-medium uppercase tracking-wider">Support Hours</p>
                  <p class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Daily: 10:00 AM - 11:00 PM EST</p>
                  <p class="text-[10px] text-neutral-500 font-medium">Expect a response at <span class="underline">{{ email }}</span>.</p>
                </div>
                <button (click)="resetForm()" class="px-6 py-3 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-black text-xs uppercase tracking-wider transition cursor-pointer">
                  Send Another Message
                </button>
              </div>
            } @else {
              <!-- Support Input Form -->
              <form class="glass-card rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-[#D4AF37]/15 space-y-4 shadow-xl" (submit)="send($event)">
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Name</label>
                    <input [(ngModel)]="name" name="name" required placeholder="Your full name"
                      class="w-full bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-[#2B2B31] rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition" />
                  </div>
                  <div>
                    <label class="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" [(ngModel)]="email" name="email" required placeholder="email@address.com"
                      class="w-full bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-[#2B2B31] rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition" />
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Support Category</label>
                    <select [(ngModel)]="category" name="category" required
                      class="w-full bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-[#2B2B31] rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition">
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Support">Order Issue</option>
                      <option value="Partnership">Partnership Inquiry</option>
                      <option value="Feedback">Feedback / Suggestions</option>
                      <option value="Careers">Careers</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Order Number (Optional)</label>
                    <input [(ngModel)]="orderNumber" name="orderNumber" placeholder="e.g. MS-93041"
                      [required]="category === 'Order Support'"
                      [disabled]="category !== 'Order Support'"
                      class="w-full bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-[#2B2B31] rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition disabled:opacity-50" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Message</label>
                  <textarea [(ngModel)]="message" name="message" rows="4" required placeholder="How can our support crew assist you?"
                    class="w-full bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-[#2B2B31] rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition resize-none"></textarea>
                </div>

                <!-- Error Toast if POST fails -->
                <div *ngIf="errorMessage()" class="p-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-xl text-[#E53935] text-xs font-semibold">
                  ⚠️ {{ errorMessage() }}
                </div>

                <button type="submit" [disabled]="loading()"
                  class="w-full py-3.5 rounded-xl font-black text-neutral-900 dark:text-[#1C0338] bg-[#D4AF37] hover:bg-[#E6C96F] transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
                  <span *ngIf="loading()" class="w-4 h-4 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin"></span>
                  {{ loading() ? 'Submitting request...' : 'Submit Support Ticket' }}
                </button>
              </form>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    :host-context([data-theme="dark"]) .glass-card {
      background: rgba(20, 20, 25, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `]
})
export class ContactComponent {
  private readonly http = inject(HttpClient);

  name = '';
  email = '';
  category = 'General Inquiry';
  orderNumber = '';
  message = '';

  loading = signal(false);
  sent = signal(false);
  errorMessage = signal<string | null>(null);

  send(e: Event): void {
    e.preventDefault();
    this.loading.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name,
      email: this.email,
      category: this.category,
      orderNumber: this.orderNumber || null,
      message: this.message
    };

    this.http.post<any>(`${environment.apiUrl}/support/contact`, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err.error?.message || 'Failed to submit contact request. Please verify your details.';
        this.errorMessage.set(detail);
      }
    });
  }

  resetForm(): void {
    this.name = '';
    this.email = '';
    this.category = 'General Inquiry';
    this.orderNumber = '';
    this.message = '';
    this.sent.set(false);
    this.errorMessage.set(null);
  }
}
