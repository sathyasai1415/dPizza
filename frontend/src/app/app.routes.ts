import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { LandingComponent } from './features/landing/landing.component';
import { OtpVerificationComponent } from './features/auth/otp-verification.component';
import { WelcomePosterComponent } from './features/onboarding/welcome-poster.component';
import { HomeRedesignComponent } from './features/home/home-redesign.component';
import { LayoutComponent } from './features/layout/layout.component';
import { HomeComponent } from './features/home/home.component';
import { OrderComponent } from './features/order/order.component';
import { StoreDetailComponent } from './features/store-detail/store-detail.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { ComparisonCardsComponent } from './features/compare/comparison-cards.component';
import { QuickCompareComponent } from './features/compare/quick-compare.component';
import { OrdersComponent } from './features/orders/orders.component';
import { OrderTrackingComponent } from './features/tracking/order-tracking.component';
import { RewardsComponent } from './features/rewards/rewards.component';
import { MisliceGoldComponent } from './features/rewards/mislice-gold.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { OwnerDashboardComponent } from './features/owner/owner-dashboard.component';
import { BuilderComponent } from './features/builder/builder.component';
import { ProfileComponent } from './features/profile/profile.component';
import { DealsComponent } from './features/deals/deals.component';
import { HowItWorksComponent } from './features/how-it-works/how-it-works.component';
import { ContactComponent } from './features/contact/contact.component';
import { LegalComponent } from './features/legal/legal.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { FavouritesComponent } from './features/favourites/favourites.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'otp', component: OtpVerificationComponent },
  { path: 'welcome-poster', component: WelcomePosterComponent },
  { path: 'home-new', component: HomeRedesignComponent },
  { path: 'welcome', component: WelcomeComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard()],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'order', component: OrderComponent },
      { path: 'builder', component: BuilderComponent },
      { path: 'restaurants/:slug', component: StoreDetailComponent },
      { path: 'cart', component: CartComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'compare', component: ComparisonCardsComponent },
      { path: 'quick-compare', component: QuickCompareComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'orders/tracking/:id', component: OrderTrackingComponent },
      { path: 'rewards', component: RewardsComponent },
      { path: 'rewards/gold', component: MisliceGoldComponent },
      { path: 'deals', component: DealsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'favourites', component: FavouritesComponent },
      { path: 'saved-pizzas', redirectTo: 'favourites' },
      { path: 'favorite-stores', redirectTo: 'favourites' },
      { path: 'how-it-works', component: HowItWorksComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'legal', component: LegalComponent },
      { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard(['ADMIN'])] },
      { path: 'owner', component: OwnerDashboardComponent, canActivate: [authGuard(['RESTAURANT_OWNER', 'RESTAURANT_STAFF'])] },
    ]
  },
  { path: '**', redirectTo: 'welcome' }
];
