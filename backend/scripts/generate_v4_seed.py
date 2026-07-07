#!/usr/bin/env python3
"""Generate V4__seed_marketplace.sql from mockPizzaData.json + chain pricing.

The output seeds the marketplace with the same demo data the React app used:
6 comparison chains, 5 marketplace restaurants (+1 pending application),
owners/staff/demo customers, menus (sizes/crusts/toppings/specialties),
deals, coupons, favorites, loyalty, demo orders, reviews, notifications.

Deterministic UUIDs (uuid5) keep the generated file stable across runs.
Run from the repo root:  python3 backend/scripts/generate_v4_seed.py
"""
import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MOCK = json.loads((ROOT / "mockPizzaData.json").read_text())
OUT = ROOT / "backend/src/main/resources/db/migration/V4__seed_marketplace.sql"

# BCrypt("password") — dev/demo only.
PW = "$2y$10$psLnGc7w/JKusJm2GtVAH.osm/AE3Zj3ozcSTZfvsPI2x8xnWH6cy"

# Fixed ids from V2__seed_data.sql
V2_ADMIN = "00000000-0000-0000-0000-0000000000a1"
V2_SHAMZ_OWNER = "00000000-0000-0000-0000-0000000000b1"
V2_SHAMZ = "00000000-0000-0000-0000-0000000000c1"


def uid(kind: str, key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"mislice:{kind}:{key}"))


