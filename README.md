# ကား ပြင်ဆိုင် — Car Repair Shop Finder

A bilingual (English + Burmese) web app to help Myanmar drivers find trusted car repair shops, estimate repair costs, and locate shops on an interactive map.

---

## ✨ Features

- 🚗 **Car Selection** — Choose brand & model with dynamic loading
- ⚙️ **Problem Selection** — Pick from common car problems
- 💰 **Price Estimation** — Instant repair cost range in MMK
- 🔍 **Shop Search** — Find repair shops from database
- 🗺️ **Interactive Map** — OpenStreetMap via Leaflet.js with clickable markers
- 🌐 **Bilingual** — Switch between English and Burmese instantly
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## 🗂️ Project Structure

```
car-repair-app/
├── index.html          # Main HTML structure
├── style.css           # All styles (dark industrial theme)
├── app.js              # Application logic, Supabase queries, map
├── translations.js     # EN/MM translation dictionary
├── schema.sql          # Supabase database schema + sample data
└── README.md           # This file
```

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and create a new project
3. Note your **Project URL** and **Publishable Key**

### Step 2: Run the Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open `schema.sql` from this project
3. Copy and paste the entire content into the editor
4. Click **Run**

This will:
- Create all 5 tables with proper relationships
- Add indexes for performance
- Enable Row Level Security (public read access)
- Insert sample data (8 brands, 30+ models, 10 problems, 12 shops)

### Step 3: Update Configuration (if using your own Supabase project)
In `app.js`, update the config at the top:
```javascript
const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL',
  key: 'YOUR_PUBLISHABLE_KEY'
};
```

> ✅ The project is pre-configured with the demo Supabase project.

---

## 💻 Running Locally

### Option A: Simple (no server needed)
Since this app uses only vanilla JS + external APIs, you can open it directly:

```bash
# Just open index.html in your browser
open index.html         # macOS
start index.html        # Windows
xdg-open index.html     # Linux
```

> ⚠️ Some browsers block fetch requests from `file://` URLs due to CORS.  
> Use Option B if you see network errors.

### Option B: Local Server (recommended)

**Using Python:**
```bash
cd car-repair-app
python3 -m http.server 8080
# Open: http://localhost:8080
```

**Using Node.js (npx):**
```bash
cd car-repair-app
npx serve .
# Open the URL shown in terminal
```

**Using VS Code:**
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, then right-click `index.html` → **Open with Live Server**.

---

## 🚀 Deploying to GitHub Pages

### Step 1: Create a GitHub Repository
```bash
# Initialize git in project folder
cd car-repair-app
git init
git add .
git commit -m "Initial commit: ကား ပြင်ဆိုင် app"
```

### Step 2: Create GitHub Repo & Push
```bash
# Create repo at https://github.com/new (name it: car-repair-app)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/car-repair-app.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** in the left sidebar
4. Under **Source**, select `Deploy from a branch`
5. Choose `main` branch and `/ (root)` folder
6. Click **Save**

### Step 4: Your Site is Live! 🎉
After 1-2 minutes, your app will be at:
```
https://YOUR_USERNAME.github.io/car-repair-app/
```

---

## 🛠️ Tech Stack

| Layer     | Technology                              |
|-----------|------------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript (ES6+)  |
| Database  | Supabase (PostgreSQL)                   |
| Maps      | OpenStreetMap + Leaflet.js              |
| Fonts     | Google Fonts (Bebas Neue, DM Sans, Noto Sans Myanmar) |
| Hosting   | GitHub Pages (free)                     |

---

## 📊 Database Tables

| Table           | Description                          |
|-----------------|--------------------------------------|
| `car_brands`    | Car manufacturers (Toyota, Honda...) |
| `car_models`    | Models per brand (Corolla, Civic...)  |
| `car_problems`  | Common repair issues                 |
| `repair_prices` | Min/max price per problem (MMK)      |
| `repair_shops`  | Shop name, address, GPS, phone       |

---

## 🌐 Language Support

The app supports instant switching between:
- 🇬🇧 **English** 
- 🇲🇲 **Burmese (မြန်မာ)**

Edit `translations.js` to add more languages or update existing strings.

---

## 🔧 Adding More Data

To add more repair shops, run this SQL in Supabase:
```sql
INSERT INTO repair_shops (shop_name, address, city, latitude, longitude, phone) 
VALUES ('Your Shop Name', 'Your Address', 'Your City', LAT, LNG, 'Phone');
```

To add more car brands/models:
```sql
INSERT INTO car_brands (name_en, name_mm) VALUES ('Brand EN', 'Brand MM');
INSERT INTO car_models (brand_id, name_en, name_mm) VALUES (ID, 'Model EN', 'Model MM');
```

---

## 🔒 Security Notes

- Only the **publishable key** is used (safe to expose in frontend code)
- Row Level Security (RLS) is enabled — only `SELECT` is allowed publicly
- No sensitive write operations are exposed

---

## 📝 License

MIT License — Free to use, modify, and distribute.

---

*Built with ❤️ for Myanmar drivers • မြန်မာ ယာဉ်မောင်းများအတွက် တည်ဆောက်သည်*
