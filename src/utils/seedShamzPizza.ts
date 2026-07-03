// Seeds Shamz Pizza store data on first load so the store looks populated
// when someone logs in with the demo account.

const STORE_NAME = 'Shamz Pizza';
const STORE_PIN = '1234';

export function seedShamzPizza() {
  // Register store account if not exists
  const accounts: Record<string, string> = JSON.parse(localStorage.getItem('storeAccounts') || '{}');
  if (!accounts[STORE_NAME]) {
    accounts[STORE_NAME] = STORE_PIN;
    localStorage.setItem('storeAccounts', JSON.stringify(accounts));
  }

  // Only seed profile if not set yet
  if (!localStorage.getItem(`profile_${STORE_NAME}`)) {
    const profile = {
      name: STORE_NAME,
      tagline: 'Fresh Ingredients. Bold Flavors. Shamz Pizza.',
      description: 'Shamz Pizza is your neighbourhood go-to for handcrafted pizzas made fresh every day. From classic Margherita to bold meat feasts, we\'ve got a slice for every mood.',
      address: '123 Shamz Lane, Pizza District',
      phone: '+1 (555) 742-6999',
      website: 'https://shamzpizza.com',
      logo: '/shamz-pizza-store.png',
      hours: [
        { day: 'Mon', open: '11:00', close: '22:00', closed: false },
        { day: 'Tue', open: '11:00', close: '22:00', closed: false },
        { day: 'Wed', open: '11:00', close: '22:00', closed: false },
        { day: 'Thu', open: '11:00', close: '22:30', closed: false },
        { day: 'Fri', open: '11:00', close: '23:00', closed: false },
        { day: 'Sat', open: '10:00', close: '23:00', closed: false },
        { day: 'Sun', open: '12:00', close: '21:00', closed: false },
      ],
      menuPdf: undefined,
      menuPdfName: undefined,
      acceptingOrders: true,
    };
    localStorage.setItem(`profile_${STORE_NAME}`, JSON.stringify(profile));
  }

  // Only seed menu if not set yet
  if (!localStorage.getItem(`menu_${STORE_NAME}`)) {
    const menu = [
      { id: '1', name: 'Shamz Classic Margherita', description: 'San Marzano tomato, fresh mozzarella, basil, EVOO', price: 13.99, category: 'Pizza', photo: '/shamz-pizza-store.png', tags: ['Vegetarian', 'Bestseller'], available: true },
      { id: '2', name: 'Pepperoni Supreme', description: 'Double-stacked pepperoni, smoked mozzarella, tomato sauce', price: 16.99, category: 'Pizza', photo: '/shamz-pizza-store.png', tags: ['Bestseller', 'Hot'], available: true },
      { id: '3', name: 'Shamz Meat Feast', description: 'Pepperoni, Italian sausage, bacon, ham, mozzarella', price: 18.99, category: 'Pizza', photo: '/shamz-pizza-store.png', tags: ['Popular'], available: true },
      { id: '4', name: 'BBQ Chicken Ranch', description: 'Grilled chicken, BBQ sauce, ranch drizzle, red onion, jalapeño', price: 17.49, category: 'Pizza', photo: '/shamz-pizza-store.png', tags: ['Spicy'], available: true },
      { id: '5', name: 'Veggie Garden', description: 'Capsicum, mushroom, olives, sun-dried tomato, feta', price: 15.49, category: 'Pizza', tags: ['Vegetarian', 'Healthy'], available: true },
      { id: '6', name: 'Truffle Mushroom', description: 'Wild mushroom mix, truffle oil, parmesan, rocket', price: 19.99, category: 'Specials', tags: ['Chef\'s Pick'], available: true },
      { id: '7', name: 'Extra Cheese', description: 'Blend of mozzarella, cheddar & parmesan', price: 2.49, category: 'Toppings', tags: [], available: true },
      { id: '8', name: 'Jalapeños', description: 'Fresh sliced jalapeño peppers', price: 1.49, category: 'Toppings', tags: ['Spicy'], available: true },
      { id: '9', name: 'Pepperoni', description: 'Classic pepperoni slices', price: 1.99, category: 'Toppings', tags: [], available: true },
      { id: '10', name: 'Garlic Bread', description: 'Toasted Italian bread with garlic butter & herbs', price: 5.49, category: 'Sides', tags: ['Popular'], available: true },
      { id: '11', name: 'Loaded Fries', description: 'Crispy fries with cheese sauce & bacon bits', price: 7.99, category: 'Sides', tags: [], available: true },
      { id: '12', name: 'Caesar Salad', description: 'Crisp romaine, parmesan, house-made caesar dressing, croutons', price: 8.99, category: 'Sides', tags: ['Healthy'], available: true },
      { id: '13', name: 'Coca-Cola', description: '375ml can', price: 2.99, category: 'Drinks', tags: [], available: true },
      { id: '14', name: 'Lemon Iced Tea', description: 'Freshly brewed & chilled', price: 3.49, category: 'Drinks', tags: [], available: true },
      { id: '15', name: 'Sparkling Water', description: 'San Pellegrino 500ml', price: 3.99, category: 'Drinks', tags: [], available: true },
      { id: '16', name: 'Tiramisu', description: 'Classic Italian, house-made daily', price: 7.49, category: 'Desserts', tags: ['Popular'], available: true },
      { id: '17', name: 'Nutella Pizza', description: 'Mini dessert pizza with Nutella & strawberries', price: 9.99, category: 'Desserts', tags: ['Sweet'], available: true },
    ];
    localStorage.setItem(`menu_${STORE_NAME}`, JSON.stringify(menu));
  }

  // Only seed deals if not set yet
  if (!localStorage.getItem(`deals_${STORE_NAME}`)) {
    const deals = [
      { id: '1', title: 'Tuesday 2-for-1 Pizzas', description: 'Every Tuesday — buy any large pizza, get a second medium free!', discountType: 'bogo', discountValue: 0, code: 'SHAMZ2FOR1', expiresAt: '2026-12-31', active: true },
      { id: '2', title: '20% Off First Order', description: 'New customers get 20% off their first order with us.', discountType: 'percent', discountValue: 20, code: 'WELCOME20', expiresAt: '2026-12-31', active: true },
      { id: '3', title: 'Free Delivery on $40+', description: 'Spend $40 or more and get free delivery anywhere in our zone.', discountType: 'free_delivery', discountValue: 0, code: 'FREEDEL40', expiresAt: '2026-12-31', active: true },
      { id: '4', title: 'Lunch Deal — $5 Off', description: 'Order any two items Mon–Fri 11am–2pm and save $5.', discountType: 'fixed', discountValue: 5, code: 'LUNCH5', expiresAt: '2026-12-31', active: true },
    ];
    localStorage.setItem(`deals_${STORE_NAME}`, JSON.stringify(deals));
  }
}
