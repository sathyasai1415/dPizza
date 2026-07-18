import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PosterCard {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-welcome-poster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="poster-container">
      <!-- Background Gradient -->
      <div class="poster-background"></div>

      <!-- Poster Card -->
      <div class="poster-card">
        <div class="poster-icon">{{ currentPoster().icon }}</div>
        <h3>{{ currentPoster().title }}</h3>
        <p>{{ currentPoster().description }}</p>
      </div>

      <!-- Progress Dots -->
      <div class="dots">
        <span
          class="dot"
          [class.active]="i === currentSlide()"
          *ngFor="let i of [0, 1, 2]"
        ></span>
      </div>

      <!-- Action Buttons -->
      <div class="poster-buttons">
        <button class="skip-btn" (click)="skipPoster()">Skip</button>
        <button class="find-btn" (click)="nextSlide()">
          {{ currentSlide() === 2 ? 'Find best pizza →' : 'Next →' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .poster-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .poster-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(229, 57, 53, 0.1));
      z-index: 0;
    }

    .poster-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 40px 24px;
      backdrop-filter: blur(20px);
      text-align: center;
      margin-bottom: 40px;
      animation: slideUp 400ms ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .poster-icon {
      font-size: 60px;
      margin-bottom: 20px;
      display: block;
    }

    .poster-card h3 {
      color: #FFFFFF;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 12px;
    }

    .poster-card p {
      color: #B8B8B8;
      font-size: 14px;
      line-height: 1.6;
    }

    .dots {
      display: flex;
      gap: 12px;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }

    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: all 300ms ease-out;
      cursor: pointer;
    }

    .dot.active {
      background: #D4AF37;
      transform: scale(1.25);
    }

    .dot:hover {
      background: rgba(212, 175, 55, 0.8);
    }

    .poster-buttons {
      display: flex;
      gap: 12px;
      width: 100%;
      max-width: 320px;
      position: relative;
      z-index: 1;
    }

    .skip-btn,
    .find-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 300ms ease-out;
    }

    .skip-btn {
      background: transparent;
      color: #B8B8B8;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .skip-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
      color: #FFFFFF;
    }

    .find-btn {
      background: #D4AF37;
      color: #0E0E10;
    }

    .find-btn:hover {
      background: #E5BF47;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
    }

    .find-btn:active {
      transform: translateY(0);
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .poster-card {
        padding: 32px 20px;
      }

      .poster-icon {
        font-size: 48px;
      }

      .poster-card h3 {
        font-size: 18px;
      }

      .poster-card p {
        font-size: 13px;
      }
    }
  `]
})
export class WelcomePosterComponent {
  currentSlide = signal(0);

  posterCards: PosterCard[] = [
    {
      icon: '💰',
      title: 'Compare Prices',
      description: 'See real prices from multiple pizzerias instantly'
    },
    {
      icon: '🎁',
      title: 'Find Deals',
      description: 'Discover exclusive offers and special promotions'
    },
    {
      icon: '💵',
      title: 'Better Prices',
      description: 'Save money on every pizza order'
    }
  ];

  constructor(private router: Router) {}

  currentPoster() {
    return this.posterCards[this.currentSlide()];
  }

  nextSlide() {
    if (this.currentSlide() < this.posterCards.length - 1) {
      this.currentSlide.update(v => v + 1);
    } else {
      this.goToHome();
    }
  }

  skipPoster() {
    this.goToHome();
  }

  private goToHome() {
    // TODO: Navigate to home page
    this.router.navigate(['/home']);
  }
}
