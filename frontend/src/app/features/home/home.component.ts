import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface SpecialPizza {
  name: string;
  emoji: string;
  price: number;
  discountPrice?: number;
  tags: string[];
  description: string;
  restaurant: string;
  rating: number;
  prepTime: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="home">

      <!-- Deals ticker -->
      <div class="ticker">
        <div class="track">
          <span>🍕 <b>Shamz Pizza:</b> Large Pepperoni now $11.99</span>
          <span>🏷️ <b>Marco's:</b> Buy One Get One Free</span>
          <span>⚡ <b>Pizza Hut:</b> Free delivery over $20</span>
          <span>🔥 <b>Jet's Pizza:</b> 30% off all deep dish</span>
          <span>💰 <b>Bunty's Pizza:</b> $5 off any XL pizza</span>
          <span aria-hidden="true">🍕 <b>Shamz Pizza:</b> Large Pepperoni now $11.99</span>
          <span aria-hidden="true">🏷️ <b>Marco's:</b> Buy One Get One Free</span>
          <span aria-hidden="true">⚡ <b>Pizza Hut:</b> Free delivery over $20</span>
        </div>
      </div>

      <!-- Promo hero -->
      <div class="promo">
        <div class="pt">
          <span class="badge">Featured Specials</span>
          <h1>Craving the <b>perfect slice?</b></h1>
          <p>Compare live prices from local pizzerias, or build your own masterpiece from scratch.</p>
          <div class="cta">
            <button class="pri" (click)="navigateToBuilder()">🍕 Build Your Pizza</button>
            <button class="sec" (click)="navigateToOrder()">Compare prices</button>
          </div>
        </div>
        <div class="pie">🍕</div>
      </div>

      <!-- Categories -->
      <div class="sechd"><h2>Categories</h2></div>
      <div class="cats">
        @for (c of categories; track c.label) {
          <button class="cat" (click)="quickCompare(c.label)">
            <span class="b">{{ c.emoji }}</span>
            <span>{{ c.label }}</span>
          </button>
        }
      </div>

      <!-- Specials -->
      <div class="sechd"><h2>Specials &amp; Recommendations</h2><span class="sub">Handpicked deals near you</span></div>
      <div class="grid">
        @for (item of recommendedPizzas; track item.name) {
          <div class="food">
            <div class="thumb">
              <span class="tag">{{ item.tags[0] }}</span>
              @if (item.discountPrice) { <span class="save">Save {{ (item.price - item.discountPrice) | currency }}</span> }
              <span class="emoji">{{ item.emoji }}</span>
            </div>
            <div class="body">
              <div class="row1">
                <h3>{{ item.name }}</h3>
                <span class="rate">★ {{ item.rating }}</span>
              </div>
              <p class="desc">{{ item.description }}</p>
              <p class="by">🍕 {{ item.restaurant }}</p>
              <div class="foot">
                <div class="price">
                  @if (item.discountPrice) {
                    <span class="was">{{ item.price | currency }}</span>
                    <span class="now">{{ item.discountPrice | currency }}</span>
                  } @else {
                    <span class="now">{{ item.price | currency }}</span>
                  }
                </div>
                <button class="order" (click)="quickCompare(item.name)">Order</button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Top menu -->
      <div class="sechd"><h2>Top Menu Pizzas</h2><span class="sub">Most popular in Michigan</span></div>
      <div class="list">
        @for (item of topMenuPizzas; track item.name) {
          <div class="litem">
            <span class="lemoji">{{ item.emoji }}</span>
            <div class="lm">
              <div class="lrow"><h4>{{ item.name }}</h4><span class="lp">{{ item.price | currency }}</span></div>
              <p class="ldesc">{{ item.description }}</p>
              <div class="lfoot">
                <span class="pop">🔥 Popular</span>
                <button class="qc" (click)="quickCompare(item.name)">Quick checkout</button>
              </div>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host{
      --o:#FF6A13; --o2:#F0530A; --o-soft:#FFE7D3;
      --cream:#FBF4EA; --surface:#FFFFFF; --warm:#F2E9DA;
      --ink:#241C15; --muted:#9B8B77; --faint:#C9BBA8;
      --espresso:#20140C; --tomato:#E5462F; --gold:#F6A623; --basil:#4E9B5A;
      --line:rgba(36,28,21,.10);
      display:block; min-height:100%; background:var(--cream); color:var(--ink);
      font-family:"Plus Jakarta Sans", ui-rounded, system-ui, sans-serif;
    }
    .home{max-width:820px; margin:0 auto; padding:16px 18px 40px; display:flex; flex-direction:column; gap:16px;}

    .ticker{background:var(--surface); border:1px solid var(--line); border-radius:14px; overflow:hidden; padding:11px 0;}
    .track{display:flex; gap:44px; white-space:nowrap; width:max-content; animation:marquee 26s linear infinite;
      font-size:12.5px; font-weight:600; color:var(--muted);}
    .track b{color:var(--o2);}
    .ticker:hover .track{animation-play-state:paused;}
    @keyframes marquee{from{transform:translateX(0)} to{transform:translateX(-50%)}}

    .promo{position:relative; overflow:hidden; border-radius:22px; padding:26px 24px; color:#fff;
      background:radial-gradient(120% 130% at 88% 15%, #35251a 0%, var(--espresso) 62%);}
    .promo .pt{max-width:80%;}
    .promo .badge{font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--gold);}
    .promo h1{font-weight:800; font-size:28px; line-height:1.06; letter-spacing:-.025em; margin:10px 0 8px;}
    .promo h1 b{color:var(--o);}
    .promo p{font-size:13px; color:rgba(255,255,255,.66); font-weight:500; line-height:1.5; max-width:44ch;}
    .promo .cta{display:flex; gap:10px; margin-top:18px; flex-wrap:wrap;}
    .promo .pri{background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; border:none; padding:12px 18px; border-radius:12px;
      font-weight:800; font-size:13.5px; cursor:pointer; font-family:inherit; box-shadow:0 12px 22px -12px rgba(240,83,10,.7);}
    .promo .sec{background:rgba(255,255,255,.12); color:#fff; border:none; padding:12px 18px; border-radius:12px; font-weight:800; font-size:13.5px; cursor:pointer; font-family:inherit;}
    .promo .pie{position:absolute; right:-20px; top:50%; transform:translateY(-50%); font-size:130px; opacity:.16; pointer-events:none;}

    .sechd{display:flex; align-items:baseline; gap:10px; margin-top:6px;}
    .sechd h2{font-weight:800; font-size:18px; letter-spacing:-.01em;}
    .sechd .sub{font-size:12px; color:var(--muted); font-weight:600;}

    .cats{display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none;}
    .cats::-webkit-scrollbar{display:none;}
    .cat{flex:none; display:flex; flex-direction:column; align-items:center; gap:7px; background:none; border:none; cursor:pointer; font-family:inherit;}
    .cat .b{width:60px; height:60px; border-radius:19px; background:var(--surface); border:1px solid var(--line);
      display:grid; place-items:center; font-size:26px; transition:.16s; box-shadow:0 6px 14px -10px rgba(120,70,20,.5);}
    .cat span:last-child{font-size:11.5px; font-weight:700; color:var(--muted);}
    .cat:hover .b{transform:translateY(-2px); border-color:var(--o); box-shadow:0 12px 20px -10px rgba(240,83,10,.5);}

    .grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:14px;}
    .food{background:var(--surface); border:1px solid var(--line); border-radius:20px; overflow:hidden; display:flex; flex-direction:column;
      box-shadow:0 8px 20px -16px rgba(120,70,20,.5); transition:transform .16s, box-shadow .16s;}
    .food:hover{transform:translateY(-3px); box-shadow:0 16px 28px -16px rgba(120,70,20,.55);}
    .food .thumb{height:120px; position:relative; background:radial-gradient(circle at 50% 40%,#FFF0DC,#FBE7CE); display:grid; place-items:center;}
    .food .thumb .emoji{font-size:58px;}
    .food .thumb .tag{position:absolute; top:10px; left:10px; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
      background:var(--tomato); color:#fff; padding:5px 9px; border-radius:999px;}
    .food .thumb .save{position:absolute; top:10px; right:10px; font-size:10px; font-weight:800; background:var(--basil); color:#fff; padding:4px 8px; border-radius:8px;}
    .food .body{padding:14px; display:flex; flex-direction:column; gap:7px; flex:1;}
    .food .row1{display:flex; justify-content:space-between; align-items:flex-start; gap:8px;}
    .food h3{font-weight:800; font-size:14.5px; letter-spacing:-.01em; line-height:1.2;}
    .food .rate{font-size:12px; font-weight:800; color:var(--gold); flex:none;}
    .food .desc{font-size:11.5px; color:var(--muted); font-weight:500; line-height:1.5;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}
    .food .by{font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.04em;}
    .food .foot{display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:8px;}
    .food .price{display:flex; align-items:baseline; gap:6px;}
    .food .was{font-size:12px; color:var(--faint); font-weight:700; text-decoration:line-through;}
    .food .now{font-weight:800; font-size:16px; color:var(--ink);}
    .food .order{background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; border:none; padding:9px 15px; border-radius:11px;
      font-weight:800; font-size:12.5px; cursor:pointer; font-family:inherit; box-shadow:0 8px 14px -8px rgba(240,83,10,.7);}

    .list{display:flex; flex-direction:column; gap:12px;}
    .litem{display:flex; gap:13px; background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:15px;
      box-shadow:0 6px 16px -14px rgba(120,70,20,.5);}
    .lemoji{font-size:38px; flex:none;}
    .lm{flex:1; min-width:0;}
    .lrow{display:flex; justify-content:space-between; align-items:flex-start; gap:8px;}
    .lm h4{font-weight:800; font-size:15px; letter-spacing:-.01em;}
    .lp{font-weight:800; font-size:14.5px; color:var(--o); flex:none;}
    .ldesc{font-size:12px; color:var(--muted); font-weight:500; line-height:1.5; margin:5px 0 9px;}
    .lfoot{display:flex; align-items:center; justify-content:space-between;}
    .pop{font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--o2);}
    .qc{background:var(--warm); border:none; padding:8px 14px; border-radius:10px; font-weight:800; font-size:11.5px; color:var(--ink); cursor:pointer; font-family:inherit;}
    .qc:hover{background:var(--o-soft);}

    button:focus-visible{outline:2px solid var(--o); outline-offset:2px;}
    @media (prefers-reduced-motion:reduce){ .track{animation:none} .food{transition:none} }
  `]
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);

  categories = [
    { label: 'Classic', emoji: '🍕' },
    { label: 'Pepperoni', emoji: '🌶️' },
    { label: 'Veggie', emoji: '🥦' },
    { label: 'Meat', emoji: '🥓' },
    { label: 'Cheese', emoji: '🧀' },
    { label: 'BBQ', emoji: '🔥' },
  ];

  recommendedPizzas: SpecialPizza[] = [
    {
      name: 'Spicy Honey Pepperoni Melt',
      emoji: '🌶️',
      price: 15.99,
      discountPrice: 12.99,
      tags: ['Bestseller', 'Spicy'],
      description: 'Double pepperoni, hot honey drizzle, jalapeno coins, and gooey mozzarella on a crispy golden crust.',
      restaurant: 'Marco\'s Pizza',
      rating: 4.8,
      prepTime: 20
    },
    {
      name: 'Cheesy Garlic Truffle Supreme',
      emoji: '🍄',
      price: 17.99,
      tags: ['Chef Special', 'Vegetarian'],
      description: 'Rich garlic white cream base, truffle oil drizzle, button mushrooms, spinach, and caramelized sweet onions.',
      restaurant: 'Jet\'s Pizza',
      rating: 4.7,
      prepTime: 25
    },
    {
      name: 'Detroit Crispy bacon Ranch',
      emoji: '🥓',
      price: 16.49,
      discountPrice: 14.49,
      tags: ['Detroit Style', 'Heavy'],
      description: 'Thick square deep-dish crust with caramelized crispy cheese borders, smoked bacon bits, and creamy garlic ranch swirl.',
      restaurant: 'Bunty\'s Pizza',
      rating: 4.9,
      prepTime: 22
    }
  ];

  topMenuPizzas = [
    { name: 'Classic Detroit Deep Dish', emoji: '📐', price: 13.99, description: 'Authentic Michigan square pizza with thick marinara stripe on top and crispy brown cheddar cheese edge.' },
    { name: 'Brooklyn Style Pepperoni Feast', emoji: '🗽', price: 14.99, description: 'Huge foldable thin crust slices packed with cup-and-char pepperoni and Italian spices.' },
    { name: 'Four Cheese Garlic Thin Crust', emoji: '🧀', price: 11.99, description: 'Mozzarella, parmesan, asiago, and romano cheeses melted over fresh crushed garlic sauce.' },
    { name: 'Tavern Square Cut Supreme', emoji: '✂️', price: 15.49, description: 'Ultra thin, cracker-like square cut pub crust loaded with spicy sausage chunks, peppers, and red onions.' }
  ];

  ngOnInit() {}

  navigateToBuilder() { this.router.navigate(['/builder']); }
  navigateToOrder() { this.router.navigate(['/order']); }
  quickCompare(intent: string) { this.router.navigate(['/quick-compare'], { queryParams: { intent } }); }
}
