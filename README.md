# ☕ Uncle Brew — Advanced Web Platform with Supabase Cloud Backend

An advanced, modern, high-performance web platform built for **Uncle Brew** (Specialty Coffee & Refreshers), the beloved Philippine café brand originating from Cebu.

Now integrated with **Supabase Cloud Database** for real-time customer orders, checkout persistence, and franchise partner inquiry management!

---

## ⚡ Supabase Cloud Integration

### Credentials Configured
- **Project URL**: `https://ffrzekxmkaslpgudqemj.supabase.co`
- **Publishable Key**: `sb_publishable_0cjPv3TRGj6S1RspcrAw8Q_lEWzwYKE`
- **Status**: ✅ **Fully Configured and Active**

The platform automatically sanitizes and connects to the Supabase client on page load. All customer checkout orders and franchise applications synchronize straight to your Supabase cloud database.

### Database Tables (One-Click Setup)
We have prepared a complete schema in [`supabase-schema.sql`](./supabase-schema.sql).
To create the tables in your Supabase dashboard:
1. Go to your **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Copy the contents of `supabase-schema.sql` and click **Run**.
3. This creates:
   - `orders`: Records every checkout order (customer details, items, delivery address, branch, total, and status).
   - `franchise_inquiries`: Captures investor inquiries (package name, contact info, target location, space readiness).
   - Sets up Row Level Security (RLS) policies allowing public submission.

---

## ✨ Full Feature Overview

1. **🎨 Warm Coffee Palette & Generous White Space**
   - Authentic coffee shop aesthetic: Roasted espresso (`#24140B`), golden caramel (`#C2782A`), warm milk-cream canvas (`#FAF7F2`), and clean white cards (`#FFFFFF`) with generous breathing room.
   - Built-in Web Audio API cozy café ambiance (soft rain, warm machine hum, steam hiss, stamp punch feedback, and extraction pumps).

2. **☕ Hands-on Barista Lab (Espresso Pull Station)**
   - Interactive 3-step espresso craft simulation:
     - **Step 1**: Grind 18g single-origin Atok Benguet beans with animated bean bounce and burr audio.
     - **Step 2**: Tamp the portafilter puck with 30 lbs calibrated tamper pressure animation.
     - **Step 3**: Pull the 9-bar chrome lever to watch the liquid stream pour and golden crema rise in the glass.
     - **Step 4**: Complete the extraction to unlock a celebratory confetti burst and an instant **₱39 OFF voucher (`UNCLE39`)** applied directly to the cart.

3. **✨ Brew Mood & Craving Quiz (Flavor Matcher)**
   - 3-step interactive quiz matching your current energy level, serving temperature (iced, piping hot, ice blended), and milk preference (farm whole dairy, barista oat, salted cheese foam, pure highland black).
   - Recommends the exact beverage match with nutrition/caffeine stats and a 1-click "Order My Match" button.

4. **🧪 Interactive Brew Studio with 3D Parallax & Pearl Poppers**
   - 3D perspective mouse tilt (`perspective(1000px) rotateX(...) rotateY(...)`) on the drink cup preview.
   - Clickable popping boba pearls that emit pop sounds and bounce when clicked.
   - Layered SVG cup visualizer with live liquid transitions, floating ice cubes, crema clouds, and drizzles.
   - Real-time calorie, caffeine, and price calculator.

5. **📋 Comprehensive Menu with 24+ Items**
   - Signature lattes, hot brews, frappes, cheesecake teas, refreshers, and artisan bites.
   - Live keyword search, category pills, and quick filters (Bestseller, Under ₱99, Low Calorie).
   - Item Customization Modal (size, sweetness, ice level, toppings).

6. **🛍️ Cart, Vouchers & Supabase Cloud Checkout**
   - Persistent cart with promo codes (`UNCLE39`, `FREESHIP`, `BREWVIP`).
   - Seamless checkout (Delivery, Curbside Pickup, Dine-in) with GCash, Maya, Card, or Cash.
   - Syncs orders directly to your Supabase `orders` table.
   - Interactive 4-stage Live Order Tracker.

7. **🗺️ Store Locator with Real-Time GPS Nearest Store Finder**
   - Custom coffee cup markers across 150+ Philippine locations (Cebu, Manila, Iloilo, Davao).
   - **"Find Nearest to Me"** button with spherical Haversine distance calculation, auto-sorting the branch list by kilometers and centering the map.

8. **💼 Franchise Portal & Financial ROI Calculator**
   - Package comparisons (Kiosk Express, Standard Café, Prime Lounge).
   - Interactive financial model sliders (daily cups sold, ticket price) with Chart.js profit breakdown.
   - Franchise application form synced directly to Supabase `franchise_inquiries`.

9. **🎁 BrewClub Digital Loyalty Rewards**
   - 10-stamp digital punch card with sound and unlocked reward celebration banner.

---

## 🚀 How to Run the Website

### Method 1: Instant Direct Launch
Double-click `open-site.bat` or open `index.html` directly in any web browser.

### Method 2: Local HTTP Server (Built-in PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Opens the site at `http://localhost:8080`.