def q(v) -> str:
    """SQL literal."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(items) -> str:
    if not items:
        return "NULL"
    return "ARRAY[" + ", ".join(q(i) for i in items) + "]"


def jsonb(obj) -> str:
    return q(json.dumps(obj)) + "::jsonb"


L: list[str] = []


def emit(sql: str = ""):
    L.append(sql)


# ────────────────────────────────────────────────────────────────────────────
# 1. Chains (exact port of src/lib/pricing.ts mockChains)
# ────────────────────────────────────────────────────────────────────────────
CHAINS = [
    dict(key="dominos", name="Domino's", color="bg-blue-600", default="STORE_DELIVERY",
         base={"Small": 8.99, "Medium": 12.99, "Large": 15.99, "Extra Large": 17.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 2.50, "Gluten Free Crust": 3.00},
         topping=1.50, fee=4.99, store=True, pickup=True, doordash=False, ubereats=False, grubhub=False,
         distance="1.2 miles",
         reviews=[("Alex", 4, "Fast delivery, good crust."), ("Jamie", 5, "Always my go-to!")]),
    dict(key="papa-johns", name="Papa Johns", color="bg-green-700", default="STORE_DELIVERY",
         base={"Small": 9.99, "Medium": 14.99, "Large": 17.99, "Extra Large": 19.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 1.5, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 3.00, "Gluten Free Crust": 3.00},
         topping=1.75, fee=5.49, store=True, pickup=True, doordash=True, ubereats=False, grubhub=False,
         distance="2.5 miles",
         reviews=[("Chris", 4, "Love the garlic sauce.")]),
    dict(key="pizza-hut", name="Pizza Hut", color="bg-red-600", default="STORE_DELIVERY",
         base={"Small": 9.99, "Medium": 13.99, "Large": 16.99, "Extra Large": 18.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 2.00, "Gluten Free Crust": 2.50},
         topping=1.25, fee=4.50, store=True, pickup=True, doordash=True, ubereats=True, grubhub=True,
         distance="1.8 miles",
         reviews=[("Sam", 3, "Pizza was okay, delivery time a bit long."), ("Taylor", 4, "Stuffed crust is legendary.")]),
    dict(key="jets-pizza", name="Jet's Pizza", color="bg-red-700", default="THIRD_PARTY",
         base={"Small": 12.99, "Medium": 16.99, "Large": 20.99, "Extra Large": 24.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 0, "Gluten Free Crust": 2.50},
         topping=2.00, fee=0, store=False, pickup=True, doordash=True, ubereats=True, grubhub=True,
         distance="0.8 miles",
         reviews=[("Jordan", 5, "Detroit style deep dish is unbeatable!")]),
    dict(key="marcos-pizza", name="Marco's Pizza", color="bg-red-800", default="THIRD_PARTY",
         base={"Small": 11.99, "Medium": 14.99, "Large": 18.99, "Extra Large": 21.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 0, "Gluten Free Crust": 3.00},
         topping=1.75, fee=0, store=False, pickup=True, doordash=True, ubereats=True, grubhub=True,
         distance="3.2 miles", reviews=[]),
    dict(key="buntys-pizza", name="Bunty's Pizza", color="bg-orange-600", default="STORE_DELIVERY",
         base={"Small": 2.49, "Medium": 3.49, "Large": 14.49, "Extra Large": 16.99},
         crust={"Hand Tossed": 0, "Handmade Pan": 1.0, "Crunchy Thin Crust": 0, "Brooklyn Style": 0,
                "New York Style": 0, "Parmesan Stuffed Crust": 2.50, "Gluten Free Crust": 2.50},
         topping=0.29, fee=0.49, store=True, pickup=True, doordash=True, ubereats=True, grubhub=False,
         distance="0.4 miles",
         reviews=[("Ravi", 5, "Best local pizza in Michigan, hands down!"),
                  ("Priya", 5, "Lamb topping is amazing, never going anywhere else."),
                  ("Mike", 4, "Great value, fast delivery and fresh ingredients."),
                  ("Sara", 5, "The garlic butter drizzle is unreal. 10/10!")]),
]

emit("-- ============================================================================")
emit("-- MiSlice seed V4 — marketplace demo data (GENERATED by scripts/generate_v4_seed.py)")
emit("-- Demo credentials all use password 'password' (BCrypt) — dev/demo only.")
emit("-- ============================================================================")
emit()
emit("-- ── Comparison chains ────────────────────────────────────────────────────────")
for i, c in enumerate(CHAINS):
    emit(
        "INSERT INTO chains (id, chain_key, name, color, base_prices, crust_premiums, topping_price, "
        "store_delivery_fee, default_delivery_type, supports_store_delivery, supports_pickup, "
        "supports_doordash, supports_ubereats, supports_grubhub, distance_label, sort_order, created_by)\n"
        f"VALUES ({q(uid('chain', c['key']))}, {q(c['key'])}, {q(c['name'])}, {q(c['color'])}, "
        f"{jsonb(c['base'])}, {jsonb(c['crust'])}, {c['topping']}, {c['fee']}, {q(c['default'])}, "
        f"{q(c['store'])}, {q(c['pickup'])}, {q(c['doordash'])}, {q(c['ubereats'])}, {q(c['grubhub'])}, "
        f"{q(c['distance'])}, {i}, 'system');"
    )
emit()
for c in CHAINS:
    for j, (author, rating, text) in enumerate(c["reviews"]):
        emit(
            "INSERT INTO chain_reviews (id, chain_id, author_name, rating, comment, created_by)\n"
            f"VALUES ({q(uid('chain_review', c['key'] + ':' + str(j)))}, {q(uid('chain', c['key']))}, "
            f"{q(author)}, {rating}, {q(text)}, 'system');"
        )
emit()

# ────────────────────────────────────────────────────────────────────────────
# 2. Users: demo customers, restaurant owners, zumbo staff
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Demo users ───────────────────────────────────────────────────────────────")

def user_sql(user_id, email, full_name, phone, roles, meat=None, avatar=None):
    emit(
        "INSERT INTO users (id, email, password_hash, full_name, phone, account_status, email_verified, "
        "meat_prefs, avatar_url, created_by)\n"
        f"VALUES ({q(user_id)}, {q(email)}, {q(PW)}, {q(full_name)}, {q(phone)}, 'ACTIVE', TRUE, "
        f"{arr(meat)}, {q(avatar)}, 'system');"
    )
    for r in roles:
        emit(f"INSERT INTO user_roles (user_id, role) VALUES ({q(user_id)}, {q(r)});")

U1 = uid("user", "sathyasaisskr@gmail.com")
U2 = uid("user", "demo@mislice.com")
mock_users = {u["email"]: u for u in MOCK["users"]}
user_sql(U1, "sathyasaisskr@gmail.com", "Sathya", "313-555-9901", ["CUSTOMER"],
         meat=mock_users["sathyasaisskr@gmail.com"].get("meatPreferences"))
user_sql(U2, "demo@mislice.com", "Alex Johnson", "734-555-8802", ["CUSTOMER"],
         meat=mock_users["demo@mislice.com"].get("meatPreferences"))
emit()

STORE_OWNERS = {}  # slug -> user id
for s in MOCK["stores"]:
    slug = s["id"]
    if slug == "shamz-pizza":
        STORE_OWNERS[slug] = V2_SHAMZ_OWNER
        continue
    email = f"owner@{slug.replace('-', '')}.com"
    ouid = uid("user", email)
    STORE_OWNERS[slug] = ouid
    user_sql(ouid, email, s["store_name"] + " Owner", s.get("phone"), ["RESTAURANT_OWNER"])
emit()

ZUMBO_STAFF = [("manager@zumbo.com", "Zumbo Manager", "MANAGER"),
               ("kitchen@zumbo.com", "Zumbo Kitchen", "KITCHEN_STAFF"),
               ("cashier@zumbo.com", "Zumbo Cashier", "CASHIER")]
for email, name, _role in ZUMBO_STAFF:
    user_sql(uid("user", email), email, name, None, ["RESTAURANT_STAFF"])
emit()

# ────────────────────────────────────────────────────────────────────────────
# 3. Restaurants (5 from mock; shamz updates the existing V2 row) + 1 pending
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Marketplace restaurants ─────────────────────────────────────────────────")

ENRICH = {
    "shamz-pizza":      dict(emoji="🍕", category="LOCAL", price="$$", hood="Downtown Detroit",
                             tags=["halal"], badges=["Top Rated", "Local"], trend=88, featured=True, new=False,
                             partners=["store", "pickup", "doordash"],
                             popular=["Detroit Deep Dish", "Pepperoni Supreme"]),
    "motor-city-slice": dict(emoji="🏎️", category="LOCAL", price="$$", hood="Ann Arbor",
                             tags=["vegetarian"], badges=["Free Delivery"], trend=74, featured=False, new=False,
                             partners=["store", "pickup", "ubereats"],
                             popular=["Motor City Special", "Veggie Slice"]),
    "great-lakes-pies": dict(emoji="🌊", category="ARTISAN", price="$$$", hood="Grand Rapids",
                             tags=["vegetarian", "gluten-free"], badges=["Top Rated"], trend=81, featured=True, new=False,
                             partners=["store", "pickup", "doordash", "grubhub"],
                             popular=["Lake Effect Supreme", "Artisan Margherita"]),
    "rambos-pizza":     dict(emoji="💪", category="LOCAL", price="$", hood="Detroit — Mexicantown",
                             tags=["spicy"], badges=["New"], trend=65, featured=False, new=True,
                             partners=["store", "pickup"],
                             popular=["Rambo Firehouse"]),
    "zumbos-pizza":     dict(emoji="🎪", category="PREMIUM", price="$$$", hood="Detroit — Midtown",
                             tags=["vegetarian"], badges=["#1 in Detroit"], trend=93, featured=True, new=False,
                             partners=["store", "pickup", "doordash", "ubereats"],
                             popular=["Chicken Parmesan Pizza"]),
}

RESTAURANTS = {}  # slug -> id
for s in MOCK["stores"]:
    slug = s["id"]
    e = ENRICH[slug]
    if slug == "shamz-pizza":
        RESTAURANTS[slug] = V2_SHAMZ
        emit(
            "UPDATE restaurants SET "
            f"delivery_fee = {s['delivery_fee']}, delivery_radius_miles = {s['delivery_radius']}, "
            f"minimum_order = {s['minimum_order']}, average_eta_minutes = {s['average_eta']}, "
            f"emoji = {q(e['emoji'])}, category = {q(e['category'])}, price_range = {q(e['price'])}, "
            f"neighborhood = {q(e['hood'])}, trend_score = {e['trend']}, is_featured = {q(e['featured'])}, "
            f"is_new = {q(e['new'])}, tags = {arr(e['tags'])}, badges = {arr(e['badges'])}, "
            f"popular_items = {arr(e['popular'])}, delivery_partners = {arr(e['partners'])}, "
            f"description = {q(s['description'])}, latitude = {s['latitude']}, longitude = {s['longitude']}, "
            f"address_line = {q(s['address'])}, brand_color = {q(s['brand_color'])}\n"
            f"WHERE id = {q(V2_SHAMZ)};"
        )
        continue
    rid = uid("restaurant", slug)
    RESTAURANTS[slug] = rid
    emit(
        "INSERT INTO restaurants (id, owner_id, name, slug, description, phone, address_line, city, state, "
        "postal_code, latitude, longitude, brand_color, rating_avg, rating_count, accepting_orders, is_approved, "
        "application_status, is_setup_complete, delivery_fee, delivery_radius_miles, minimum_order, "
        "average_eta_minutes, emoji, category, price_range, neighborhood, trend_score, is_featured, is_new, "
        "tags, badges, popular_items, delivery_partners, created_by)\n"
        f"VALUES ({q(rid)}, {q(STORE_OWNERS[slug])}, {q(s['store_name'])}, {q(slug)}, {q(s['description'])}, "
        f"{q(s.get('phone'))}, {q(s.get('address'))}, {q(s.get('city', 'Detroit'))}, {q(s.get('state', 'MI'))}, "
        f"{q((s.get('address') or ' 0')[-5:].strip() or None)}, {s.get('latitude', 'NULL')}, {s.get('longitude', 'NULL')}, "
        f"{q(s.get('brand_color'))}, {s.get('rating_avg', 0)}, {s.get('rating_count', 0)}, "
        f"{q(s.get('accepting_orders', True))}, TRUE, 'APPROVED', TRUE, {s.get('delivery_fee', 0)}, "
        f"{s.get('delivery_radius', 'NULL')}, {s.get('minimum_order', 0)}, {s.get('average_eta', 'NULL')}, "
        f"{q(e['emoji'])}, {q(e['category'])}, {q(e['price'])}, {q(e['hood'])}, {e['trend']}, "
        f"{q(e['featured'])}, {q(e['new'])}, {arr(e['tags'])}, {arr(e['badges'])}, {arr(e['popular'])}, "
        f"{arr(e['partners'])}, 'system');"
    )
emit()

# Pending application so the admin dashboard has something to approve.
PENDING_OWNER = uid("user", "owner@crustandcraft.com")
PENDING_REST = uid("restaurant", "crust-and-craft")
user_sql(PENDING_OWNER, "owner@crustandcraft.com", "Crust & Craft Owner", "313-555-0177", ["RESTAURANT_OWNER"])
emit(
    "INSERT INTO restaurants (id, owner_id, name, slug, description, phone, address_line, city, state, "
    "accepting_orders, is_approved, application_status, submitted_at, is_setup_complete, emoji, category, "
    "price_range, neighborhood, delivery_partners, created_by)\n"
    f"VALUES ({q(PENDING_REST)}, {q(PENDING_OWNER)}, 'Crust & Craft', 'crust-and-craft', "
    "'Wood-fired artisan pies with locally sourced ingredients.', '313-555-0177', "
    "'88 Bagley St, Detroit, MI 48226', 'Detroit', 'MI', FALSE, FALSE, 'SUBMITTED', now() - interval '2 days', "
    "TRUE, '🔥', 'ARTISAN', '$$$', 'Corktown', ARRAY['store','pickup'], 'system');"
)
emit()

# Zumbo staff memberships
for email, _name, role in ZUMBO_STAFF:
    emit(
        "INSERT INTO restaurant_members (id, restaurant_id, user_id, member_role, created_by)\n"
        f"VALUES ({q(uid('member', email))}, {q(RESTAURANTS['zumbos-pizza'])}, {q(uid('user', email))}, {q(role)}, 'system');"
    )
emit()

# Hours for the four new mock stores + pending store (Shamz has V2 hours)
emit("-- ── Store hours (11:00–22:00 daily) ─────────────────────────────────────────")
for slug, rid in list(RESTAURANTS.items()) + [("crust-and-craft", PENDING_REST)]:
    if slug == "shamz-pizza":
        continue
    for dow in range(7):
        emit(
            "INSERT INTO restaurant_hours (id, restaurant_id, day_of_week, open_time, close_time, closed, created_by) "
            f"VALUES ({q(uid('hours', f'{slug}:{dow}'))}, {q(rid)}, {dow}, '11:00', '22:00', FALSE, 'system');"
        )
emit()

# ────────────────────────────────────────────────────────────────────────────
# 4. Menus: sizes/crusts/toppings/specialties from the flattened mock catalog
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Menus (from mock catalog: base_pizza→sizes, crust_upgrade→crusts,")
emit("--    meat/veggie/cheese/drizzle→toppings, specialty→menu items) ─────────────")

# The V2 Shamz option catalogs are replaced by the uniform mock-derived ones.
emit(f"UPDATE pizza_sizes SET is_deleted = TRUE WHERE restaurant_id = {q(V2_SHAMZ)};")
emit(f"UPDATE crust_types SET is_deleted = TRUE WHERE restaurant_id = {q(V2_SHAMZ)};")
emit(f"UPDATE toppings    SET is_deleted = TRUE WHERE restaurant_id = {q(V2_SHAMZ)};")
emit()

SIZE_NAMES = {"Small": "Small", "Medium": "Medium", "Large": "Large", "XL": "Extra Large"}
SIZE_ORDER = {"Small": 0, "Medium": 1, "Large": 2, "Extra Large": 3}
TOPPING_CAT = {"meat": "MEAT", "veggie": "VEGGIE", "cheese": "CHEESE", "drizzle": "SAUCE"}
CRUST_RENAME = {"Stuffed Crust Upgrade": "Parmesan Stuffed Crust"}

by_store: dict[str, list[dict]] = {}
for m in MOCK["menu_items"]:
    by_store.setdefault(m["storeId"], []).append(m)

MENU_ITEM_IDS = {}  # (slug, mock item id) -> uuid
for slug, items in by_store.items():
    rid = RESTAURANTS[slug]
    sizes = {}
    for m in items:
        if m["category"] == "base_pizza":
            size_key = m["name"].split(" ")[0]
            sizes[SIZE_NAMES.get(size_key, size_key)] = m["price"]
    if sizes:
        small = sizes.get("Small") or min(sizes.values())
        byo_id = uid("menu", f"{slug}:build-your-own")
        MENU_ITEM_IDS[(slug, "build-your-own")] = byo_id
        emit(
            "INSERT INTO menu_items (id, restaurant_id, name, description, base_price, item_type, tags, available, created_by)\n"
            f"VALUES ({q(byo_id)}, {q(rid)}, 'Build Your Own Pizza', "
            f"'Start with our hand-made dough and pick every layer yourself.', {small}, 'PIZZA', ARRAY['base'], TRUE, 'system');"
        )
        for name, price in sizes.items():
            emit(
                "INSERT INTO pizza_sizes (id, restaurant_id, name, price_delta, sort_order, created_by) "
                f"VALUES ({q(uid('size', f'{slug}:{name}'))}, {q(rid)}, {q(name)}, {round(price - small, 2)}, {SIZE_ORDER.get(name, 9)}, 'system');"
            )
        # Standard free crusts every store offers, then priced upgrades from mock.
        for free_crust in ("Hand Tossed", "Crunchy Thin Crust"):
            emit(
                "INSERT INTO crust_types (id, restaurant_id, name, price_delta, created_by) "
                f"VALUES ({q(uid('crust', f'{slug}:{free_crust}'))}, {q(rid)}, {q(free_crust)}, 0, 'system');"
            )
    for m in items:
        cat = m["category"]
        if cat == "base_pizza":
            continue
        if cat == "crust_upgrade":
            name = CRUST_RENAME.get(m["name"], m["name"])
            emit(
                "INSERT INTO crust_types (id, restaurant_id, name, price_delta, created_by) "
                f"VALUES ({q(uid('crust', f'{slug}:{name}'))}, {q(rid)}, {q(name)}, {m['price']}, 'system');"
            )
        elif cat in TOPPING_CAT:
            emit(
                "INSERT INTO toppings (id, restaurant_id, name, category, price, available, created_by) "
                f"VALUES ({q(uid('topping', f'{slug}:{m['name']}'))}, {q(rid)}, {q(m['name'])}, "
                f"{q(TOPPING_CAT[cat])}, {m['price']}, {q(m.get('available', True))}, 'system');"
            )
        elif cat == "specialty":
            mid = uid("menu", f"{slug}:{m['id']}")
            MENU_ITEM_IDS[(slug, m["id"])] = mid
            emit(
                "INSERT INTO menu_items (id, restaurant_id, name, description, base_price, item_type, tags, available, created_by)\n"
                f"VALUES ({q(mid)}, {q(rid)}, {q(m['name'])}, {q(m.get('description'))}, {m['price']}, 'PIZZA', "
                f"{arr(m.get('tags'))}, {q(m.get('available', True))}, 'system');"
            )
    emit()

# ────────────────────────────────────────────────────────────────────────────
# 5. Deals & coupons
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Deals ────────────────────────────────────────────────────────────────────")
for d in MOCK["deals"]:
    emit(
        "INSERT INTO deals (id, restaurant_id, title, description, original_price, discounted_price, "
        "delivery_type, active, created_by)\n"
        f"VALUES ({q(uid('deal', d['id']))}, {q(RESTAURANTS[d['store_id']])}, {q(d['title'])}, "
        f"{q(d.get('description'))}, {q(d.get('original_price'))}, {q(d.get('discounted_price'))}, "
        f"{q(d.get('delivery_type'))}, {q(d.get('is_active', True))}, 'system');"
    )
emit()

emit("-- ── Provider coupons used by the compare engine ─────────────────────────────")
for code, desc, dtype, val, provider in [
    ("DASH10", "10% off delivery", "PERCENT", 10, "doordash"),
    ("SAVE5", "Save $5 on orders", "FIXED", 5, "ubereats"),
    ("FREEDEL", "Free delivery today", "FREE_DELIVERY", 0, "store"),
]:
    emit(
        "INSERT INTO coupons (id, code, description, discount_type, discount_value, provider, active, created_by)\n"
        f"VALUES ({q(uid('coupon', code))}, {q(code)}, {q(desc)}, {q(dtype)}, {val}, {q(provider)}, TRUE, 'system');"
    )
emit("UPDATE coupons SET provider = 'grubhub' WHERE code = 'GRUB7';")
emit()

# ────────────────────────────────────────────────────────────────────────────
# 6. Favorites, loyalty, notifications for the demo customer
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Demo customer favorites / loyalty / notifications ───────────────────────")
for u, key in ((U1, "sathyasaisskr@gmail.com"), (U2, "demo@mislice.com")):
    mu = mock_users[key]
    for fav_slug in mu.get("favoriteStores", []):
        emit(
            "INSERT INTO favorite_restaurants (id, user_id, restaurant_id, created_by) "
            f"VALUES ({q(uid('fav_rest', f'{key}:{fav_slug}'))}, {q(u)}, {q(RESTAURANTS[fav_slug])}, 'system');"
        )
    for sp in mu.get("savedPizzas", []):
        emit(
            "INSERT INTO favorite_configs (id, user_id, name, config, created_by)\n"
            f"VALUES ({q(uid('fav_cfg', f'{key}:{sp['id']}'))}, {q(u)}, {q(sp['name'])}, {jsonb(sp['config'])}, 'system');"
        )
emit()
emit(
    "INSERT INTO loyalty_accounts (id, user_id, points, lifetime_points, referral_code, created_by)\n"
    f"VALUES ({q(uid('loyalty', 'sathya'))}, {q(U1)}, 1240, 1240, 'MISLICE-SATHYA', 'system');"
)
emit(
    "INSERT INTO loyalty_accounts (id, user_id, points, lifetime_points, referral_code, created_by)\n"
    f"VALUES ({q(uid('loyalty', 'alex'))}, {q(U2)}, 320, 320, 'MISLICE-ALEX', 'system');"
)
emit()
for i, (ntype, title, body) in enumerate([
    ("DEAL", "🍕 2 Large Pizzas for $26", "Shamz Pizza has a deal live near you — grab it while it's hot."),
    ("REWARD", "You're 260 points from Gold", "Order this week to unlock free delivery perks."),
    ("SYSTEM", "Welcome to MiSlice", "Compare pizza prices across every shop in Michigan."),
]):
    emit(
        "INSERT INTO notifications (id, user_id, type, channel, title, body, read, created_by)\n"
        f"VALUES ({q(uid('notif', f'sathya:{i}'))}, {q(U1)}, {q(ntype)}, 'PUSH', {q(title)}, {q(body)}, "
        f"{q(i == 2)}, 'system');"
    )
emit()

# ────────────────────────────────────────────────────────────────────────────
# 7. Demo orders (+status history, loyalty ledger, reviews, price history)
# ────────────────────────────────────────────────────────────────────────────
emit("-- ── Demo orders with status history ─────────────────────────────────────────")
USER_BY_MOCK = {"SAMPLE_USER_1": U1, "SAMPLE_USER_2": U2}
STATUS_MAP = {"DELIVERED": "DELIVERED", "PREPARING": "PREPARING", "PENDING": "PENDING",
              "CONFIRMED": "CONFIRMED", "OUT_FOR_DELIVERY": "OUT_FOR_DELIVERY",
              "READY": "READY_FOR_PICKUP", "CANCELLED": "CANCELLED"}
DTYPE_MAP = {"store-delivery": "STORE_DELIVERY", "third-party": "THIRD_PARTY", "pickup": "PICKUP"}

for idx, o in enumerate(MOCK["orders"]):
    oid = uid("order", o["id"])
    ouser = USER_BY_MOCK.get(o["userId"], U1)
    status = STATUS_MAP.get(o["status"], "PENDING")
    dtype = DTYPE_MAP.get(o.get("deliveryType", "store-delivery"), "STORE_DELIVERY")
    delivered = status == "DELIVERED"
    pay_method = "CASH_ON_DELIVERY" if dtype == "STORE_DELIVERY" else "PAY_AT_STORE"
    emit(
        "INSERT INTO orders (id, order_number, user_id, restaurant_id, status, delivery_type, delivery_provider, "
        "delivery_address, subtotal, delivery_fee, provider_service_fee, platform_service_fee, tax, tip, discount, "
        "total, payment_method, payment_status, qr_token, estimated_eta_min, estimated_eta_max, placed_at, created_by)\n"
        f"VALUES ({q(oid)}, {q('MS-' + str(100200 + idx))}, {q(ouser)}, {q(RESTAURANTS[o['storeId']])}, {q(status)}, "
        f"{q(dtype)}, {q(o.get('deliveryProvider'))}, {q(o.get('deliveryAddress'))}, {o['subtotal']}, "
        f"{o.get('deliveryFee', 0)}, 0, 0, {o.get('tax', 0)}, {o.get('tip', 0)}, 0, {o['total']}, "
        f"{q(pay_method)}, {q('PAID' if delivered else 'UNPAID')}, {q(o.get('qrToken'))}, 25, 35, "
        f"{q(o['createdAt'])}, 'system');"
    )
    for j, it in enumerate(o.get("items", [])):
        emit(
            "INSERT INTO order_items (id, order_id, item_name, quantity, unit_price, line_total, created_by) "
            f"VALUES ({q(uid('order_item', f'{o['id']}:{j}'))}, {q(oid)}, {q(it['name'])}, {it['quantity']}, "
            f"{it['price']}, {round(it['price'] * it['quantity'], 2)}, 'system');"
        )
    emit(
        "INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by) "
        f"VALUES ({q(uid('osh', f'{o['id']}:0'))}, {q(oid)}, NULL, 'PENDING', 'system');"
    )
    if status != "PENDING":
        emit(
            "INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by) "
            f"VALUES ({q(uid('osh', f'{o['id']}:1'))}, {q(oid)}, 'PENDING', {q(status)}, 'system');"
        )
    if delivered and ouser == U1:
        emit(
            "INSERT INTO loyalty_transactions (id, account_id, type, points, description, order_id) "
            f"VALUES ({q(uid('ltx', o['id']))}, {q(uid('loyalty', 'sathya'))}, 'EARN', "
            f"{int(o['subtotal'] * 10)}, {q('Order ' + 'MS-' + str(100200 + idx))}, {q(oid)});"
        )
    emit()

emit("-- ── Reviews on delivered demo orders ────────────────────────────────────────")
emit(
    "INSERT INTO reviews (id, user_id, restaurant_id, order_id, rating, comment, moderation_status, created_by)\n"
    f"VALUES ({q(uid('review', 'order-001'))}, {q(U1)}, {q(RESTAURANTS['shamz-pizza'])}, "
    f"{q(uid('order', 'order-001'))}, 5, 'Crispy edges, fast delivery — exactly what Detroit style should be.', "
    "'APPROVED', 'system');"
)
emit()

emit("-- ── Price history samples ────────────────────────────────────────────────────")
sample = MENU_ITEM_IDS.get(("shamz-pizza", "build-your-own"))
if sample:
    for i, (price, days) in enumerate([(9.49, 30), (9.99, 7)]):
        emit(
            "INSERT INTO price_history (id, restaurant_id, menu_item_id, price, source, captured_at) "
            f"VALUES ({q(uid('ph', f'shamz:{i}'))}, {q(V2_SHAMZ)}, {q(sample)}, {price}, 'STORE_OWNER', "
            f"now() - interval '{days} days');"
        )
emit()

OUT.write_text("\n".join(L) + "\n")
print(f"Wrote {OUT} ({len(L)} lines)")
