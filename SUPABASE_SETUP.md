# Setup Instructions - Client-Side Only

Your website is now a **client-side only application** that uses Supabase directly from the browser. No Node.js server needed!

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose a name (e.g., "artwork-gallery")
5. Set a database password (save it securely)
6. Choose a region closest to you
7. Click "Create new project"

## 2. Get Your Supabase Credentials

Once your project is created:

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)

## 3. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `users` table (extends Supabase auth)
- `artworks` table
- Storage bucket for images
- Row Level Security policies

## 4. Configure Your Website

Open each HTML file and replace the placeholder credentials:

**In `public/index.html`, `public/admin.html`, and `public/dashboard.html`:**

```html
<script>
    // Supabase Configuration - Replace with your credentials
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
```

Replace:
- `YOUR_SUPABASE_URL` with your actual Project URL
- `YOUR_SUPABASE_ANON_KEY` with your actual anon/public key

## 5. Run Your Website

**Simply open the HTML files in your browser!**

- Open `public/index.html` to view the gallery
- Open `public/admin.html` to access the admin panel

Or use a local server (optional):
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have it installed)
npx serve

# Then open http://localhost:8000
```

## 6. Register Admin User

1. Open `admin.html` in your browser
2. Click "Register"
3. Enter your email and password
4. You'll be automatically logged in as admin

## What Changed

- **No Node.js server needed** - Everything runs in the browser
- **No npm install** - Uses CDN for Supabase JS client
- **Direct Supabase integration** - All database/auth/storage operations done from frontend
- **Login**: Uses email instead of username

## Notes

- The first user you register will be the admin
- All subsequent registrations will also be admin (you can modify this in the code)
- Images are stored in Supabase Storage under the `artwork-images` bucket
- The database is hosted and managed by Supabase - no local database needed
- Your credentials are stored in the HTML files - don't commit them to public repositories!
