# 🌹 Secret Admirer — A Private Romantic Web Experience

A fully functional, production-ready Secret Admirer web application built with:
- **Vite** + **React** + **TypeScript**
- **Supabase** (Auth, PostgreSQL, Row Level Security, Realtime)
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- Deployable to **Vercel**

## ✨ Features

- Romantic landing page with animated secret message reveal
- Multi-step questionnaire with persistent local answers
- Registration/Login via Supabase Auth
- Private realtime chat between user and admin
- Real-time notifications
- Admin portal with user management, question editing, and stats
- Full Row Level Security — users can never access each other's data
- Role-based routing (user → /app, admin → /admin)
- Responsive, mobile-first design

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL migration (below) in the SQL Editor
3. Enable Email Auth in Authentication > Providers

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the SQL Migration

In Supabase SQL Editor, run the complete migration from the Setup Banner in the app,
or copy it from `src/components/SetupBanner.tsx`.

### 5. Create Admin Account

1. Register normally through the app
2. In Supabase SQL Editor:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin@email.com';
```

### 6. Configure Auth Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

### 7. Deploy to Vercel

```bash
vercel --prod
```

Set environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🗄️ Database Schema

See `src/components/SetupBanner.tsx` for the complete SQL migration including:
- Tables: profiles, questions, responses, conversations, conversation_members, messages, notifications
- Row Level Security policies
- Triggers (auto-create profile, update conversation timestamp)
- Seed data (7 romantic questions)

## 🔐 Security

- Row Level Security enabled on all tables
- Users can never read another user's data
- Users cannot change their own role
- Service role key never exposed to browser
- All auth via Supabase Auth
- Passwords never stored by the application

## 🛠️ Development

```bash
npm run dev    # Start development server
npm run build  # Production build
npm run preview # Preview production build
```

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
│   └── ui/          # Button, Input, Card, Modal, Toast...
├── contexts/        # React contexts (AuthContext)
├── layouts/         # AppLayout, AdminLayout
├── lib/             # Supabase client
├── pages/           # Page components
│   ├── app/         # User pages
│   └── admin/       # Admin pages
├── routes/          # ProtectedRoute, PublicOnlyRoute
├── services/        # Supabase service functions
├── types/           # TypeScript type definitions
└── utils/           # Error handling, cn utility
```
