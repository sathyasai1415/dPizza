import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { PaymentMethodService } from '../../core/services/payment-method.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { UserProfile, Address, OrderDto, PaymentMethodDto, LoyaltyAccountDto } from '../../shared/models';

type Section = 'overview' | 'personal' | 'addresses' | 'payment' | 'security' | 'notifications' | 'preferences' | 'privacy' | 'support';

interface Toast { type: 'success' | 'error'; message: string; }
interface ConfirmState { message: string; onConfirm: () => void; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto py-6 px-4 space-y-6" style="background:#FAFAFA">

      <!-- HEADER -->
      <div class="rounded-2xl p-6 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold" style="color:#1C1C1C">My Account</h2>
          <p class="text-sm mt-0.5" style="color:#696969">Manage your profile, addresses, payments, and preferences.</p>
        </div>
      </div>

      @if (loadingProfile()) {
        <!-- SKELETON -->
        <div class="rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-6 animate-pulse space-y-4">
          <div class="h-16 w-16 rounded-full bg-neutral-200"></div>
          <div class="h-4 w-40 rounded bg-neutral-200"></div>
          <div class="h-4 w-64 rounded bg-neutral-200"></div>
          <div class="h-4 w-56 rounded bg-neutral-200"></div>
        </div>
      } @else {

      <!-- MAIN LAYOUT -->
      <div class="rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div class="grid md:grid-cols-[220px_1fr]">

          <!-- LEFT SUB-NAV -->
          <nav class="md:border-r p-3 space-y-1" style="border-color:#EFEFEF">
            @for (s of sections; track s.id) {
              <button (click)="section.set(s.id)"
                [class]="'w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-medium transition flex items-center gap-2.5 ' +
                  (section() === s.id ? 'font-semibold' : 'hover:bg-black/[0.03]')"
                [style]="section() === s.id ? 'background:#FFF2F3;color:#E23744' : 'color:#1C1C1C'">
                <span>{{ s.icon }}</span> {{ s.label }}
              </button>
            }
          </nav>

          <!-- CONTENT -->
          <div class="p-5 sm:p-8 min-h-[540px]">

            <!-- ============ OVERVIEW: Rewards + Order Stats ============ -->
            @if (section() === 'overview') {
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center">
                    @if (avatarPreview() || user()?.avatarUrl) {
                      <img [src]="avatarPreview() || user()?.avatarUrl" class="w-full h-full object-cover" alt="avatar" />
                    } @else {
                      <span class="text-2xl font-bold" style="color:#BDBDBD">{{ (fullName || 'U').charAt(0).toUpperCase() }}</span>
                    }
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold" style="color:#1C1C1C">{{ fullName || 'Customer' }}</h3>
                    <p class="text-[13px]" style="color:#828282">{{ user()?.email }}</p>
                  </div>
                </div>

                <!-- Rewards Summary -->
                <div class="rounded-2xl p-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]" style="background:linear-gradient(135deg,#E23744 0%,#F05563 100%)">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-widest opacity-80">MiPoints Balance</p>
                      <p class="text-3xl font-bold mt-1">{{ loyalty()?.points ?? 0 }}</p>
                    </div>
                    <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20">{{ membershipTier() }}</span>
                  </div>
                  <div class="flex items-center gap-6 mt-4 text-[12px] opacity-90">
                    <span>Lifetime: <strong>{{ loyalty()?.lifetimePoints ?? 0 }}</strong> pts</span>
                    <span>Available rewards: <strong>{{ availableRewards() }}</strong></span>
                  </div>
                  <button routerLink="/rewards" (click)="goRewards()" class="mt-4 text-[12px] font-semibold px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition">View Rewards →</button>
                </div>

                <!-- Order Statistics -->
                <div>
                  <h4 class="text-sm font-semibold mb-3" style="color:#1C1C1C">Order Statistics</h4>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-xl font-bold" style="color:#1C1C1C">{{ orderStats().totalOrders }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Total Orders</p>
                    </div>
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-xl font-bold" style="color:#1C1C1C">{{ orderStats().totalSaved | currency }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Total Saved</p>
                    </div>
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-xl font-bold" style="color:#1C1C1C">{{ orderStats().avgOrderValue | currency }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Avg Order Value</p>
                    </div>
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-sm font-bold truncate" style="color:#1C1C1C">{{ orderStats().favoritePizza || '—' }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Favorite Pizza</p>
                    </div>
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-sm font-bold truncate" style="color:#1C1C1C">{{ orderStats().favoriteRestaurant || '—' }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Favorite Restaurant</p>
                    </div>
                    <div class="rounded-xl p-4" style="background:#F8F8F8">
                      <p class="text-sm font-bold" style="color:#1C1C1C">{{ orderStats().lastOrderDate || '—' }}</p>
                      <p class="text-[11px] mt-0.5" style="color:#828282">Last Order</p>
                    </div>
                  </div>
                  <p class="text-[11px] mt-2" style="color:#BDBDBD">Member since {{ memberSince() }}</p>
                </div>
              </div>
            }

            <!-- ============ PERSONAL INFO ============ -->
            @if (section() === 'personal') {
              <div class="max-w-lg space-y-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-bold" style="color:#1C1C1C">Personal Information</h2>
                    <p class="text-[13px] mt-0.5" style="color:#696969">Your basic account details.</p>
                  </div>
                  @if (!editingPersonal()) {
                    <button (click)="startEditPersonal()" class="text-[13px] font-semibold px-4 py-2 rounded-xl border transition" style="border-color:#E23744;color:#E23744">Edit Profile</button>
                  }
                </div>

                <!-- Avatar -->
                <div class="flex items-center gap-4">
                  <div class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center">
                    @if (avatarPreview() || user()?.avatarUrl) {
                      <img [src]="avatarPreview() || user()?.avatarUrl" class="w-full h-full object-cover" alt="avatar" />
                    } @else {
                      <span class="text-2xl font-bold" style="color:#BDBDBD">{{ (fullName || 'U').charAt(0).toUpperCase() }}</span>
                    }
                  </div>
                  @if (editingPersonal()) {
                    <div>
                      <input #fileInput type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />
                      <button (click)="fileInput.click()" class="text-[12px] font-semibold px-3.5 py-2 rounded-lg" style="background:#F8F8F8;color:#1C1C1C">Change photo</button>
                    </div>
                  }
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Full Name</label>
                    <input [(ngModel)]="fullName" [disabled]="!editingPersonal()"
                      class="w-full rounded-xl px-4 py-3 text-sm border outline-none transition disabled:bg-neutral-50 disabled:text-neutral-400"
                      [style]="editingPersonal() ? 'border-color:#BDBDBD;color:#1C1C1C' : 'border-color:#EFEFEF'" />
                    @if (editingPersonal() && !fullName.trim()) { <p class="text-[11px] mt-1" style="color:#E23744">Full name is required.</p> }
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Email Address</label>
                    <input [value]="user()?.email" disabled class="w-full rounded-xl px-4 py-3 text-sm border bg-neutral-50 text-neutral-400" style="border-color:#EFEFEF" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Phone Number</label>
                    <input [(ngModel)]="phone" [disabled]="!editingPersonal()" placeholder="e.g. 313-555-0199"
                      class="w-full rounded-xl px-4 py-3 text-sm border outline-none transition disabled:bg-neutral-50 disabled:text-neutral-400"
                      [style]="editingPersonal() ? 'border-color:#BDBDBD;color:#1C1C1C' : 'border-color:#EFEFEF'" />
                    @if (editingPersonal() && phone && !phoneValid()) { <p class="text-[11px] mt-1" style="color:#E23744">Enter a valid phone number.</p> }
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Date Joined MiSlice</label>
                    <input [value]="memberSince()" disabled class="w-full rounded-xl px-4 py-3 text-sm border bg-neutral-50 text-neutral-400" style="border-color:#EFEFEF" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Preferred Language</label>
                      <select [(ngModel)]="preferredLanguage" [disabled]="!editingPersonal()"
                        class="w-full rounded-xl px-3 py-3 text-sm border outline-none disabled:bg-neutral-50 disabled:text-neutral-400" style="border-color:#EFEFEF">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Time Zone</label>
                      <select [(ngModel)]="timeZone" [disabled]="!editingPersonal()"
                        class="w-full rounded-xl px-3 py-3 text-sm border outline-none disabled:bg-neutral-50 disabled:text-neutral-400" style="border-color:#EFEFEF">
                        @for (tz of timeZones; track tz) { <option [value]="tz">{{ tz }}</option> }
                      </select>
                    </div>
                  </div>
                </div>

                @if (editingPersonal()) {
                  <div class="flex gap-3">
                    <button (click)="savePersonal()" [disabled]="saving() || !fullName.trim() || (!!phone && !phoneValid())"
                      class="flex-1 py-3 rounded-xl font-semibold text-white text-sm shadow-sm transition disabled:opacity-50" style="background:#E23744">
                      {{ saving() ? 'Saving…' : 'Save Changes' }}
                    </button>
                    <button (click)="cancelEditPersonal()" class="flex-1 py-3 rounded-xl font-semibold text-sm border" style="border-color:#EFEFEF;color:#696969">Cancel</button>
                  </div>
                }
              </div>
            }

            <!-- ============ SAVED ADDRESSES ============ -->
            @if (section() === 'addresses') {
              <div class="max-w-2xl space-y-5">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-bold" style="color:#1C1C1C">Saved Addresses</h2>
                    <p class="text-[13px] mt-0.5" style="color:#696969">Manage your delivery addresses.</p>
                  </div>
                  <button (click)="startAddAddress()" class="text-[13px] font-semibold px-4 py-2 rounded-xl text-white" style="background:#FF8A00">+ Add New Address</button>
                </div>

                @if (addressForm()) {
                  <div class="rounded-2xl p-5 space-y-3" style="background:#F8F8F8">
                    <div class="grid grid-cols-2 gap-3">
                      <input [(ngModel)]="addressForm()!.label" placeholder="Label (Home, Work…)" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                      <input [(ngModel)]="addressForm()!.line2" placeholder="Apartment / Suite #" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    </div>
                    <input [(ngModel)]="addressForm()!.line1" placeholder="Street address" class="w-full rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    <div class="grid grid-cols-3 gap-3">
                      <input [(ngModel)]="addressForm()!.city" placeholder="City" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                      <input [(ngModel)]="addressForm()!.state" placeholder="State" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                      <input [(ngModel)]="addressForm()!.postalCode" placeholder="ZIP" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    </div>
                    <input [(ngModel)]="addressForm()!.deliveryInstructions" placeholder="Delivery instructions (optional)" class="w-full rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    <div class="grid grid-cols-2 gap-3">
                      <input [(ngModel)]="addressForm()!.contactName" placeholder="Contact name" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                      <input [(ngModel)]="addressForm()!.contactPhone" placeholder="Contact phone" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    </div>
                    <div class="flex gap-3 pt-1">
                      <button (click)="saveAddress()" [disabled]="!addressFormValid()" class="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style="background:#E23744">Save Address</button>
                      <button (click)="addressForm.set(null)" class="px-5 py-2.5 rounded-xl text-sm font-semibold" style="color:#696969">Cancel</button>
                    </div>
                  </div>
                }

                @if (!loadingAddresses() && addresses().length === 0 && !addressForm()) {
                  <p class="text-sm text-center py-10" style="color:#828282">No saved addresses yet.</p>
                }

                <div class="space-y-3">
                  @for (a of addresses(); track a.id) {
                    <div class="rounded-2xl p-4 flex items-start justify-between gap-3" style="background:#F8F8F8">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-semibold" style="color:#1C1C1C">{{ a.label }}</span>
                          @if (a.defaultAddress) { <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style="background:#FF8A00">Default</span> }
                        </div>
                        <p class="text-[13px] mt-1" style="color:#696969">{{ a.line1 }}{{ a.line2 ? ', ' + a.line2 : '' }}, {{ a.city }}, {{ a.state }} {{ a.postalCode }}</p>
                        @if (a.deliveryInstructions) { <p class="text-[12px] mt-1" style="color:#828282">📝 {{ a.deliveryInstructions }}</p> }
                        @if (a.contactName) { <p class="text-[12px]" style="color:#828282">👤 {{ a.contactName }} {{ a.contactPhone ? '· ' + a.contactPhone : '' }}</p> }
                      </div>
                      <div class="flex flex-col gap-1.5 shrink-0 items-end">
                        <button (click)="startEditAddress(a)" class="text-[11px] font-semibold" style="color:#1C1C1C">Edit</button>
                        @if (!a.defaultAddress) { <button (click)="setDefaultAddress(a)" class="text-[11px] font-semibold" style="color:#FF8A00">Set Default</button> }
                        <button (click)="confirmDeleteAddress(a)" class="text-[11px] font-semibold" style="color:#E23744">Delete</button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- ============ PAYMENT METHODS ============ -->
            @if (section() === 'payment') {
              <div class="max-w-lg space-y-5">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-bold" style="color:#1C1C1C">Payment Methods</h2>
                    <p class="text-[13px] mt-0.5" style="color:#696969">Cards are tokenized — full numbers are never stored.</p>
                  </div>
                  <button (click)="showAddCard.set(!showAddCard())" class="text-[13px] font-semibold px-4 py-2 rounded-xl text-white" style="background:#FF8A00">+ Add New Card</button>
                </div>

                @if (showAddCard()) {
                  <div class="rounded-2xl p-5 space-y-3" style="background:#F8F8F8">
                    <div class="grid grid-cols-2 gap-3">
                      <select [(ngModel)]="newCard.brand" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF">
                        <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
                      </select>
                      <input [(ngModel)]="newCard.last4" maxlength="4" placeholder="Last 4 digits" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <input type="number" [(ngModel)]="newCard.expMonth" placeholder="Exp. month" min="1" max="12" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                      <input type="number" [(ngModel)]="newCard.expYear" placeholder="Exp. year" min="2024" class="rounded-xl px-3 py-2.5 text-sm border" style="border-color:#EFEFEF" />
                    </div>
                    <p class="text-[11px]" style="color:#BDBDBD">Demo only — this stores masked card metadata for display; it does not process real payments.</p>
                    <div class="flex gap-3">
                      <button (click)="addCard()" [disabled]="newCard.last4.length !== 4" class="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style="background:#E23744">Save Card</button>
                      <button (click)="showAddCard.set(false)" class="px-5 py-2.5 rounded-xl text-sm font-semibold" style="color:#696969">Cancel</button>
                    </div>
                  </div>
                }

                @if (!loadingCards() && cards().length === 0 && !showAddCard()) {
                  <p class="text-sm text-center py-10" style="color:#828282">No saved payment methods.</p>
                }

                <div class="space-y-3">
                  @for (c of cards(); track c.id) {
                    <div class="rounded-2xl p-4 flex items-center justify-between" style="background:#F8F8F8">
                      <div class="flex items-center gap-3">
                        <span class="text-xl">{{ cardIcon(c.brand) }}</span>
                        <div>
                          <p class="text-sm font-semibold" style="color:#1C1C1C">{{ c.brand }} •••• {{ c.last4 }}</p>
                          <p class="text-[12px]" style="color:#828282">Expires {{ c.expMonth.toString().padStart(2,'0') }}/{{ c.expYear.toString().slice(-2) }}</p>
                        </div>
                        @if (c.isDefault) { <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style="background:#FF8A00">Default</span> }
                      </div>
                      <div class="flex gap-3 shrink-0">
                        @if (!c.isDefault) { <button (click)="setDefaultCard(c)" class="text-[11px] font-semibold" style="color:#FF8A00">Set Default</button> }
                        <button (click)="confirmDeleteCard(c)" class="text-[11px] font-semibold" style="color:#E23744">Remove</button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- ============ SECURITY ============ -->
            @if (section() === 'security') {
              <div class="max-w-md space-y-5">
                <div>
                  <h2 class="text-xl font-bold" style="color:#1C1C1C">Security</h2>
                  <p class="text-[13px] mt-0.5" style="color:#696969">Change your account password.</p>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Current Password</label>
                    <input type="password" [(ngModel)]="currentPassword" class="w-full rounded-xl px-4 py-3 text-sm border" style="border-color:#EFEFEF" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">New Password</label>
                    <input type="password" [(ngModel)]="newPassword" class="w-full rounded-xl px-4 py-3 text-sm border" style="border-color:#EFEFEF" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style="color:#828282">Confirm New Password</label>
                    <input type="password" [(ngModel)]="confirmPassword" class="w-full rounded-xl px-4 py-3 text-sm border" style="border-color:#EFEFEF" />
                  </div>
                  @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                    <p class="text-[11px]" style="color:#E23744">Passwords do not match.</p>
                  }
                </div>
                <button (click)="updatePassword()" [disabled]="!canChangePassword() || changingPassword()"
                  class="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style="background:#E23744">
                  {{ changingPassword() ? 'Updating…' : 'Update Password' }}
                </button>
              </div>
            }

            <!-- ============ NOTIFICATIONS ============ -->
            @if (section() === 'notifications') {
              <div class="max-w-md space-y-5">
                <div>
                  <h2 class="text-xl font-bold" style="color:#1C1C1C">Notifications</h2>
                  <p class="text-[13px] mt-0.5" style="color:#696969">Choose what MiSlice can notify you about.</p>
                </div>
                <div class="space-y-1">
                  @for (n of notifOptions; track n.key) {
                    <div class="flex items-center justify-between py-2.5 border-b" style="border-color:#EFEFEF">
                      <span class="text-sm" style="color:#1C1C1C">{{ n.label }}</span>
                      <button (click)="toggleNotif(n.key)" [style]="'background:' + (notifPrefs.includes(n.key) ? '#E23744' : '#EFEFEF')" class="w-11 h-6 rounded-full relative transition">
                        <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow" [style.left]="notifPrefs.includes(n.key) ? '22px' : '2px'"></span>
                      </button>
                    </div>
                  }
                </div>
                <button (click)="saveNotifications()" [disabled]="saving()" class="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style="background:#E23744">
                  {{ saving() ? 'Saving…' : 'Save Preferences' }}
                </button>
              </div>
            }

            <!-- ============ PREFERENCES ============ -->
            @if (section() === 'preferences') {
              <div class="max-w-lg space-y-6">
                <div>
                  <h2 class="text-xl font-bold" style="color:#1C1C1C">Preferences</h2>
                  <p class="text-[13px] mt-0.5" style="color:#696969">Personalize your MiSlice experience.</p>
                </div>

                <div>
                  <h3 class="text-[11px] font-semibold uppercase tracking-wide mb-2" style="color:#828282">Dietary Preferences</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (d of diets; track d.key) {
                      <button (click)="toggleDiet(d.key)"
                        [style]="getDietState(d.key) ? 'background:#E23744;color:#fff' : 'background:#F8F8F8;color:#1C1C1C'"
                        class="px-4 py-2 rounded-xl text-[13px] font-medium transition">{{ d.emoji }} {{ d.label }}</button>
                    }
                  </div>
                </div>

                <div>
                  <h3 class="text-[11px] font-semibold uppercase tracking-wide mb-2" style="color:#828282">Default Fulfillment Method</h3>
                  <div class="flex gap-2">
                    @for (f of fulfillmentOptions; track f) {
                      <button (click)="setDefaultFulfillment(f)"
                        [style]="defaultFulfillment === f ? 'background:#FF8A00;color:#fff' : 'background:#F8F8F8;color:#1C1C1C'"
                        class="px-4 py-2 rounded-xl text-[13px] font-medium transition">{{ f === 'DELIVERY' ? '🛵 Delivery' : '🏬 Pickup' }}</button>
                    }
                  </div>
                </div>

                <div>
                  <h3 class="text-[11px] font-semibold uppercase tracking-wide mb-2" style="color:#828282">Favorite Restaurants</h3>
                  @if (favoriteRestaurants().length === 0) {
                    <p class="text-[13px]" style="color:#828282">No favorite restaurants yet — heart a store to see it here.</p>
                  } @else {
                    <div class="flex flex-wrap gap-2">
                      @for (r of favoriteRestaurants(); track r) { <span class="px-3 py-1.5 rounded-lg text-[12px] font-medium" style="background:#F8F8F8;color:#1C1C1C">{{ r }}</span> }
                    </div>
                  }
                </div>

                <div>
                  <h3 class="text-[11px] font-semibold uppercase tracking-wide mb-2" style="color:#828282">Favorite Payment Method</h3>
                  <p class="text-[13px]" style="color:#1C1C1C">{{ defaultCardLabel() }}</p>
                </div>

                <div>
                  <h3 class="text-[11px] font-semibold uppercase tracking-wide mb-2" style="color:#828282">Favorite Address</h3>
                  <p class="text-[13px]" style="color:#1C1C1C">{{ defaultAddressLabel() }}</p>
                </div>

                <button (click)="savePreferences()" [disabled]="saving()" class="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style="background:#E23744">
                  {{ saving() ? 'Saving…' : 'Save Preferences' }}
                </button>
              </div>
            }

            <!-- ============ PRIVACY ============ -->
            @if (section() === 'privacy') {
              <div class="max-w-md space-y-3">
                <div>
                  <h2 class="text-xl font-bold" style="color:#1C1C1C">Privacy</h2>
                  <p class="text-[13px] mt-0.5" style="color:#696969">Review how MiSlice handles your data.</p>
                </div>
                <a routerLink="/legal" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">Privacy Policy</span><span style="color:#BDBDBD">→</span>
                </a>
                <a routerLink="/legal" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">Terms of Service</span><span style="color:#BDBDBD">→</span>
                </a>
                <a routerLink="/legal" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">Data Usage Information</span><span style="color:#BDBDBD">→</span>
                </a>
              </div>
            }

            <!-- ============ SUPPORT ============ -->
            @if (section() === 'support') {
              <div class="max-w-md space-y-3">
                <div>
                  <h2 class="text-xl font-bold" style="color:#1C1C1C">Customer Support</h2>
                  <p class="text-[13px] mt-0.5" style="color:#696969">We're here to help.</p>
                </div>
                <a routerLink="/how-it-works" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">❓ Help Center</span><span style="color:#BDBDBD">→</span>
                </a>
                <a routerLink="/contact" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">✉️ Contact Support</span><span style="color:#BDBDBD">→</span>
                </a>
                <div class="flex items-center justify-between rounded-xl p-4 opacity-50" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">💬 Live Chat</span><span class="text-[11px] font-semibold" style="color:#828282">Coming Soon</span>
                </div>
                <a routerLink="/contact" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">🚩 Report an Issue</span><span style="color:#BDBDBD">→</span>
                </a>
                <a routerLink="/how-it-works" class="flex items-center justify-between rounded-xl p-4 transition hover:bg-black/[0.02]" style="background:#F8F8F8">
                  <span class="text-sm font-medium" style="color:#1C1C1C">📖 FAQs</span><span style="color:#BDBDBD">→</span>
                </a>
              </div>
            }

          </div>
        </div>
      </div>
      }
    </div>

    <!-- TOAST -->
    @if (toast(); as t) {
      <div class="fixed bottom-6 right-6 z-[999] px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold text-white animate-fadeIn"
        [style.background]="t.type === 'success' ? '#1C1C1C' : '#E23744'">
        {{ t.type === 'success' ? '✓ ' : '⚠️ ' }}{{ t.message }}
      </div>
    }

    <!-- CONFIRM DIALOG -->
    @if (confirmState(); as c) {
      <div class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-black/40">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
          <p class="text-sm font-medium" style="color:#1C1C1C">{{ c.message }}</p>
          <div class="flex gap-3">
            <button (click)="c.onConfirm(); confirmState.set(null)" class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style="background:#E23744">Confirm</button>
            <button (click)="confirmState.set(null)" class="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style="border-color:#EFEFEF;color:#696969">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly restaurantService = inject(RestaurantService);

  user = this.auth.currentUser;

  section = signal<Section>('overview');
  sections: { id: Section; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'support', label: 'Support', icon: '💬' },
  ];

  loadingProfile = signal(true);
  saving = signal(false);
  toast = signal<Toast | null>(null);
  confirmState = signal<ConfirmState | null>(null);

  // Personal info
  fullName = '';
  phone = '';
  preferredLanguage = 'en';
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timeZones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Detroit', Intl.DateTimeFormat().resolvedOptions().timeZone]
    .filter((v, i, arr) => arr.indexOf(v) === i);
  editingPersonal = signal(false);
  private personalSnapshot: { fullName: string; phone: string; preferredLanguage: string; timeZone: string } | null = null;
  avatarPreview = signal<string | null>(null);
  private avatarDraft: string | null = null;

  phoneValid(): boolean {
    return /^[\d\s\-+().]{7,20}$/.test(this.phone.trim());
  }

  // Dietary / preferences
  diets = [
    { key: 'vegan', label: 'Vegan', emoji: '🌱' },
    { key: 'halal', label: 'Halal', emoji: '🕌' },
    { key: 'glutenFree', label: 'Gluten Free', emoji: '🌾' },
    { key: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  ];
  dietaryState = new Set<string>();
  fulfillmentOptions: ('DELIVERY' | 'PICKUP')[] = ['DELIVERY', 'PICKUP'];
  defaultFulfillment: 'DELIVERY' | 'PICKUP' = 'DELIVERY';
  setDefaultFulfillment(f: 'DELIVERY' | 'PICKUP') { this.defaultFulfillment = f; }

  // Notifications
  notifOptions = [
    { key: 'ORDER_UPDATES', label: 'Order Updates' },
    { key: 'DEALS', label: 'Deal Notifications' },
    { key: 'NEW_RESTAURANTS', label: 'New Restaurant Alerts' },
    { key: 'REWARDS', label: 'Rewards Notifications' },
    { key: 'PROMOTIONS', label: 'Promotional Offers' },
    { key: 'EMAIL', label: 'Email Notifications' },
    { key: 'PUSH', label: 'Push Notifications' },
    { key: 'SMS', label: 'SMS Notifications' },
  ];
  notifPrefs: string[] = [];

  // Addresses
  addresses = signal<Address[]>([]);
  loadingAddresses = signal(false);
  addressForm = signal<Address | null>(null);

  // Payment methods
  cards = signal<PaymentMethodDto[]>([]);
  loadingCards = signal(false);
  showAddCard = signal(false);
  newCard: { brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover'; last4: string; expMonth: number; expYear: number } =
    { brand: 'Visa', last4: '', expMonth: 1, expYear: new Date().getFullYear() + 2 };

  // Security
  currentPassword = ''; newPassword = ''; confirmPassword = '';
  changingPassword = signal(false);
  canChangePassword(): boolean {
    return this.currentPassword.length > 0 && this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;
  }

  // Rewards + order stats
  loyalty = signal<LoyaltyAccountDto | null>(null);
  private orders = signal<OrderDto[]>([]);

  membershipTier = computed(() => {
    const lp = this.loyalty()?.lifetimePoints ?? 0;
    return lp >= 2000 ? 'Gold' : lp >= 500 ? 'Silver' : 'Bronze';
  });
  availableRewards = computed(() => Math.floor((this.loyalty()?.points ?? 0) / 100));

  orderStats = computed(() => {
    const list = this.orders();
    const totalOrders = list.length;
    const totalSaved = list.reduce((s, o) => s + (Number(o.discount) || 0), 0);
    const avgOrderValue = totalOrders ? list.reduce((s, o) => s + (Number(o.total) || 0), 0) / totalOrders : 0;
    const restaurantCounts = new Map<string, number>();
    const pizzaCounts = new Map<string, number>();
    for (const o of list) {
      restaurantCounts.set(o.restaurantName, (restaurantCounts.get(o.restaurantName) || 0) + 1);
      for (const item of o.items ?? []) {
        pizzaCounts.set(item.itemName, (pizzaCounts.get(item.itemName) || 0) + item.quantity);
      }
    }
    const topOf = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const dates = list.map(o => new Date(o.placedAt).getTime()).filter(t => !isNaN(t));
    const lastOrderDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : '';
    return {
      totalOrders, totalSaved, avgOrderValue,
      favoriteRestaurant: topOf(restaurantCounts), favoritePizza: topOf(pizzaCounts), lastOrderDate,
    };
  });

  memberSince = computed(() => {
    const created = this.user()?.createdAt;
    if (!created) return '—';
    return new Date(created).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  });

  favoriteRestaurants = computed<string[]>(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
      return ids.slice(0, 6);
    } catch { return []; }
  });

  defaultCardLabel(): string {
    const def = this.cards().find(c => c.isDefault) ?? this.cards()[0];
    return def ? `${def.brand} •••• ${def.last4}` : 'None saved';
  }
  defaultAddressLabel(): string {
    const def = this.addresses().find(a => a.defaultAddress) ?? this.addresses()[0];
    return def ? `${def.label} — ${def.line1}, ${def.city}` : 'None saved';
  }

  ngOnInit(): void {
    this.loadingProfile.set(true);
    this.auth.getProfile().subscribe({
      next: (p) => { this.initializeProfile(p); this.loadingProfile.set(false); },
      error: () => { const u = this.user(); if (u) this.initializeProfile(u); this.loadingProfile.set(false); },
    });
    this.auth.getAddresses().subscribe({ next: (list) => { this.addresses.set(list); this.loadingAddresses.set(false); }, error: () => this.loadingAddresses.set(false) });
    this.loadingAddresses.set(true);
    this.paymentMethodService.list().subscribe({ next: (list) => { this.cards.set(list); this.loadingCards.set(false); }, error: () => this.loadingCards.set(false) });
    this.loadingCards.set(true);
    this.loyaltyService.getAccount().subscribe({ next: (acc) => this.loyalty.set(acc), error: () => {} });
    this.orderService.getMyOrders().subscribe({ next: (list) => this.orders.set(list), error: () => {} });
  }

  private initializeProfile(profile: UserProfile) {
    this.fullName = profile.fullName || '';
    this.phone = profile.phone || '';
    this.preferredLanguage = profile.preferredLanguage || 'en';
    this.timeZone = profile.timeZone || this.timeZone;
    this.defaultFulfillment = profile.defaultFulfillment || 'DELIVERY';
    this.notifPrefs = profile.notificationPrefs ?? ['ORDER_UPDATES', 'DEALS', 'EMAIL', 'PUSH'];
    const prefs = profile.dietaryPrefs ?? [];
    this.dietaryState = new Set(['vegan', 'halal', 'glutenFree', 'vegetarian'].filter(k => {
      if (k === 'vegetarian') return profile.vegetarian;
      const tag = k === 'glutenFree' ? 'GLUTEN_FREE' : k.toUpperCase();
      return prefs.includes(tag);
    }));
  }

  private showToast(type: Toast['type'], message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 3200);
  }

  // ---- Personal info ----
  startEditPersonal() {
    this.personalSnapshot = { fullName: this.fullName, phone: this.phone, preferredLanguage: this.preferredLanguage, timeZone: this.timeZone };
    this.editingPersonal.set(true);
  }
  cancelEditPersonal() {
    if (this.personalSnapshot) Object.assign(this, this.personalSnapshot);
    this.avatarPreview.set(null);
    this.avatarDraft = null;
    this.editingPersonal.set(false);
  }
  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarDraft = reader.result as string;
      this.avatarPreview.set(this.avatarDraft);
    };
    reader.readAsDataURL(file);
  }
  savePersonal() {
    if (!this.fullName.trim() || (this.phone && !this.phoneValid())) return;
    this.saving.set(true);
    const payload: Partial<UserProfile> = {
      fullName: this.fullName.trim(), phone: this.phone.trim(),
      preferredLanguage: this.preferredLanguage, timeZone: this.timeZone,
    };
    if (this.avatarDraft) payload.avatarUrl = this.avatarDraft;
    this.auth.updateProfile(payload).subscribe({
      next: (p) => { this.initializeProfile(p); this.saving.set(false); this.editingPersonal.set(false); this.avatarPreview.set(null); this.avatarDraft = null; this.showToast('success', 'Profile updated.'); },
      error: () => { this.saving.set(false); this.showToast('error', 'Failed to update profile.'); },
    });
  }

