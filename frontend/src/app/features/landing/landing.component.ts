import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing-container">
      <!-- Hero Background -->
      <div class="hero-background"></div>

      <!-- Content -->
      <div class="landing-content">
        <!-- Headline -->
        <div class="headline-section">
          <div class="headline">
            <span class="white">Find the best</span>
            <div>
              <span class="white">pizza</span>
              <span class="gold">deals</span>
            </div>
            <span class="white">near you</span>
          </div>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <!-- Location Input -->
          <div class="form-group">
            <button class="location-btn" (click)="useMyLocation()">
              📍 Use my location
            </button>
          </div>

          <div class="form-group">
            <input
              type="text"
              class="glass-input"
              [(ngModel)]="city"
              placeholder="Or enter city manually"
            />
          </div>

          <!-- Phone Input -->
          <div class="form-group">
            <input
              type="tel"
              class="glass-input"
              [(ngModel)]="phoneNumber"
              placeholder="Enter phone number"
              (input)="formatPhoneNumber()"
            />
          </div>

          <!-- Sign In Button -->
          <button class="btn-primary" (click)="signIn()">
            Sign In
          </button>

          <!-- Sign Up Link -->
          <div class="signup-link">
            Don't have an account?
            <span class="gold-text" (click)="signUp()">Sign up</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .hero-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%),
                  url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><radialGradient id="pizza" cx="50%25" cy="50%25" r="50%25"><stop offset="0%25" style="stop-color:%23E5BF47;stop-opacity:0.3" /><stop offset="100%25" style="stop-color:%23D4521A;stop-opacity:0.1" /></radialGradient></defs><rect fill="%231a1a1a" width="1200" height="800"/><circle cx="150" cy="100" r="200" fill="url(%23pizza)" opacity="0.4"/><circle cx="1050" cy="700" r="250" fill="url(%23pizza)" opacity="0.3"/></svg>');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      z-index: 0;
    }

    .landing-content {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 24px 30px;
    }

    .headline-section {
      margin-bottom: 20px;
    }

    .headline {
      font-size: 36px;
      font-weight: bold;
      line-height: 1.2;
      word-spacing: 100vw;
    }

    .headline .white {
      color: #FFFFFF;
    }

    .headline .gold {
      color: #D4AF37;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .glass-input,
    .location-btn {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      color: #F8F8F8;
      font-size: 14px;
      backdrop-filter: blur(10px);
      font-family: inherit;
    }

    .glass-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .location-btn {
      cursor: pointer;
      text-align: left;
      transition: all 300ms ease-out;
    }

    .location-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .glass-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(212, 175, 55, 0.5);
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
    }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #D4AF37;
      border: none;
      border-radius: 16px;
      color: #0E0E10;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      margin-top: 8px;
      transition: all 300ms ease-out;
    }

    .btn-primary:hover {
      background: #E5BF47;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .signup-link {
      text-align: center;
      margin-top: 12px;
      font-size: 13px;
      color: #B8B8B8;
    }

    .gold-text {
      color: #D4AF37;
      cursor: pointer;
      font-weight: bold;
      transition: color 300ms ease-out;
    }

    .gold-text:hover {
      color: #E5BF47;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .landing-content {
        padding: 30px 16px 20px;
      }

      .headline {
        font-size: 28px;
      }
    }

    /* Tablet & Desktop */
    @media (min-width: 768px) {
      .landing-content {
        max-width: 500px;
        margin: 0 auto;
      }
    }
  `]
})
export class LandingComponent {
  city = signal('');
  phoneNumber = signal('');

  constructor(private router: Router) {}

  useMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location:', position.coords);
          // TODO: Convert coordinates to city name
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Please enable location access');
        }
      );
    }
  }

  formatPhoneNumber() {
    let phone = this.phoneNumber().replace(/\D/g, '');
    if (phone.length > 10) phone = phone.slice(0, 10);
    this.phoneNumber.set(phone);
  }

  signIn() {
    this.router.navigate(['/otp']);
  }

  signUp() {
    this.router.navigate(['/otp']);
  }
}
