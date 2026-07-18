# 🎨 MiSlice UI Redesign — Landing to Home Workflow

## Design System

### Colors
- **Gold**: #D4AF37 (primary accent)
- **Red**: #E53935 (secondary accent)
- **White**: #FFFFFF (text on dark)
- **Black**: #0E0E10 (dark background)
- **Glassmorphism**: RGBA(255, 255, 255, 0.1) with backdrop blur
- **Text Primary**: #F8F8F8
- **Text Secondary**: #B8B8B8
- **Borders**: #2B2B31

### Typography
- **Headlines**: Bold, multiline, gold + white mix
- **Body**: Regular, readable on mobile
- **CTA Buttons**: Bold, 16px+, min 44px height

### Mobile-First Approach
- All designs optimized for mobile first
- Eye icon (👁️) toggle for expand/minimize throughout app
- Glassmorphism inputs on all forms
- Minimal spacing on mobile

---

## SCREEN 1: LANDING PAGE

### Layout
```
┌─────────────────────────────────┐
│   [PIZZA HERO BACKGROUND]       │
│   [High quality, striking]      │
│                                 │
│   Find the best                 │
│   pizza deals                   │ (Multiline)
│   near you                       │ (Gold + White)
│                                 │
│   ┌──────────────────────────┐  │
│   │ 📍 Use my location       │  │ (Button)
│   └──────────────────────────┘  │
│                                 │
│   ┌──────────────────────────┐  │
│   │ Or enter city manually   │  │ (Text field)
│   └──────────────────────────┘  │ (Glassmorphism)
│                                 │
│   ┌──────────────────────────┐  │
│   │ Enter phone number       │  │ (Text field)
│   └──────────────────────────┘  │ (Glassmorphism)
│                                 │
│   ┌──────────────────────────┐  │
│   │ Find Pizza               │  │ (Primary CTA)
│   └──────────────────────────┘  │ (Gradient: Gold→Orange)
│                                 │
│   ┌──────────────────────────┐  │
│   │ Sign In                  │  │ (Primary Button)
│   └──────────────────────────┘  │
│   Sign Up                        │ (Secondary Link)
│
└─────────────────────────────────┘
```

### Component Specs

#### Location Input
- Type: Button + Text field
- Button: "📍 Use my location" (glassmorphism style)
- OR Text field: "Enter city" (glassmorphism)
- On click: Request device location permission

#### Phone Number Input
- Type: Glassmorphism input
- Placeholder: "Enter phone number"
- Format: Auto-format as user types
- Validation: Must be valid phone format

#### Sign In / Sign Up
- Sign In: Primary button (gold), full width, 56px height
- Sign Up: Secondary link/button (text), below Sign In
- Placement: Bottom of form

---

## SCREEN 2: OTP VERIFICATION PAGE

### Layout
```
┌─────────────────────────────────┐
│   [SAME HERO BACKGROUND]        │
│                                 │
│   ┌──────────────────────────┐  │
│   │ Enter OTP                │  │ (Header)
│   │ Code sent to +1234567890 │  │ (Subtext)
│   │                          │  │
│   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │  │
│   │ │  │ │  │ │  │ │  │    │  │ (6 digit boxes)
│   │ │  │ │  │ │  │ │  │    │  │
│   │ └──┘ └──┘ └──┘ └──┘    │  │
│   │                          │  │
│   │ Didn't receive code?      │  │
│   │ Resend OTP               │  │
│   │                          │  │
│   │ ┌──────────────────────┐ │  │
│   │ │ Verify & Continue    │ │  │ (Primary CTA)
│   │ └──────────────────────┘ │  │
│   └──────────────────────────┘  │ (Glassmorphism card)
│                                 │
└─────────────────────────────────┘
```

### Component Specs

#### OTP Input
- Type: 6 separate digit boxes
- Style: Glassmorphism inputs
- Behavior: Auto-focus to next box after digit entered
- Size: 48x48px per box (mobile-friendly)

#### Resend OTP
- Type: Text link
- Action: Resend code to phone
- Cooldown: Show timer if recently sent (e.g., "Resend in 30s")

