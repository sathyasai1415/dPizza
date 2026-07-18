import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pizzeria {
  id: number;
  name: string;
  rating: number;
  priceRange: string;
  distance?: number;
  deliveryTime?: number;
  image?: string;
  topDeals?: string[];
  reviews?: string[];
}

interface Pizza {
  id: number;
  name: string;
  restaurant: string;
  price: number;
}

@Component({
  selector: 'app-home-redesign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="home-container">
      <!-- Sticky Search Bar -->
      <div class="sticky-search">
        <input
          type="text"
          class="search-input"
          [(ngModel)]="searchQuery"
          placeholder="🔍 Search restaurants, pizzas..."
        />
      </div>

      <!-- Main Content -->
      <div class="home-content">
        <!-- Advertised Pizzerias Section -->
        <div class="section">
          <h2 class="section-title">Advertised Pizzerias</h2>
          <div class="pizzeria-grid">
            <div
              class="pizzeria-card"
              *ngFor="let pizzeria of pizzerias; let i = index"
              [class.expanded]="expandedCard() === i"
            >
              <!-- Compact View -->
              <div class="card-compact" *ngIf="expandedCard() !== i">
                <div class="pizzeria-name">{{ pizzeria.name }}</div>
                <div class="pizzeria-info">
                  <span class="star">★</span>
                  <span class="rating">{{ pizzeria.rating }}</span>
                  <span class="price" [style.margin-left.%]="50">
                    {{ pizzeria.priceRange }}
                  </span>
                </div>
                <div class="card-buttons">
                  <button class="view-btn">View</button>
                  <button class="eye-btn" (click)="toggleExpand(i)">👁️</button>
                </div>
              </div>

              <!-- Expanded View -->
              <div class="card-expanded" *ngIf="expandedCard() === i">
                <div class="expand-image">🍕 {{ pizzeria.name }}</div>
                <div class="expand-content">
                  <h3>{{ pizzeria.name }}</h3>
                  <div class="expand-info">
                    <span>★{{ pizzeria.rating }}</span>
                    <span *ngIf="pizzeria.distance">📍 {{ pizzeria.distance }} km</span>
                    <span *ngIf="pizzeria.deliveryTime">⏱️ {{ pizzeria.deliveryTime }} min</span>
                  </div>
                  <div class="expand-deals" *ngIf="pizzeria.topDeals">
                    <p class="deals-title">Top Deals:</p>
                    <ul>
                      <li *ngFor="let deal of pizzeria.topDeals">{{ deal }}</li>
                    </ul>
                  </div>
                  <div class="expand-reviews" *ngIf="pizzeria.reviews">
                    <p class="reviews-title">Reviews:</p>
                    <p *ngFor="let review of pizzeria.reviews" class="review-text">
                      "{{ review }}"
                    </p>
                  </div>
                  <button class="close-btn" (click)="toggleExpand(i)">👁️ Minimize</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compare Section -->
        <div class="section">
          <div class="compare-buttons">
            <button class="compare-btn" (click)="buildPizza()">
              🔨 Build Pizza
            </button>
            <button class="compare-btn" (click)="browsePizzas()">
              🔄 Browse & Compare
            </button>
          </div>
        </div>

        <!-- Recommendations Section -->
        <div class="section">
          <h2 class="section-title">Recommended For You</h2>
          <div class="recommendations-scroll">
            <div class="scroll-hint">← Swipe to see more →</div>
            <div class="recommendations-container">
              <div class="rec-card" *ngFor="let pizza of recommendations">
                <div class="rec-name">{{ pizza.name }}</div>
                <div class="rec-restaurant">{{ pizza.restaurant }}</div>
                <div class="rec-price">₹{{ pizza.price }}</div>
                <button class="rec-view-btn">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(135deg, #0E0E10 0%, #1a1a1a 50%, #0E0E10 100%);
      overflow: hidden;
    }

    .sticky-search {
      position: sticky;
      top: 0;
      z-index: 10;
      background: linear-gradient(to bottom, rgba(26, 26, 26, 0.95), rgba(14, 14, 16, 0.85));
      backdrop-filter: blur(8px);
      padding: 12px;
      border-bottom: 1px solid #2B2B31;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid #2B2B31;
      border-radius: 12px;
      color: #F8F8F8;
      font-size: 13px;
      font-family: inherit;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .search-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.1);
      border-color: #D4AF37;
    }

    .home-content {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 80px;
    }

    .section {
      padding: 0;
    }

    .section-title {
      color: #FFFFFF;
      font-size: 16px;
      font-weight: bold;
      margin: 16px 12px 12px;
    }

    /* Pizzeria Grid */
    .pizzeria-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 0 12px;
    }

    .pizzeria-card {
      background: #18181B;
      border: 1px solid #2B2B31;
      border-radius: 12px;
      overflow: hidden;
    }

    /* Compact View */
    .card-compact {
      padding: 12px;
    }

    .pizzeria-name {
      color: #F8F8F8;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .pizzeria-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #B8B8B8;
      margin-bottom: 8px;
    }

    .star {
      color: #D4AF37;
    }

    .price {
      color: #D4AF37;
      font-weight: bold;
    }

    .card-buttons {
      display: flex;
      gap: 8px;
    }

    .view-btn,
    .eye-btn {
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 200ms ease-out;
      font-size: 12px;
      font-weight: bold;
    }

    .view-btn {
      flex: 1;
      padding: 8px;
      background: #D4AF37;
      color: #0E0E10;
    }

    .view-btn:hover {
      background: #E5BF47;
    }

    .eye-btn {
      width: 40px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #2B2B31;
      color: #D4AF37;
    }

    .eye-btn:hover {
      background: rgba(212, 175, 55, 0.2);
    }

    /* Expanded View */
    .card-expanded {
      padding: 12px;
    }

    .expand-image {
      font-size: 40px;
      text-align: center;
      margin-bottom: 12px;
      color: #D4AF37;
    }

    .expand-content h3 {
      color: #FFFFFF;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .expand-info {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #B8B8B8;
      margin-bottom: 12px;
    }

    .expand-deals,
    .expand-reviews {
      margin-bottom: 12px;
      font-size: 12px;
    }

    .deals-title,
    .reviews-title {
      color: #D4AF37;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .expand-deals ul {
      list-style: none;
      padding-left: 0;
      color: #B8B8B8;
    }

    .expand-deals li {
      padding: 4px 0;
      border-bottom: 1px solid #2B2B31;
    }

    .review-text {
      color: #B8B8B8;
      margin-bottom: 6px;
      font-style: italic;
    }

    .close-btn {
      width: 100%;
      padding: 8px;
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid #D4AF37;
      border-radius: 8px;
      color: #D4AF37;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 200ms ease-out;
    }

    .close-btn:hover {
      background: rgba(212, 175, 55, 0.3);
    }

    /* Compare Section */
    .compare-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 12px;
      margin-top: 12px;
    }

    .compare-btn {
      padding: 16px 12px;
      border: 1px solid #2B2B31;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      color: #F8F8F8;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .compare-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #D4AF37;
    }

    /* Recommendations */
    .recommendations-scroll {
      padding: 12px;
    }

    .scroll-hint {
      font-size: 12px;
      color: #B8B8B8;
      margin-bottom: 12px;
      text-align: center;
    }

    .recommendations-container {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-right: 12px;
      scroll-behavior: smooth;
    }

    .recommendations-container::-webkit-scrollbar {
      height: 4px;
    }

    .recommendations-container::-webkit-scrollbar-track {
      background: #18181B;
    }

    .recommendations-container::-webkit-scrollbar-thumb {
      background: #D4AF37;
      border-radius: 2px;
    }

    .rec-card {
      flex: 0 0 calc(50% - 6px);
      background: #18181B;
      border: 1px solid #2B2B31;
      border-radius: 12px;
      padding: 12px;
    }

    .rec-name {
      color: #F8F8F8;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .rec-restaurant {
      color: #B8B8B8;
      font-size: 11px;
      margin-bottom: 8px;
    }

    .rec-price {
      color: #D4AF37;
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .rec-view-btn {
      width: 100%;
      padding: 8px;
      background: #D4AF37;
      border: none;
      border-radius: 8px;
      color: #0E0E10;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .rec-view-btn:hover {
      background: #E5BF47;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .pizzeria-grid {
        grid-template-columns: 1fr;
      }

      .rec-card {
        flex: 0 0 70%;
      }
    }

    /* Tablet & Desktop */
    @media (min-width: 768px) {
      .pizzeria-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class HomeRedesignComponent {
  searchQuery = signal('');
  expandedCard = signal(-1);

  pizzerias: Pizzeria[] = [
    {
      id: 1,
      name: "Domino's",
      rating: 4.5,
      priceRange: '$8-15',
      distance: 2.3,
      deliveryTime: 30,
      topDeals: ['Pepperoni - $8.99', 'Veggie - $9.99'],
      reviews: ['Amazing pizza!', 'Best deals in town']
    },
    {
      id: 2,
      name: 'Pizza Hut',
      rating: 4.8,
      priceRange: '$10-18',
      distance: 1.8,
      deliveryTime: 25,
      topDeals: ['Cheese - $10.99', 'Spicy - $11.99'],
      reviews: ['Always fresh', 'Quick delivery']
    },
    {
      id: 3,
      name: "Papa John's",
      rating: 4.3,
      priceRange: '$9-16',
      distance: 3.1,
      deliveryTime: 35,
      topDeals: ['Classic - $9.99', 'Premium - $13.99'],
      reviews: ['Great quality', 'Generous toppings']
    }
  ];

  recommendations: Pizza[] = [
    { id: 1, name: 'Pepperoni Pizza', restaurant: 'Pizza Co', price: 9.99 },
    { id: 2, name: 'Veggie Paradise', restaurant: 'Green Pizza', price: 8.99 },
    { id: 3, name: 'Spicy Inferno', restaurant: 'Hot Pizza', price: 10.99 },
    { id: 4, name: 'Cheese Lovers', restaurant: 'Mozzarella Hut', price: 7.99 }
  ];

  toggleExpand(index: number) {
    if (this.expandedCard() === index) {
      this.expandedCard.set(-1);
    } else {
      this.expandedCard.set(index);
    }
  }

  buildPizza() {
    console.log('Build Pizza clicked');
    // TODO: Navigate to build pizza page
  }

  browsePizzas() {
    console.log('Browse & Compare clicked');
    // TODO: Navigate to pizza comparison page
  }
}