  // ---- Preferences ----
  getDietState(key: string): boolean { return this.dietaryState.has(key); }
  toggleDiet(key: string) { this.dietaryState.has(key) ? this.dietaryState.delete(key) : this.dietaryState.add(key); }
  savePreferences() {
    this.saving.set(true);
    const prefs: string[] = [];
    if (this.dietaryState.has('vegan')) prefs.push('VEGAN');
    if (this.dietaryState.has('halal')) prefs.push('HALAL');
    if (this.dietaryState.has('glutenFree')) prefs.push('GLUTEN_FREE');
    this.auth.updateProfile({ dietaryPrefs: prefs, vegetarian: this.dietaryState.has('vegetarian'), defaultFulfillment: this.defaultFulfillment }).subscribe({
      next: () => { this.saving.set(false); this.showToast('success', 'Preferences saved.'); },
      error: () => { this.saving.set(false); this.showToast('error', 'Failed to save preferences.'); },
    });
  }

  // ---- Notifications ----
  toggleNotif(key: string) {
    this.notifPrefs = this.notifPrefs.includes(key) ? this.notifPrefs.filter(k => k !== key) : [...this.notifPrefs, key];
  }
  saveNotifications() {
    this.saving.set(true);
    this.auth.updateProfile({ notificationPrefs: this.notifPrefs, notificationsEnabled: this.notifPrefs.length > 0 }).subscribe({
      next: () => { this.saving.set(false); this.showToast('success', 'Notification preferences saved.'); },
      error: () => { this.saving.set(false); this.showToast('error', 'Failed to save preferences.'); },
    });
  }