#### Verify Button
- Style: Gradient (Gold → Orange)
- Text: "Verify & Continue"
- Size: Full width, 56px height
- State: Disabled until 6 digits entered

---

## SCREEN 3: WELCOME POSTER (Swipeable Cards)

### Layout - Card 1
```
┌─────────────────────────────────┐
│   MiSlice                       │
│                                 │
│   ┌─────────────────────────┐   │
│   │   💰                    │   │
│   │                         │   │
│   │   Compare Prices        │   │
│   │                         │   │
│   │   See real prices from  │   │
│   │   multiple pizzerias    │   │
│   │   instantly             │   │
│   └─────────────────────────┘   │
│   (Glassmorphism card)          │
│                                 │
│   ● ○ ○  (Progress indicators)  │
│                                 │
│   [Skip]  [Find best pizza →]   │
│
└─────────────────────────────────┘
```

### Cards Content
- **Card 1**: "Compare Prices" - See real prices instantly
- **Card 2**: "Find Deals" - Discover special offers
- **Card 3**: "Better Prices" - Save money on every order

### Component Specs

#### Poster Card
- Style: Glassmorphism with icon
- Height: Full screen or 70% of screen
- Icon: Large emoji or icon (💰, 🎁, 💵)
- Text: Clear headline + description
- Swipeable: Horizontal swipe to next card

#### Progress Indicators
- Type: Dot indicators (● ○ ○)
- Position: Below card
- Color: Gold for active, gray for inactive

#### Action Buttons
- Skip button: Text link on left, "Skip"
- CTA button: Primary gradient button on right, "Find best pizza →"
- Size: Mobile-friendly, 44px+ height

---

## SCREEN 4: HOME PAGE (Main App)

### Layout - Top Section
```
┌─────────────────────────────────┐
│ [Search Bar - Sticky]           │ ← Stays at top when scrolling
│ 🔍 Search restaurants, pizzas...│
│                                 │
│ Advertised Pizzerias (Grid)     │
│                                 │
│ ┌──────────────┬──────────────┐ │
│ │ Pizzeria A   │ Pizzeria B   │ │ (2 columns on mobile)
│ │ ★★★★☆ 4.5   │ ★★★★★ 5.0   │ │
│ │ $8-15        │ $10-18       │ │
│ │ [View] [👁️] │ [View] [👁️] │ │ (View button + Eye toggle)
│ └──────────────┴──────────────┘ │
│                                 │
│ ┌──────────────┬──────────────┐ │
│ │ Pizzeria C   │ Pizzeria D   │ │
│ └──────────────┴──────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Search Bar Specs
- Position: Sticky at top
- Style: Glassmorphism input
- Placeholder: "Search restaurants, pizzas..."
- Functionality: Search restaurants, pizzas, specials
- Mobile: Full width below top nav

### Advertised Pizzeria Cards (Compact Mode)

#### Compact View
```
┌─────────────────────────┐
│ Pizzeria Name           │
│ ★4.5 | $8-15 | [View]  │
└─────────────────────────┘
```

- **Name**: Pizzeria name (bold)
- **Rating**: ★4.5 (gold star)
- **Price**: $8-15 (price range)
- **View Button**: CTA to see details
- **Eye Toggle** (👁️): Expand to full details

#### Expanded View (When 👁️ clicked)
```
┌─────────────────────────────────┐
│ [Pizzeria Image - Full width]   │
│                                 │
│ Pizzeria Name                   │
│ ★4.5 Rating | 2.3 km away      │
│ 30-45 min delivery time         │
│                                 │
│ Top Deals:                      │
│ • Pepperoni Pizza - $8.99       │
│ • Veggie Special - $9.99        │
│                                 │
│ Customer Reviews:               │
│ "Amazing pizza!" - Sarah        │
│ "Best deals in town" - Mike     │
│                                 │
│ [View Full Menu] [👁️ Minimize] │
└─────────────────────────────────┘
```

---

### Layout - Middle Section
```
┌─────────────────────────────────┐
│ Compare Pizzas                  │
│                                 │
│ ┌──────────────┬──────────────┐ │
│ │Build Pizza   │Browse &      │ │ (Two buttons)
│ │ 🔨           │Compare       │ │
│ │              │ 🔄           │ │
│ └──────────────┴──────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### Compare Buttons
- **Build Pizza**: User creates custom pizza
- **Browse & Compare**: Select 2 pizzas to compare
- Style: Two equal-width buttons, glassmorphism or outlined
- Size: 56px height

