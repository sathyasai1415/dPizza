export type Size = "Small" | "Medium" | "Large" | "Extra Large" | "";
export type Crust = "Hand Tossed" | "Handmade Pan" | "Crunchy Thin Crust" | "Brooklyn Style" | "New York Style" | "Parmesan Stuffed Crust" | "Gluten Free Crust" | "";
export type Sauce = "Robust Inspired Tomato Sauce" | "Hearty Marinara" | "Garlic Parmesan White Sauce" | "Alfredo Sauce" | "BBQ Sauce" | "Ranch Sauce" | "Buffalo Sauce" | "No Sauce" | "";

export interface PizzaConfig {
  size: Size;
  crust: Crust;
  crustFlavor?: string;
  sauce: Sauce;
  sauceAmount?: 'Light' | 'Normal' | 'Extra';
  cheeseAmount?: 'None' | 'Light' | 'Normal' | 'Extra';
  cheese: string[];
  meats: string[];
  veggies: string[];
  extras: string[];
  drizzles?: string[];
  toppingPlacements?: Record<string, 'whole' | 'left' | 'right'>;
  toppingAmounts?: Record<string, 'Light' | 'Moderate' | 'Extra'>;
  bakePreference?: 'Light Bake' | 'Normal Bake' | 'Well Done';
  cutStyle?: 'Pie Cut' | 'Square Cut' | 'No Cut';
  specialInstructions?: string;
  quantity: number;
}

export type DeliveryType = 'store-delivery' | 'third-party' | 'pickup' | 'doordash-drive' | 'uber-direct';
export type DeliveryStatus = 'Store Delivery Available' | 'Third-Party Delivery Available' | 'Pickup Only';

export interface Coupon {
  id?: string;
  code: string;
  description: string;
  discountType: 'fixed' | 'percentage' | 'free_delivery';
  discountValue: number;
}

export interface PriceBreakdown {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number; // For platform/third-party
  tax: number; // typically 8.25%
  tip: number; // 15% courier tip if delivered
  discount: number; // Applied discount from coupon
  grandTotal: number;
}

export interface DeliveryProviderOption {
  providerId: string; // 'store', 'ubereats', 'doordash', 'pickup'
  providerName: string;
  priceBreakdown: PriceBreakdown;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  badges: string[];
  availableCoupons: Coupon[];
  appliedCoupon?: Coupon;
}

export interface OrderItem {
  id: string;
  orderId: string;
  pizzaName: string;
  pizzaImage: string;
  size: string;
  crust: string;
  sauce: string;
  cheese: string[];
  toppings: string[];
  quantity: number;
  basePrice: number;
  toppingsTotal: number;
  itemTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  orderStatus: 'placed' | 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  selectedDeliveryProvider: string;
  selectedDeliveryProviderId?: string;
  deliveryType: string;
  deliveryFee: number;
  providerServiceFee: number;
  estimatedDeliveryTime: string;
  subtotal: number;
  tax: number;
  platformServiceFee: number;
  couponCode?: string;
  couponDiscount: number;
  finalTotal: number;
  paymentStatus: "pending" | "paid" | "failed" | "unpaid";
  paymentMethod?: "cash_on_delivery" | "pay_at_store" | "card";
  createdAt: string;
  items: OrderItem[];
  deliveryAddress?: string;
  deliveryNotes?: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number; // 1-5
  text: string;
  reply?: string;
  createdAt?: string;
}

export interface Quote {
  chainId: string;
  chainName: string;
  logoColor: string; // e.g. Tailwind class or hex
  basePrice: number;
  toppingsCost: number;
  rating: number;
  reviews: ChainReviewDto[];
  distance: string;
  badges: string[];
  
  // New features for delivery options
  deliveryOptions: DeliveryProviderOption[];
  cheapestOptionId?: string;
  fastestOptionId?: string;
  bestValueOptionId?: string;
}

export interface ChainPricingData {
  id: string;
  name: string;
  color: string;
  defaultDeliveryType: DeliveryType;
  basePrices: Record<string, number>;
  crustPremium: Record<string, number>;
  toppingPrice: number; // price per topping
  storeDeliveryFee?: number; // fee local store charges
  reviews: Review[];
  deliveryOptions: {
    store: boolean;
    pickup: boolean;
    doordash: boolean;
    ubereats: boolean;
    grubhub: boolean;
  };
  distance: string;
}

