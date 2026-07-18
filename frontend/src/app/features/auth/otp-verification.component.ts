import { Component, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-container">
      <!-- Hero Background -->
      <div class="hero-background"></div>

      <!-- OTP Card -->
      <div class="otp-card">
        <h2>Enter OTP</h2>
        <p class="phone-display">Code sent to {{ phoneNumber() }}</p>

        <!-- OTP Input Boxes -->
        <div class="otp-inputs">
          <input
            #otpInput
            type="text"
            class="otp-digit"
            maxlength="1"
            placeholder="•"
            *ngFor="let digit of [0,1,2,3,4,5]; let i = index"
            (input)="onOtpInput($event, i)"
            (keydown)="onKeyDown($event, i)"
            (paste)="onPaste($event)"
          />
        </div>

        <!-- Resend OTP -->
        <div class="resend-section">
          <span class="resend-text">Didn't receive code? </span>
          <span class="resend-link" (click)="resendOtp()">Resend OTP</span>
          <span class="timer" *ngIf="resendTimer() > 0"> ({{ resendTimer() }}s)</span>
        </div>

        <!-- Verify Button -->
        <button
          class="btn-verify"
          [disabled]="!isOtpComplete()"
          (click)="verifyOtp()"
        >
          Verify & Continue
        </button>
      </div>
    </div>
  `,
  styles: [`
    .otp-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
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

    .otp-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 32px 24px;
      backdrop-filter: blur(10px);
      text-align: center;
    }

    .otp-card h2 {
      color: #FFFFFF;
      font-size: 20px;
      margin-bottom: 8px;
      font-weight: bold;
    }

    .phone-display {
      color: #B8B8B8;
      font-size: 13px;
      margin-bottom: 24px;
    }

    .otp-inputs {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
    }

    .otp-digit {
      width: 44px;
      height: 52px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
      text-align: center;
      transition: all 300ms ease-out;
      font-family: 'Courier New', monospace;
    }

    .otp-digit:focus {
      outline: none;
      background: rgba(212, 175, 55, 0.15);
      border-color: rgba(212, 175, 55, 0.5);
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
    }

    .otp-digit::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .resend-section {
      color: #B8B8B8;
      font-size: 12px;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .resend-text {
      color: #B8B8B8;
    }

    .resend-link {
      color: #D4AF37;
      cursor: pointer;
      font-weight: bold;
      transition: color 300ms ease-out;
    }

    .resend-link:hover {
      color: #E5BF47;
    }

    .timer {
      color: #B8B8B8;
      font-size: 11px;
    }

    .btn-verify {
      width: 100%;
      padding: 14px;
      background: #D4AF37;
      border: none;
      border-radius: 16px;
      color: #0E0E10;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: all 300ms ease-out;
    }

    .btn-verify:hover:not(:disabled) {
      background: #E5BF47;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
    }

    .btn-verify:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-verify:disabled {
      background: rgba(212, 175, 55, 0.4);
      color: rgba(14, 14, 16, 0.5);
      cursor: not-allowed;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .otp-card {
        padding: 24px 16px;
      }

      .otp-digit {
        width: 40px;
        height: 48px;
      }
    }
  `]
})
export class OtpVerificationComponent {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  phoneNumber = signal('+1234567890'); // TODO: Pass from previous step
  otpValues = signal(Array(6).fill(''));
  resendTimer = signal(0);
  isResending = signal(false);

  constructor(private router: Router) {}

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d?$/.test(value)) {
      input.value = '';
      return;
    }

    input.value = value;
    const otp = this.otpValues();
    otp[index] = value;
    this.otpValues.set([...otp]);

    if (value && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const otp = this.otpValues();
      if (!otp[index] && index > 0) {
        const prevInput = this.otpInputs.toArray()[index - 1];
        if (prevInput) {
          prevInput.nativeElement.focus();
        }
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const otp = [...digits, ...Array(6 - digits.length).fill('')];
      this.otpValues.set(otp);

      setTimeout(() => {
        const lastFilledIndex = digits.length - 1;
        if (lastFilledIndex < 5) {
          this.otpInputs.toArray()[lastFilledIndex + 1]?.nativeElement.focus();
        }
      }, 0);
    }
  }

  isOtpComplete(): boolean {
    return this.otpValues().every(v => v !== '');
  }

  verifyOtp() {
    const otp = this.otpValues().join('');
    console.log('Verifying OTP:', otp);
    // TODO: Call backend API to verify OTP
    // On success, navigate to welcome poster or home
    this.router.navigate(['/welcome-poster']);
  }

  resendOtp() {
    if (this.isResending()) return;

    this.isResending.set(true);
    this.resendTimer.set(30);

    // TODO: Call backend API to resend OTP
    console.log('Resending OTP to:', this.phoneNumber());

    const interval = setInterval(() => {
      this.resendTimer.update(v => v - 1);
      if (this.resendTimer() === 0) {
        clearInterval(interval);
        this.isResending.set(false);
      }
    }, 1000);
  }
}
