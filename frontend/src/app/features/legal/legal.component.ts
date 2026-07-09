import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <h1 class="text-3xl font-black text-white tracking-tight">📄 Legal Information</h1>

      <!-- Terms of Service -->
      <div class="glass rounded-3xl p-8 space-y-4">
        <h2 class="text-xl font-black text-white border-b border-white/10 pb-3">Terms of Service</h2>
        <p class="text-xs text-white/30 font-medium">Last updated: July 9, 2026</p>

        <div class="space-y-4 text-sm text-white/60 leading-relaxed">
          <p>Welcome to MiSlice ("we", "our", "us"). By accessing or using mislice.online (the "Service"), you agree to be bound by these Terms of Service.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">1. Service Description</h3>
          <p>MiSlice is a pizza price comparison and ordering marketplace serving Michigan. We connect customers with local pizzerias to compare prices and place orders.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">2. User Accounts</h3>
          <p>You may create an account using Google Sign-In or email/password. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">3. Orders & Payments</h3>
          <p>Prices displayed are estimates and may vary. Payment is processed at the time of order through the selected payment method. Refunds are handled on a case-by-case basis by contacting our support team.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">4. Restaurant Partners</h3>
          <p>Restaurant partners ("Store Owners") are independent businesses. MiSlice is not responsible for food quality, preparation times, or delivery issues handled directly by the restaurant.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">5. Limitation of Liability</h3>
          <p>MiSlice is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the Service.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">6. Changes to Terms</h3>
          <p>We may update these terms at any time. Continued use of the Service constitutes acceptance of revised terms.</p>
        </div>
      </div>

      <!-- Privacy Policy -->
      <div class="glass rounded-3xl p-8 space-y-4">
        <h2 class="text-xl font-black text-white border-b border-white/10 pb-3">Privacy Policy</h2>
        <p class="text-xs text-white/30 font-medium">Last updated: July 9, 2026</p>

        <div class="space-y-4 text-sm text-white/60 leading-relaxed">
          <h3 class="text-base font-bold text-white/80 pt-2">1. Information We Collect</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Account information (name, email) via Google Sign-In or registration</li>
            <li>Order history and preferences</li>
            <li>Delivery addresses provided at checkout</li>
            <li>Usage data and analytics</li>
          </ul>

          <h3 class="text-base font-bold text-white/80 pt-2">2. How We Use Your Information</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>To process and fulfill your pizza orders</li>
            <li>To communicate order status and delivery updates</li>
            <li>To personalize your experience and recommendations</li>
            <li>To improve our Service</li>
          </ul>

          <h3 class="text-base font-bold text-white/80 pt-2">3. Data Sharing</h3>
          <p>We share order details with restaurant partners solely for order fulfillment. We do not sell your personal data to third parties.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">4. Data Security</h3>
          <p>We use industry-standard encryption (SSL/TLS) and store data on Google Cloud Platform with enterprise-grade security. Passwords are hashed and never stored in plain text.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">5. Your Rights</h3>
          <p>You may request deletion of your account and data at any time by contacting support&#64;mislice.online.</p>

          <h3 class="text-base font-bold text-white/80 pt-2">6. Contact</h3>
          <p>For privacy inquiries, email: <span class="text-red-400">support&#64;mislice.online</span></p>
        </div>
      </div>

      <!-- Cookie Policy -->
      <div class="glass rounded-3xl p-8 space-y-4">
        <h2 class="text-xl font-black text-white border-b border-white/10 pb-3">Cookie Policy</h2>
        <div class="text-sm text-white/60 leading-relaxed space-y-3">
          <p>MiSlice uses essential cookies and local storage to maintain your session, remember your cart, and store your preferences. We do not use third-party tracking cookies.</p>
          <p>By continuing to use the Service, you consent to our use of essential cookies.</p>
        </div>
      </div>
    </div>
  `
})
export class LegalComponent {}
