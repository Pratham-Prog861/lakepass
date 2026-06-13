# LakePass - Boat Rental Platform

LakePass is a modern, high-performance boat rental platform featuring a Marina Admin Dashboard and a Consumer Booking Experience. It is built using Next.js, styled with Vanilla CSS and Tailwind, and uses modern serverless architecture.

## Tech Stack

- **Frontend & Backend**: [Next.js](https://nextjs.org/) (App Router, dynamic API routes)
- **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Real-time Updates**: [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime) (serverless-compatible websocket events)
- **File & Image Storage**: [Supabase Storage](https://supabase.com/docs/guides/storage)
- **Payments**: [Stripe](https://stripe.com/)
- **Maps**: [Leaflet](https://leafletjs.com/) (Interactive marina and boat layouts)

---

## Getting Started

### 1. Installation

Install project dependencies using `pnpm`:

```bash
pnpm install --ignore-scripts
```

### 2. Environment Setup

Create a `.env` file in the root directory and configure the following credentials:

```env
# Database (Neon Serverless PostgreSQL connection string)
DATABASE_URL=postgresql://neondb_owner:...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Configurations (Storage & Realtime)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe Payment Integrations
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Weather Integration (OpenWeatherMap)
OPENWEATHERMAP_API_KEY=your-openweathermap-api-key
```

### 3. Database Operations

Manage your database schema and mock seed data using Drizzle commands:

```bash
# Push schema changes to Neon database
pnpm db:push

# Seed mock database entries (marinas, boats, reviews)
pnpm db:seed

# Open Drizzle Studio dashboard locally
pnpm db:studio
```

### 4. Running Locally

Run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to interact with the application.

---

## Deployment on Vercel

Since the custom Node.js server has been removed and replaced with Supabase Realtime, this project is fully compatible with serverless platforms like Vercel:

1. Import your repository to **Vercel**.
2. Configure the environment variables listed in `.env`.
3. Vercel will automatically run `pnpm run build` and launch the application.
