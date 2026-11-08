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

1. **🎨 Visual Experience & Ambient Audio Engine**
   - Deep espresso palette with warm caramel accents and fluid typography.
   - Built-in Web Audio API cozy café ambiance (soft rain, warm machine hum, steam hiss, stamp punch feedback).
   - Daylight Café / Midnight Velvet theme switcher.
2. **🧪 Interactive Brew Studio ("Build Your Dream Cup")**
   - Live layered SVG cup visualizer with real-time liquid transitions, floating ice cubes, crema clouds, and boba pearls.
   - Dynamic calorie, caffeine, and price calculator with custom naming.
3. **📋 Comprehensive Menu with 24+ Items**
   - Signature lattes, hot brews, frappes, cheesecake teas, refreshers, and artisan bites.
   - Live keyword search, category pills, and quick filters (Bestseller, Under ₱99, Low Calorie).
   - Item Customization Modal (size, sweetness, ice level, toppings).
4. **🛍️ Cart, Vouchers & Supabase Checkout**
   - Persistent cart with promo codes (`UNCLE39`, `FREESHIP`, `BREWVIP`).
   - Seamless checkout (Delivery, Curbside Pickup, Dine-in) with GCash, Maya, Card, or Cash.
   - Syncs orders directly to your Supabase `orders` table.
   - Interactive 4-stage Live Order Tracker.
5. **🗺️ Interactive Store Locator (Leaflet.js)**
   - Custom coffee cup markers across 150+ Philippine locations (Cebu, Manila, Iloilo, Davao).
6. **💼 Franchise Portal & Financial ROI Calculator**
   - Package comparisons (Kiosk Express, Standard Café, Prime Lounge).
   - Interactive financial model sliders (daily cups sold, ticket price) with Chart.js profit breakdown.
   - Franchise application form synced directly to Supabase `franchise_inquiries`.
7. **🎁 BrewClub Digital Loyalty Rewards**
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
