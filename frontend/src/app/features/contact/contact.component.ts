import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-2xl mx-auto py-2 space-y-6">
      <div>
        <h1 class="text-3xl font-black text-brand-black">Contact Us</h1>
        <p class="text-brand-black mt-1">Questions, feedback, or partnership inquiries — we'd love to hear from you.</p>
      </div>

      <div class="grid sm:grid-cols-3 gap-3">
        <div class="clay rounded-2xl p-4 text-center">
          <p class="text-2xl mb-1">📧</p><p class="text-xs font-bold text-brand-black">Email</p>
          <p class="text-[11px] text-brand-black">hello&#64;mislice.online</p>
        </div>
        <div class="clay rounded-2xl p-4 text-center">
          <p class="text-2xl mb-1">📍</p><p class="text-xs font-bold text-brand-black">Based in</p>
          <p class="text-[11px] text-brand-black">Detroit, Michigan</p>
        </div>
        <div class="clay rounded-2xl p-4 text-center">
          <p class="text-2xl mb-1">⏱️</p><p class="text-xs font-bold text-brand-black">Response</p>
          <p class="text-[11px] text-brand-black">Within 24 hours</p>
        </div>
      </div>

      <form class="clay rounded-3xl p-6 space-y-4" (submit)="send($event)">
        <div>
          <label class="block text-xs font-bold text-brand-black uppercase mb-1">Name</label>
          <input [(ngModel)]="name" name="name" required class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-black uppercase mb-1">Email</label>
          <input type="email" [(ngModel)]="email" name="email" required class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-black uppercase mb-1">Message</label>
          <textarea [(ngModel)]="message" name="message" rows="4" required class="w-full bg-brand-white border border-brand-black rounded-xl px-4 py-3 text-brand-black text-sm focus:outline-none focus:border-brand-red resize-none"></textarea>
        </div>
        <button type="submit" class="w-full py-3.5 rounded-xl font-black text-brand-black hover:hover:transition">
          {{ sent() ? '✓ Message Sent' : 'Send Message' }}
        </button>
      </form>
    </div>
  `,
})
export class ContactComponent {
  name = ''; email = ''; message = '';
  sent = signal(false);
  send(e: Event): void { e.preventDefault(); this.sent.set(true); }
}
