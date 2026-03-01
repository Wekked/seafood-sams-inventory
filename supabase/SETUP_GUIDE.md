# Supabase Setup Guide — Seafood Sam's Inventory

Follow these steps in order. Total time: ~15 minutes.

---

## Step 1: Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** and sign up (free tier is fine)
2. Click **New Project**
3. Settings:
   - **Name:** `seafood-sams-inventory`
   - **Database Password:** choose something strong (you won't need this in the app)
   - **Region:** `US East (N. Virginia)` — closest to Falmouth, MA
4. Click **Create new project** and wait ~2 minutes for it to spin up

---

## Step 2: Create the Database Tables

1. In your project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase/schema.sql` from the repo
4. **Copy the entire contents** and paste into the SQL editor
5. Click **Run**
6. You should see "Success. No rows returned" — this means the tables were created

This creates 3 tables:
- **`items`** — your 384 inventory items with all fields
- **`profiles`** — user display names and roles (linked to Supabase Auth)
- **`location_sort_orders`** — your custom walkthrough counting order per location

---

## Step 3: Import Your Inventory Data

1. Still in **SQL Editor**, click **New Query** again
2. Open the file `supabase/seed.sql` from the repo
3. **Copy the entire contents** and paste into the SQL editor
4. Click **Run**
5. You should see a summary table showing your 4 categories and item counts:

| category | item_count | total_value |
|---|---|---|
| Paper & Supplies | 123 | 19288.57 |
| Food | 228 | 17660.17 |
| Merchandise | 9 | 4443.00 |
| Beer & Wine | 24 | 1105.10 |

---

## Step 4: Create User Accounts

1. Go to **Authentication** (left sidebar) → **Users**
2. Click **Add User** → **Create new user**
3. Create your accounts:

| Email | Password | Display Name |
|---|---|---|
| `admin@seafoodsams.com` | `seafoodsams` | Admin |
| `manager@seafoodsams.com` | `falmouth1` | Manager |
| `staff@seafoodsams.com` | `inventory1` | Staff |

For each user, fill in:
- **Email**: the email above
- **Password**: the password above
- **Auto Confirm User**: toggle ON (skips email verification)
- Click **Create user**

> **Note:** Since we set up the `handle_new_user` trigger in Step 2, a profile row is automatically created for each user. To set the display name and role, go to **Table Editor** → **profiles** and edit the `display_name` and `role` columns for each user.

---

## Step 5: Get Your API Keys

1. Go to **Settings** (gear icon, left sidebar) → **API**
2. You need two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon (public) key** — a long string starting with `eyJ...`

---

## Step 6: Connect the App

1. Open `js/supabase-client.js` in the repo
2. Replace the two placeholder values at the top:

```javascript
var SUPABASE_URL = 'https://abcdefghijkl.supabase.co';    // ← your Project URL
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';       // ← your anon key
```

3. Save and commit to GitHub
4. Wait 1-2 minutes for GitHub Pages to rebuild

---

## Step 7: Enable Realtime (Multi-Device Sync)

This should already be done by the SQL script, but to verify:

1. Go to **Database** → **Replication** (or **Database** → **Publications**)
2. Find `supabase_realtime`
3. Make sure both **items** and **location_sort_orders** are listed
4. If not, toggle them on

This is what makes it so when you update a quantity on your phone, the change appears on the laptop instantly.

---

## Step 8: Test It

1. Go to your GitHub Pages URL: `https://wekked.github.io/seafood-sams-inventory/`
2. Log in with `admin@seafoodsams.com` / `seafoodsams`
3. You should see:
   - All 384 items loaded from the database
   - A green **"Synced"** badge in the top-right header
4. Try editing a quantity, clicking "Save All Changes"
5. Open the same URL on your phone — the change should be there

---

## Troubleshooting

### "Failed to load inventory data"
- Make sure your Supabase URL and anon key are correct in `supabase-client.js`
- Check browser console (F12) for specific error messages

### Login fails
- Make sure you used the email format (e.g., `admin@seafoodsams.com`), not just `admin`
- Make sure "Auto Confirm User" was toggled on when creating users
- Check **Authentication** → **Users** to see if the users exist and are confirmed

### Shows "Local" instead of "Synced"
- The Supabase URL still has `YOUR_PROJECT_ID` in it — replace with your actual project URL
- Make sure the `supabase-client.js` script is loading before `app.js` (check index.html order)

### Data shows but changes don't save
- Check RLS policies: go to **Authentication** → **Policies** and verify the policies from schema.sql exist
- The anon key only works with RLS enabled — make sure all 3 tables have policies

### Realtime not working (changes not appearing on other devices)
- Go to **Database** → **Replication** and confirm `items` is published
- Some ad blockers block WebSocket connections — try disabling them

---

## Database Schema Reference

### items
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Auto-increment ID |
| `item_number` | TEXT | Supplier code (e.g., "Sys112346") |
| `name` | TEXT | Item name |
| `category` | TEXT | "Food", "Beer & Wine", "Paper & Supplies", "Merchandise" |
| `location` | TEXT | Storage location (e.g., "Cellar", "Inside Freezer") |
| `quantity` | NUMERIC(10,2) | Quantity on hand |
| `quantity_unit` | TEXT | "CS", "PK", or "LB" |
| `price` | NUMERIC(10,2) | Unit price |
| `price_unit` | TEXT | "CS", "PK", or "LB" |
| `total_value` | NUMERIC(10,2) | quantity × price |
| `last_counted` | DATE | When last counted |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Auto-updated on changes |

### profiles
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK, FK) | Links to auth.users |
| `display_name` | TEXT | Shown in the app header |
| `role` | TEXT | "admin", "manager", or "staff" |

### location_sort_orders
| Column | Type | Description |
|---|---|---|
| `location_name` | TEXT (PK) | e.g., "Cellar" |
| `item_order` | INTEGER[] | Array of item IDs in walkthrough order |