export interface CartItem {
  id: string; // unique ID for the cart item
  store_id: string; // The ID of the store or chain
  store_name: string; // E.g., Domino's, Local Store
  item_name: string; // E.g., Custom Pizza, or Deal Title
  config?: PizzaConfig; // The configuration if it's a pizza
  deal_id?: string; // If it's a local deal
  quantity: number;
  price_per_item: number;
  total_price: number;
  delivery_type: DeliveryType;
  platform?: string; // e.g., 'store-delivery', 'doordash', 'ubereats'
  estimatedTime?: string;
  custom_delivery_fee?: number;
  deliveryOption?: DeliveryProviderOption;
}

export interface FavoriteConfig {
  id: string;
  name: string;
  config: PizzaConfig;
}

export interface Recommendation {
  id: string;
  name: string;
  storeName: string;
  imageColor: string;
  startingPrice: number;
  deliveryType: string;
  distance: string;
  estimatedTime: string;
  badges: string[];
  config: PizzaConfig;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
  accountStatus: string;
  emailVerified: boolean;
  vegetarian: boolean;
  preferredCrust?: string;
  dietaryPrefs?: string[];
  meatPrefs?: string[];
  favoriteToppings?: string[];
  budgetRange?: string;
  avatarUrl?: string;
  notificationsEnabled: boolean;
  addresses?: Address[];
}

export interface Address {
  id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  defaultAddress: boolean;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city: string;
  state: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  brandColor?: string;
  ratingAvg: number;
  ratingCount: number;
  acceptingOrders: boolean;
  approved: boolean;
  
  // V3 properties
  applicationStatus?: string;
  setupComplete: boolean;
  deliveryFee: number;
  deliveryRadiusMiles?: number;
  minimumOrder: number;
  averageEtaMinutes?: number;
  emoji: string;
  category: string;
  priceRange: string;
  neighborhood?: string;
  website?: string;
  trendScore: number;
  featured: boolean;
  newStore: boolean;
  tags?: string[];
  badges?: string[];
  popularItems?: string[];
  deliveryPartners?: string[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  basePrice: number;
  photoUrl?: string;
  tags?: string[];
  itemType: 'PIZZA' | 'SIDE' | 'DRINK' | 'DESSERT' | 'TOPPING' | 'COMBO';
  available: boolean;
  stockQty?: number;
}

export interface PizzaSize {
  id: string;
  restaurantId: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
}

export interface CrustType {
  id: string;
  restaurantId: string;
  name: string;
  priceDelta: number;
}

export interface Topping {
  id: string;
  restaurantId: string;
  name: string;
  category: 'MEAT' | 'VEGGIE' | 'CHEESE' | 'SAUCE';
  price: number;
  available: boolean;
}

export interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description?: string;
  originalPrice?: number;
  discountedPrice?: number;
  imageUrl?: string;
  deliveryType?: string;
  startsAt?: string;
  expiresAt?: string;
  badge?: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  code?: string;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile | null;
  roleRequired?: boolean;
}

export interface PizzaOptionsResponse {
  sizes: PizzaSize[];
  crusts: CrustType[];
  toppings: Topping[];
}

export interface CartItemToppingDto {
  toppingId?: string;
  toppingName: string;
  price: number;
}

export interface CartItemDto {
  id: string;
  menuItemId?: string;
  itemName: string;
  size?: string;
  crust?: string;
  sauce?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  toppings: CartItemToppingDto[];
}

export interface CartDto {
  id: string;
  userId: string;
  restaurantId?: string;
  restaurantName?: string;
  couponCode?: string;
  items: CartItemDto[];
}

export interface OrderItemDto {
  id: string;
  menuItemId?: string;
  itemName: string;
  size?: string;
  crust?: string;
  sauce?: string;
  toppings: string[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  deliveryType: string;
  deliveryProvider?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  providerServiceFee: number;
  platformServiceFee: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  couponCode?: string;
  estimatedEtaMin?: number;
  estimatedEtaMax?: number;
  placedAt: string;
  paymentMethod: string;
  paymentStatus: string;
  qrToken?: string;
  qrScannedAt?: string;
  items: OrderItemDto[];
}

export interface ChainReviewDto {
  id: string;
  authorName: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface ChainDto {
  id: string;
  chainKey: string;
  name: string;
  color?: string;
  website?: string;
  basePrices: Record<string, number>;
  crustPremiums: Record<string, number>;
  toppingPrice: number;
  storeDeliveryFee: number;
  defaultDeliveryType: string;
  supportsStoreDelivery: boolean;
  supportsPickup: boolean;
  supportsDoordash: boolean;
  supportsUbereats: boolean;
  supportsGrubhub: boolean;
  distanceLabel?: string;
  reviews: ChainReviewDto[];
}

export interface DeliveryDto {
  id: string;
  orderId: string;
  driverName?: string;
  status: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  etaMinutes?: number;
}

export interface ReviewDto {
  id: string;
  userFullName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}


