# 🦞 Seafood Sam's — Inventory Tracker

A web-based inventory tracking application for **Seafood Sam's** restaurant in Falmouth, MA. Built as a replacement for the discontinued Sysco Inventory application.

![Inventory Tracker](https://img.shields.io/badge/Items_Tracked-384-blue)
![Locations](https://img.shields.io/badge/Locations-13-green)
![Categories](https://img.shields.io/badge/Categories-4-orange)

## Features

### Track Inventory
- View and search all 384 inventory items
- Filter by **location** (Cellar, Inside Freezer, Upstairs Walkin, etc.)
- Filter by **expense category** (Food, Beer & Wine, Paper & Supplies, Merchandise)
- Sort by any column (name, category, location, quantity, price, value, date)
- **Inline quantity editing** with batch save — update counts right in the table
- Paginated table (50 items per page)

### Summary Dashboard
- Total inventory value breakdown by category with pie chart
- Value by location overview
- **Close Inventory Period** — timestamps all items for period-end reporting

### Food Cost Calculator
- Beginning Inventory + Purchases − Ending Inventory = Cost of Goods Sold
- Ending inventory auto-calculated from current stock
- Category-level breakdown of current inventory value

### Manage
- View all expense categories, locations, and suppliers
- Quick stats (total items, total value, zero-stock count, highest-value item)

### Item Management
- **Add** new inventory items with full details
- **Edit** existing items (name, ID, category, location, quantity, price, unit)
- **Delete** items with confirmation
- **Export** full inventory to CSV

## Getting Started

### Option 1: Local Web Server (Recommended)

Since the app loads data from a JSON file via `fetch()`, you need to serve it from a web server:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/seafood-sams-inventory.git
cd seafood-sams-inventory

# Serve with Python
python3 -m http.server 8000

# Or with Node.js
npx serve
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: GitHub Pages

1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select `main` branch and `/ (root)` folder
4. Click **Save**
5. Your app will be live at `https://YOUR_USERNAME.github.io/seafood-sams-inventory/`

## Project Structure

```
seafood-sams-inventory/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css          # All styles
├── js/
│   └── app.js              # React application (no build step needed)
├── data/
│   └── inventory.json      # Inventory data (384 items from Sysco export)
└── README.md
```

## Technology

- **React 18** — loaded from CDN, no build tools required
- **Plain JavaScript** — no JSX, no Babel, no transpilation
- **CSS custom properties** — consistent theming with ocean/nautical palette
- **Google Fonts** — DM Sans + Playfair Display

No `npm install`, no webpack, no build step. Just static files you can host anywhere.

## Data

The initial inventory data (`data/inventory.json`) was exported from the Sysco Inventory application on November 17, 2025. It contains 384 items across:

| Category | Items | Value |
|---|---|---|
| Paper & Supplies | 123 | $19,288.57 |
| Food | 228 | $17,660.17 |
| Merchandise | 9 | $4,443.00 |
| Beer & Wine | 24 | $1,105.10 |
| **Total** | **384** | **$42,496.67** |

### Locations (13)
Beer/Wine, Bread Supplies, Cellar, Cellar Walkin, Dairy, Inside Freezer, Marion Prep Stuff, Misc, Outside Freezer, PRODUCE, Pepsi products, Sam's Merchandise, Upstairs Walkin

### Suppliers (20)
Amazon, BJs, Cape Fish, CCP, Colonial, Gordon Foods, Henny Penny, HT Berry, Lamarca, Lou Knife, Marks, Martinetti, Northcoast, Pepsi, RAW SEAFO, RTI, Staples, Sysco, U S Foods, Uline

## License

Private — for Seafood Sam's internal use.