  // ---- Addresses ----
  startAddAddress() {
    this.addressForm.set({ label: '', line1: '', city: '', state: 'MI', postalCode: '', defaultAddress: this.addresses().length === 0 });
  }
  startEditAddress(a: Address) { this.addressForm.set({ ...a }); }
  addressFormValid(): boolean {
    const f = this.addressForm();
    return !!f && !!f.label.trim() && !!f.line1.trim() && !!f.city.trim() && !!f.postalCode.trim();
  }
  saveAddress() {
    const f = this.addressForm();
    if (!f || !this.addressFormValid()) return;
    const req = f.id ? this.auth.updateAddress(f.id, f) : this.auth.addAddress(f);
    req.subscribe({
      next: () => {
        this.addressForm.set(null);
        this.auth.getAddresses().subscribe(list => this.addresses.set(list));
        this.showToast('success', 'Address saved.');
      },
      error: () => this.showToast('error', 'Failed to save address.'),
    });
  }
  setDefaultAddress(a: Address) {
    if (!a.id) return;
    this.auth.updateAddress(a.id, { ...a, defaultAddress: true }).subscribe({
      next: () => { this.auth.getAddresses().subscribe(list => this.addresses.set(list)); this.showToast('success', 'Default address updated.'); },
      error: () => this.showToast('error', 'Failed to update default address.'),
    });
  }
  confirmDeleteAddress(a: Address) {
    this.confirmState.set({
      message: `Delete the "${a.label}" address? This cannot be undone.`,
      onConfirm: () => {
        if (!a.id) return;
        this.auth.deleteAddress(a.id).subscribe({
          next: () => { this.addresses.update(list => list.filter(x => x.id !== a.id)); this.showToast('success', 'Address deleted.'); },
          error: () => this.showToast('error', 'Failed to delete address.'),
        });
      }
    });
  }