---

### Layout - Bottom Section (Recommendations)
```
┌─────────────────────────────────┐
│ Recommended For You             │
│                                 │
│ ◄ ┌──────────────┐ ┌────────┐ │
│   │ Pepperoni    │ │ Veggie │ ◄ (1.5 cards visible)
│   │ Pizza Co     │ │ Paradise│
│   │ $9.99        │ │ $8.99  │
│   │ [View]       │ │[View]  │
│   └──────────────┘ └────────┘ ►
│                                 │
└─────────────────────────────────┘
```

#### Recommendation Cards
- **Layout**: Horizontal scroll, 1.5 cards visible
- **Content**: Pizza name + Restaurant + Price + View button
- **Style**: Text-focused, minimal
- **Size**: Cards are ~280px width (adjusts for screen)
- **Auto-scroll**: Smooth horizontal scroll

---

## MOBILE NAVIGATION (Persistent)

### Top Nav Bar
```
┌─────────────────────────────────┐
│ ☰ [Logo]    [🌙/☀️] [🔔] [👤]  │ (Hamburger, logo, theme, bell, profile)
└─────────────────────────────────┘
```

### Bottom Nav Bar (Mobile)
```
┌─────────────────────────────────┐
│ 🏠   🍕   ⚖️   ❤️   👤        │ (Home, Build, Compare, Favorites, Profile)
└─────────────────────────────────┘
```

---

## INTERACTIVE ELEMENTS

### Eye Toggle (👁️) - Global Feature
- Appears on every card/section
- Click: Expands to show full details
- State: Shows all info (images, reviews, distance, delivery time)
- Animation: Smooth expand/collapse

### Theme Toggle (🌙/☀️)
- Top right corner
- Toggles dark/light theme
- Saves preference to localStorage

### Notifications Bell (🔔)
- Shows unread order updates
- Red badge if unread

---

## COLOR SPECIFICATIONS

### Light Mode (When toggled)
- Background: #FFFFFF
- Cards: #FAFAFA
- Text: #1F1F1F
- Secondary text: #555555
- Borders: #E8E8E8
- Accents: #D4AF37 (Gold), #FF8A00 (Orange)

### Dark Mode (Default)
- Background: #0E0E10
- Cards: #18181B
- Text: #F8F8F8
- Secondary text: #B8B8B8
- Borders: #2B2B31
- Accents: #D4AF37 (Gold), #FF8A00 (Orange)

---

## ANIMATION & INTERACTIONS

### Transitions
- All transitions: 300ms ease-out
- Theme toggle: Smooth fade
- Card expand: Slide + fade
- Scroll animations: Smooth, GPU-accelerated

### Touch Feedback
- Buttons: Slight scale on press (0.95x)
- Cards: Slight shadow increase on hover/focus
- Links: Color change on press

---

## RESPONSIVE BREAKPOINTS

### Mobile (0-640px)
- Single column cards
- Full-width inputs
- Bottom navigation visible
- Hamburger menu for navigation

### Tablet (640-1024px)
- 2 column grids
- Sidebar visible
- Adjusted spacing

### Desktop (1024px+)
- 3 column grids
- Full sidebar
- Expanded layouts

---

## ACCESSIBILITY

- ✅ All buttons/inputs: Minimum 44x44px touch targets
- ✅ Color contrast: WCAG AA compliant
- ✅ Focus states: Visible on all interactive elements
- ✅ Keyboard navigation: Tab through all elements
- ✅ Screen reader: Semantic HTML, ARIA labels where needed

---

## STATUS: DESIGN FINALIZED ✅

Next steps:
1. Implement in Angular components
2. Style with Tailwind CSS
3. Add backend API integration
4. Test on real mobile devices
