import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

/** A single selectable ingredient. `price` is the per-unit up-charge (0 = included). */
interface Ing { label: string; emoji: string; price?: number; tags?: string[]; }
type Placement = 'whole' | 'left' | 'right';

interface BuildConfig {
  size: string;
  crust: string;
  sauces: string[];
  cheeses: string[];
  meats: string[];
  veggies: string[];
  seasonings: string[];
  dips: string[];
  placement: Record<string, Placement>;
  extras: string[]; // toppings the user wants an "Extra" serving of
}

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="w-full pt-2 pb-24">
      <!-- Header + progress -->
      <div class="mb-6 text-center">
        <div class="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-4 py-2 rounded-full mb-3 uppercase tracking-widest">
          ✦ Universal Pizza Builder
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">Build Your Own Pizza</h1>
        <p class="text-white/50 text-sm">Craft it exactly how you like — we'll find the restaurants that can make it.</p>
      </div>

      <!-- Progress bar -->
      <div class="max-w-3xl mx-auto mb-6 px-1">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Your build</span>
          <span class="text-[10px] font-black text-orange-400">{{ progress() }}% complete</span>
        </div>
        <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-500" [style.width.%]="progress()"></div>
        </div>
      </div>

      @if (successMsg()) {
        <div class="glass border border-emerald-500/30 rounded-2xl p-4 mb-6 text-center text-emerald-400 font-bold text-sm max-w-3xl mx-auto">✅ {{ successMsg() }}</div>
      }

      <div class="grid lg:grid-cols-[1fr_minmax(0,380px)] gap-6 items-start">
        <!-- LEFT: builder sections -->
        <div class="space-y-4">

          <!-- SIZE -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('size')" [class]="secHead()">
              <span class="flex items-center gap-2">📏 Size <span class="text-white/40 font-normal text-[11px]">· {{ config.size }}</span></span>
              <span [class]="caret('size')">▾</span>
            </button>
            @if (isOpen('size')) {
              <div class="p-4 pt-0 grid grid-cols-3 sm:grid-cols-6 gap-2">
                @for (s of sizes; track s.label) {
                  <button (click)="config.size = s.label" [class]="chip(config.size === s.label)">
                    <span class="block text-lg">{{ s.emoji }}</span>
                    <span class="text-[10px] font-bold leading-tight">{{ s.label }}</span>
                  </button>
                }
              </div>
            }
          </section>

          <!-- CRUST -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('crust')" [class]="secHead()">
              <span class="flex items-center gap-2">🥖 Crust <span class="text-white/40 font-normal text-[11px]">· {{ config.crust }}</span></span>
              <span [class]="caret('crust')">▾</span>
            </button>
            @if (isOpen('crust')) {
              <div class="p-4 pt-0 flex flex-wrap gap-2">
                @for (c of crusts; track c.label) {
                  <button (click)="config.crust = c.label" [class]="pill(config.crust === c.label)">
                    {{ c.label }}@if (c.price) { <span class="text-[9px] text-orange-300 ml-0.5">+{{ c.price | currency }}</span> }
                  </button>
                }
              </div>
            }
          </section>

          <!-- SAUCE (multi) -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('sauce')" [class]="secHead()">
              <span class="flex items-center gap-2">🥫 Sauce <span class="text-white/40 font-normal text-[11px]">· {{ config.sauces.length || 'none' }}</span></span>
              <span [class]="caret('sauce')">▾</span>
            </button>
            @if (isOpen('sauce')) {
              <div class="p-4 pt-0 flex flex-wrap gap-2">
                @for (s of sauces; track s.label) {
                  <button (click)="toggle2(config.sauces, s.label)" [class]="pill(config.sauces.includes(s.label))">{{ s.label }}</button>
                }
              </div>
            }
          </section>

          <!-- CHEESE (multi) -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('cheese')" [class]="secHead()">
              <span class="flex items-center gap-2">🧀 Cheese <span class="text-white/40 font-normal text-[11px]">· {{ config.cheeses.length || 'none' }}</span></span>
              <span [class]="caret('cheese')">▾</span>
            </button>
            @if (isOpen('cheese')) {
              <div class="p-4 pt-0 flex flex-wrap gap-2">
                @for (c of cheeses; track c.label) {
                  <button (click)="toggle2(config.cheeses, c.label)" [class]="pill(config.cheeses.includes(c.label))">
                    {{ c.emoji }} {{ c.label }}@if (c.price) { <span class="text-[9px] text-orange-300 ml-0.5">+{{ c.price | currency }}</span> }
                  </button>
                }
              </div>
            }
          </section>

          <!-- TOPPING SEARCH + FILTER -->
          <section class="glass rounded-3xl p-4 space-y-3">
            <div class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <span class="text-white/40 text-sm">🔍</span>
              <input [(ngModel)]="searchTerm" (ngModelChange)="search.set($event)" placeholder="Search toppings…"
                class="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
              @if (search()) { <button (click)="clearSearch()" class="text-white/40 text-xs hover:text-white">✕</button> }
            </div>
            <div class="flex gap-1.5">
              @for (f of ['all','meats','veggies']; track f) {
                <button (click)="filter.set(f)" [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize transition ' + (filter() === f ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:text-white')">{{ f }}</button>
              }
            </div>
          </section>

          <!-- MEATS -->
          @if (filter() !== 'veggies') {
            <section class="glass rounded-3xl overflow-hidden">
              <button (click)="toggle('meats')" [class]="secHead()">
                <span class="flex items-center gap-2">🥓 Meats <span class="text-white/40 font-normal text-[11px]">· {{ config.meats.length }}</span></span>
                <span [class]="caret('meats')">▾</span>
              </button>
              @if (isOpen('meats')) {
                <div class="p-4 pt-0 flex flex-wrap gap-2">
                  @for (m of filtered(meats); track m.label) {
                    <button (click)="toggle2(config.meats, m.label)" [class]="pill(config.meats.includes(m.label))">
                      {{ m.emoji }} {{ m.label }}@if (m.price && m.price > standardMeat) { <span class="text-[9px] text-orange-300 ml-0.5">+</span> }
                    </button>
                  }
                  @if (filtered(meats).length === 0) { <p class="text-white/30 text-xs py-2">No meats match "{{ search() }}".</p> }
                </div>
              }
            </section>
          }

          <!-- VEGGIES -->
          @if (filter() !== 'meats') {
            <section class="glass rounded-3xl overflow-hidden">
              <button (click)="toggle('veggies')" [class]="secHead()">
                <span class="flex items-center gap-2">🥬 Vegetables <span class="text-white/40 font-normal text-[11px]">· {{ config.veggies.length }}</span></span>
                <span [class]="caret('veggies')">▾</span>
              </button>
              @if (isOpen('veggies')) {
                <div class="p-4 pt-0 flex flex-wrap gap-2">
                  @for (v of filtered(veggies); track v.label) {
                    <button (click)="toggle2(config.veggies, v.label)" [class]="pill(config.veggies.includes(v.label))">{{ v.emoji }} {{ v.label }}</button>
                  }
                  @if (filtered(veggies).length === 0) { <p class="text-white/30 text-xs py-2">No veggies match "{{ search() }}".</p> }
                </div>
              }
            </section>
          }

          <!-- SEASONINGS -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('seasonings')" [class]="secHead()">
              <span class="flex items-center gap-2">🧂 Seasonings <span class="text-white/40 font-normal text-[11px]">· {{ config.seasonings.length }}</span></span>
              <span [class]="caret('seasonings')">▾</span>
            </button>
            @if (isOpen('seasonings')) {
              <div class="p-4 pt-0 flex flex-wrap gap-2">
                @for (s of seasonings; track s.label) {
                  <button (click)="toggle2(config.seasonings, s.label)" [class]="pill(config.seasonings.includes(s.label))">{{ s.emoji }} {{ s.label }}</button>
                }
              </div>
            }
          </section>

          <!-- DIPS -->
          <section class="glass rounded-3xl overflow-hidden">
            <button (click)="toggle('dips')" [class]="secHead()">
              <span class="flex items-center gap-2">🫗 Extra Dips <span class="text-white/40 font-normal text-[11px]">· {{ config.dips.length }}</span></span>
              <span [class]="caret('dips')">▾</span>
            </button>
            @if (isOpen('dips')) {
              <div class="p-4 pt-0 flex flex-wrap gap-2">
                @for (d of dips; track d.label) {
                  <button (click)="toggle2(config.dips, d.label)" [class]="pill(config.dips.includes(d.label))">{{ d.label }} <span class="text-[9px] text-orange-300">+{{ dipPrice | currency }}</span></button>
                }
              </div>
            }
          </section>

          <!-- PLACEMENT & QUANTITY (only for selected proteins/veggies) -->
          @if (customizable().length > 0) {
            <section class="glass rounded-3xl overflow-hidden">
              <button (click)="toggle('custom')" [class]="secHead()">
                <span class="flex items-center gap-2">🎯 Placement & Amount <span class="text-white/40 font-normal text-[11px]">· {{ customizable().length }} toppings</span></span>
                <span [class]="caret('custom')">▾</span>
              </button>
              @if (isOpen('custom')) {
                <div class="p-4 pt-0 space-y-2.5">
                  @for (t of customizable(); track t) {
                    <div class="bg-white/5 rounded-2xl px-3 py-2.5 space-y-2">
                      <span class="text-xs font-bold text-white">{{ emojiFor(t) }} {{ t }}</span>
                      <div class="flex flex-wrap items-center gap-1.5">
                        @for (p of placements; track p.val) {
                          <button (click)="setPlacement(t, p.val)" [class]="miniChip(placementOf(t) === p.val)">{{ p.label }}</button>
                        }
                        <span class="w-px h-5 bg-white/10 mx-1"></span>
                        <button (click)="toggleExtra(t)" [class]="miniChip(isExtra(t))">
                          {{ isExtra(t) ? '☑' : '☐' }} Extra
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          }
        </div>

        <!-- RIGHT: live preview + price + actions -->
        <div class="lg:sticky lg:top-6 space-y-4">
          <div class="glass rounded-[28px] p-6 flex flex-col items-center">
            <!-- Preview placeholder (visual preview coming soon) -->
            <div class="w-full aspect-square max-w-[260px] rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] flex flex-col items-center justify-center text-center gap-2 mb-4">
              <span class="text-4xl opacity-30">🍕</span>
              <p class="text-white/50 font-bold text-sm">Pizza Preview Coming Soon</p>
              <p class="text-white/30 text-[11px] px-6">A visual preview of your pizza will appear here.</p>
            </div>
            <p class="text-white font-black text-lg text-center">{{ config.size }} · {{ config.crust }}</p>
            <p class="text-white/50 text-xs mb-0.5 text-center">{{ config.sauces.length ? config.sauces.join(', ') : 'No sauce' }}</p>
            <p class="text-white/40 text-[11px]">{{ toppingCount() }} topping{{ toppingCount() !== 1 ? 's' : '' }}</p>

            <div class="w-full mt-5 pt-4 border-t border-white/10 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] text-white/50">
                <span>Base ({{ config.size }} · {{ config.crust }})</span><span>{{ basePrice() | currency }}</span>
              </div>
              @if (toppingsPrice() > 0) {
                <div class="flex items-center justify-between text-[11px] text-white/50">
                  <span>Toppings & extras</span><span>+{{ toppingsPrice() | currency }}</span>
                </div>
              }
              <div class="flex items-center justify-between pt-1.5 border-t border-white/10">
                <span class="text-white/70 text-sm font-bold">Est. total</span>
                <span class="text-2xl font-black text-orange-400">{{ price() | currency }}</span>
              </div>
              <p class="text-[10px] text-white/30 text-center pt-1">Final price varies by restaurant</p>
            </div>
          </div>

          <button (click)="findRestaurants()"
            class="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-orange-400 transition flex items-center justify-center gap-2">
            🔎 Find Restaurants That Can Make This
          </button>

          <div class="grid grid-cols-2 gap-3">
            <button (click)="saveFavorite()" class="py-3 rounded-2xl font-bold text-white text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">💾 Save</button>
            <button (click)="duplicatePrevious()" [disabled]="!hasPrevious()" class="py-3 rounded-2xl font-bold text-white text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed">⧉ Duplicate Last</button>
          </div>
          <button (click)="reset()" class="w-full py-3 rounded-2xl font-bold text-white/60 text-sm bg-transparent border border-white/10 hover:bg-white/5 hover:text-white transition">↺ Reset Pizza</button>
        </div>
      </div>
    </div>
  `,
})
export class BuilderComponent {
  private readonly router = inject(Router);

  // ---- Catalogs ----
  readonly standardMeat = 1.75;
  readonly dipPrice = 0.79;

  sizes: Ing[] = [
    { label: 'Personal', emoji: '🍕' }, { label: 'Small', emoji: '🍕' }, { label: 'Medium', emoji: '🍕' },
    { label: 'Large', emoji: '🍕' }, { label: 'Extra Large', emoji: '🍕' }, { label: 'Party', emoji: '🎉' },
  ];
  crusts: Ing[] = [
    { label: 'Hand Tossed', emoji: '' }, { label: 'Thin Crust', emoji: '' }, { label: 'New York Style', emoji: '' },
    { label: 'Pan Pizza', emoji: '', price: 1.0 }, { label: 'Deep Dish', emoji: '', price: 1.5 },
    { label: 'Stuffed Crust', emoji: '', price: 2.5 }, { label: 'Gluten-Free', emoji: '', price: 2.0 },
    { label: 'Cauliflower Crust', emoji: '', price: 2.5 }, { label: 'Whole Wheat', emoji: '' },
    { label: 'Brooklyn Style', emoji: '' }, { label: 'Tavern Style', emoji: '' }, { label: 'Flatbread', emoji: '' },
  ];
  sauces: Ing[] = [
    { label: 'Classic Tomato', emoji: '' }, { label: 'Marinara', emoji: '' }, { label: 'Robust Inspired Tomato', emoji: '' },
    { label: 'Garlic Parmesan', emoji: '' }, { label: 'Alfredo', emoji: '' }, { label: 'BBQ', emoji: '' },
    { label: 'Buffalo', emoji: '' }, { label: 'Ranch', emoji: '' }, { label: 'Pesto', emoji: '' },
    { label: 'Olive Oil', emoji: '' }, { label: 'White Garlic Sauce', emoji: '' }, { label: 'Spicy Tomato', emoji: '' },
    { label: 'Vodka Sauce', emoji: '' }, { label: 'Honey BBQ', emoji: '' }, { label: 'Chipotle', emoji: '' }, { label: 'No Sauce', emoji: '' },
  ];
  cheeses: Ing[] = [
    { label: 'Mozzarella', emoji: '🧀' }, { label: 'Fresh Mozzarella', emoji: '🧀', price: 1.75 }, { label: 'Provolone', emoji: '🧀' },
    { label: 'Cheddar', emoji: '🧀' }, { label: 'Parmesan', emoji: '🧀' }, { label: 'Romano', emoji: '🧀' },
    { label: 'Asiago', emoji: '🧀' }, { label: 'Ricotta', emoji: '🧀', price: 1.5 }, { label: 'Feta', emoji: '🧀', price: 1.5 },
    { label: 'Goat Cheese', emoji: '🧀', price: 1.75 }, { label: 'Vegan Cheese', emoji: '🌱', price: 1.75 },
    { label: 'Extra Cheese', emoji: '🧀', price: 1.5 }, { label: 'Light Cheese', emoji: '🧀' }, { label: 'No Cheese', emoji: '🚫' },
  ];
  meats: Ing[] = [
    { label: 'Pepperoni', emoji: '🔴', price: 1.75 }, { label: 'Old World Pepperoni', emoji: '🔴', price: 2.0 },
    { label: 'Sausage', emoji: '🌭', price: 1.75 }, { label: 'Italian Sausage', emoji: '🌭', price: 1.75 },
    { label: 'Beef', emoji: '🥩', price: 1.75 }, { label: 'Ham', emoji: '🍖', price: 1.75 },
    { label: 'Bacon', emoji: '🥓', price: 2.0 }, { label: 'Canadian Bacon', emoji: '🥓', price: 2.0 },
    { label: 'Chicken', emoji: '🍗', price: 2.0 }, { label: 'Grilled Chicken', emoji: '🍗', price: 2.5 },
    { label: 'Buffalo Chicken', emoji: '🍗', price: 2.5 }, { label: 'Steak', emoji: '🥩', price: 2.5 },
    { label: 'Meatballs', emoji: '🧆', price: 2.25 }, { label: 'Salami', emoji: '🔴', price: 2.0 },
    { label: 'Prosciutto', emoji: '🥓', price: 2.75 }, { label: 'Chorizo', emoji: '🌭', price: 2.25 },
    { label: 'Anchovies', emoji: '🐟', price: 2.0 },
  ];
  veggies: Ing[] = [
    { label: 'Mushrooms', emoji: '🍄', price: 1.25 }, { label: 'Onions', emoji: '🧅', price: 1.25 },
    { label: 'Red Onions', emoji: '🧅', price: 1.25 }, { label: 'Green Peppers', emoji: '🫑', price: 1.25 },
    { label: 'Bell Peppers', emoji: '🫑', price: 1.25 }, { label: 'Banana Peppers', emoji: '🌶️', price: 1.25 },
    { label: 'Jalapeños', emoji: '🌶️', price: 1.25 }, { label: 'Tomatoes', emoji: '🍅', price: 1.25 },
    { label: 'Cherry Tomatoes', emoji: '🍅', price: 1.25 }, { label: 'Black Olives', emoji: '🫒', price: 1.25 },
    { label: 'Green Olives', emoji: '🫒', price: 1.25 }, { label: 'Spinach', emoji: '🥬', price: 1.25 },
    { label: 'Basil', emoji: '🌿', price: 1.0 }, { label: 'Garlic', emoji: '🧄', price: 1.0 },
    { label: 'Roasted Garlic', emoji: '🧄', price: 1.5 }, { label: 'Broccoli', emoji: '🥦', price: 1.25 },
    { label: 'Artichokes', emoji: '🌱', price: 1.75 }, { label: 'Pineapple', emoji: '🍍', price: 1.5 },
    { label: 'Corn', emoji: '🌽', price: 1.25 }, { label: 'Sun-Dried Tomatoes', emoji: '🍅', price: 1.75 },
    { label: 'Roasted Red Peppers', emoji: '🫑', price: 1.75 },
  ];
  seasonings: Ing[] = [
    { label: 'Parmesan Sprinkle', emoji: '🧀' }, { label: 'Oregano', emoji: '🌿' }, { label: 'Basil', emoji: '🌿' },
    { label: 'Crushed Red Pepper', emoji: '🌶️' }, { label: 'Italian Seasoning', emoji: '🌿' }, { label: 'Garlic Butter', emoji: '🧈' },
    { label: 'Garlic Herb', emoji: '🧄' }, { label: 'Butter', emoji: '🧈' }, { label: 'Cajun Seasoning', emoji: '🌶️' },
    { label: 'Black Pepper', emoji: '⚫' }, { label: 'Chili Flakes', emoji: '🌶️' }, { label: 'Sesame Seeds', emoji: '⚪' },
    { label: 'Everything Bagel', emoji: '🥯' }, { label: 'Hot Honey Drizzle', emoji: '🍯' }, { label: 'Truffle Oil', emoji: '🫗' },
  ];
  dips: Ing[] = [
    { label: 'Ranch', emoji: '' }, { label: 'Garlic Sauce', emoji: '' }, { label: 'Marinara', emoji: '' },
    { label: 'Blue Cheese', emoji: '' }, { label: 'Buffalo Sauce', emoji: '' }, { label: 'BBQ Sauce', emoji: '' },
    { label: 'Honey Mustard', emoji: '' }, { label: 'Chipotle Ranch', emoji: '' }, { label: 'Sweet Chili', emoji: '' }, { label: 'Hot Sauce', emoji: '' },
  ];

  placements = [
    { val: 'whole' as Placement, label: 'Whole Pizza' },
    { val: 'left' as Placement, label: 'Left Half' },
    { val: 'right' as Placement, label: 'Right Half' },
  ];

  private readonly baseBySize: Record<string, number> = {
    Personal: 6.99, Small: 8.99, Medium: 11.99, Large: 14.99, 'Extra Large': 17.99, Party: 24.99,
  };
  // ---- State ----
  config: BuildConfig = this.blank();
  private openSet = signal<Set<string>>(new Set(['size', 'crust', 'sauce', 'cheese', 'meats', 'veggies']));
  search = signal('');
  searchTerm = '';
  filter = signal('all');
  successMsg = signal('');

  private readonly ingIndex = new Map<string, Ing>();
  constructor() {
    [...this.cheeses, ...this.meats, ...this.veggies, ...this.seasonings].forEach(i => this.ingIndex.set(i.label, i));
  }

  private blank(): BuildConfig {
    return {
      size: 'Large', crust: 'Hand Tossed', sauces: ['Classic Tomato'], cheeses: ['Mozzarella'],
      meats: ['Pepperoni'], veggies: [], seasonings: [], dips: [], placement: {}, extras: [],
    };
  }

  // ---- Section open/close ----
  isOpen(id: string): boolean { return this.openSet().has(id); }
  toggle(id: string): void {
    const next = new Set(this.openSet());
    next.has(id) ? next.delete(id) : next.add(id);
    this.openSet.set(next);
  }
  caret(id: string): string {
    return `text-white/40 text-xs transition-transform duration-200 ${this.isOpen(id) ? '' : '-rotate-90'}`;
  }

  // ---- Selection helpers ----
  toggle2(list: string[], item: string): void {
    const i = list.indexOf(item);
    if (i > -1) list.splice(i, 1); else list.push(item);
    this.successMsg.set('');
  }

  filtered(list: Ing[]): Ing[] {
    const q = this.search().trim().toLowerCase();
    if (!q) return list;
    return list.filter(i => i.label.toLowerCase().includes(q));
  }
  clearSearch(): void { this.search.set(''); this.searchTerm = ''; }

  customizable = computed(() => [...this.config.meats, ...this.config.veggies]);
  toppingCount(): number { return this.config.meats.length + this.config.veggies.length; }

  placementOf(t: string): Placement { return this.config.placement[t] ?? 'whole'; }
  setPlacement(t: string, p: Placement): void { this.config.placement = { ...this.config.placement, [t]: p }; }
  isExtra(t: string): boolean { return this.config.extras.includes(t); }
  toggleExtra(t: string): void {
    const i = this.config.extras.indexOf(t);
    if (i > -1) this.config.extras.splice(i, 1); else this.config.extras.push(t);
  }

  emojiFor(t: string): string { return this.ingIndex.get(t)?.emoji || '•'; }

  // ---- Pricing ----
  private amountMult(t: string): number { return this.isExtra(t) ? 1.5 : 1; }
  basePrice(): number {
    const crust = this.crusts.find(c => c.label === this.config.crust);
    return (this.baseBySize[this.config.size] ?? 12.99) + (crust?.price ?? 0);
  }
  toppingsPrice(): number {
    let sum = 0;
    for (const m of this.config.meats) sum += (this.ingIndex.get(m)?.price ?? this.standardMeat) * this.amountMult(m);
    for (const v of this.config.veggies) sum += (this.ingIndex.get(v)?.price ?? 1.25) * this.amountMult(v);
    for (const c of this.config.cheeses) sum += (this.ingIndex.get(c)?.price ?? 0);
    sum += this.config.dips.length * this.dipPrice;
    return sum;
  }
  price(): number { return this.basePrice() + this.toppingsPrice(); }

  // ---- Progress ----
  progress(): number {
    const steps = [
      !!this.config.size, !!this.config.crust, this.config.sauces.length > 0,
      this.config.cheeses.length > 0, this.toppingCount() > 0,
    ];
    return Math.round((steps.filter(Boolean).length / steps.length) * 100);
  }

  // ---- Actions ----
  findRestaurants(): void {
    const toppings = [
      ...this.config.meats, ...this.config.veggies,
      ...this.config.cheeses.filter(c => c !== 'Mozzarella' && c !== 'No Cheese'),
    ];
    localStorage.setItem('mislice_current_build', JSON.stringify(this.config));
    this.router.navigate(['/compare'], {
      queryParams: { size: this.config.size, crust: this.config.crust, toppings: toppings.join(',') },
    });
  }

  saveFavorite(): void {
    const name = prompt('Name your creation:', 'My Custom Pizza');
    if (name === null) return;
    try {
      const raw = localStorage.getItem('mislice_saved_pizzas');
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        id: Date.now().toString(),
        name: name.trim() || 'My Custom Pizza',
        size: this.config.size,
        crust: this.config.crust,
        toppings: [...this.config.meats, ...this.config.veggies],
        config: this.config,
      });
      localStorage.setItem('mislice_saved_pizzas', JSON.stringify(list));
      localStorage.setItem('mislice_last_build', JSON.stringify(this.config));
      this.successMsg.set('Saved to Favourites — reorder it anytime from the Favourites page.');
    } catch { this.successMsg.set(''); }
  }

  hasPrevious(): boolean {
    return !!(localStorage.getItem('mislice_last_build') || localStorage.getItem('mislice_saved_pizzas'));
  }
  duplicatePrevious(): void {
    try {
      let prev = localStorage.getItem('mislice_last_build');
      if (!prev) {
        const raw = localStorage.getItem('mislice_saved_pizzas');
        const list = raw ? JSON.parse(raw) : [];
        if (list.length) prev = JSON.stringify(list[list.length - 1].config ?? null);
      }
      if (!prev || prev === 'null') { this.successMsg.set(''); return; }
      const cfg = JSON.parse(prev) as BuildConfig;
      this.config = { ...this.blank(), ...cfg, placement: cfg.placement ?? {}, extras: cfg.extras ?? [] };
      this.successMsg.set('Loaded your previous build.');
    } catch { this.successMsg.set(''); }
  }

  reset(): void { this.config = this.blank(); this.successMsg.set(''); this.clearSearch(); }

  // ---- Class helpers ----
  secHead(): string {
    return 'w-full flex items-center justify-between px-5 py-4 text-sm font-black text-white';
  }
  chip(active: boolean): string {
    return `text-center rounded-2xl py-3 transition ${active
      ? 'bg-red-600/25 border border-red-500/50 text-white'
      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`;
  }
  pill(active: boolean): string {
    return `px-3.5 py-2 rounded-xl text-xs font-bold transition ${active
      ? 'bg-red-600 text-white'
      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`;
  }
  miniChip(active: boolean): string {
    return `px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${active
      ? 'bg-red-600 text-white'
      : 'bg-black/30 text-white/50 hover:text-white'}`;
  }
}