  // ---- Payment methods ----
  cardIcon(brand: string): string {
    return { Visa: '💳', Mastercard: '💳', Amex: '💳', Discover: '💳' }[brand] ?? '💳';
  }
  addCard() {
    if (this.newCard.last4.length !== 4) return;
    this.paymentMethodService.add({ ...this.newCard, isDefault: this.cards().length === 0 }).subscribe({
      next: (card) => {
        this.cards.update(list => [...list, card]);
        this.showAddCard.set(false);
        this.newCard = { brand: 'Visa', last4: '', expMonth: 1, expYear: new Date().getFullYear() + 2 };
        this.showToast('success', 'Card added.');
      },
      error: () => this.showToast('error', 'Failed to add card.'),
    });
  }
  setDefaultCard(c: PaymentMethodDto) {
    if (!c.id) return;
    this.paymentMethodService.setDefault(c.id).subscribe({
      next: () => this.paymentMethodService.list().subscribe(list => this.cards.set(list)),
      error: () => this.showToast('error', 'Failed to update default card.'),
    });
  }
  confirmDeleteCard(c: PaymentMethodDto) {
    this.confirmState.set({
      message: `Remove ${c.brand} •••• ${c.last4}?`,
      onConfirm: () => {
        if (!c.id) return;
        this.paymentMethodService.remove(c.id).subscribe({
          next: () => { this.cards.update(list => list.filter(x => x.id !== c.id)); this.showToast('success', 'Card removed.'); },
          error: () => this.showToast('error', 'Failed to remove card.'),
        });
      }
    });
  }

  // ---- Security ----
  updatePassword() {
    if (!this.canChangePassword()) return;
    this.changingPassword.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.currentPassword = this.newPassword = this.confirmPassword = '';
        this.showToast('success', 'Password updated.');
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.showToast('error', err?.code === 'auth/invalid-credential' ? 'Current password is incorrect.' : 'Failed to update password.');
      },
    });
  }

  goRewards() { this.router.navigate(['/rewards']); }
}
