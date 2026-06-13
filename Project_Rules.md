SCAN THE CURRENT DIRECTORY FIRST.

Before making any code changes:

1. Scan and analyze the entire project structure.
2. Read all existing files, folders, dependencies, and configurations.
3. Understand the current architecture before implementing anything.
4. Reuse existing code whenever possible.
5. Do not create duplicate components, hooks, services, schemas, types, providers, or utilities.
6. Follow the existing coding conventions and project structure.
7. Explain what files will be created, modified, or deleted before implementation.
8. Generate production-quality code only.
9. Never use "any" types.
10. Implement features incrementally.
11. Wait for approval before moving to the next feature.
12. If a better architectural approach exists, explain it before implementation.

==================================================
PROJECT OVERVIEW
==================================================

Build LakePass MVP.

LakePass is a two-sided boat rental platform consisting of:

1. Marina Admin Dashboard (B2B SaaS)
2. Consumer Booking Experience (Mobile-First Web App)

This must be built as a SINGLE NEXT.JS APPLICATION.

DO NOT CREATE:

- Monorepo
- React Native App
- Expo App
- Separate Frontend Repository
- Separate Backend Repository
- Microservices

Use Next.js App Router and Route Handlers.

==================================================
CURRENT PROJECT SETUP
==================================================

Already Installed:

- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN UI
- App Router

Build on top of the existing setup.

==================================================
TECH STACK
==================================================

Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN UI
- React Hook Form
- Zod
- TanStack Query
- Zustand
- Recharts
- Lucide React
- Sonner

Backend

- Next.js Route Handlers
- Node.js Runtime

Authentication

- Clerk
- Google Login
- Email Login

Database

- PostgreSQL 16+
- Docker Container
- PostGIS Extension

ORM

- Drizzle ORM

Storage

- Supabase Storage ONLY

Realtime

- Socket.IO

Payments

- Stripe Test Mode

Maps

- React Leaflet
- OpenStreetMap

Weather

- OpenWeatherMap

==================================================
DATABASE INFRASTRUCTURE
==================================================

Use PostgreSQL running inside Docker.

DO NOT USE:

- Supabase Database
- Supabase Auth
- Neon Database
- Railway Database
- PlanetScale
- Local PostgreSQL Installation

Database Architecture:

Next.js
    │
    ▼
Route Handlers
    │
    ▼
Drizzle ORM
    │
    ▼
PostgreSQL (Docker Container)
    │
    ▼
PostGIS

Required Deliverables:

- docker-compose.yml
- Drizzle configuration
- Database connection
- Migration setup
- Seed setup
- Environment variables

Use:

postgis/postgis:16-3.4

Docker Compose should start the database using:

docker compose up -d

Use persistent Docker volumes.

Enable PostGIS.

All database operations must go through Drizzle ORM.

Never access the database directly from UI components.

==================================================
PROJECT ARCHITECTURE
==================================================

Use a scalable feature-based architecture.

src/

app/

(admin)/
dashboard/
boats/
bookings/
analytics/
settings/

(consumer)/
page.tsx
boats/
boats/[id]/
bookings/
profile/
map/

api/
auth/
marinas/
boats/
bookings/
upload/
stripe/
weather/
socket/

layout.tsx

components/

features/
auth/
marinas/
boats/
bookings/
analytics/
maps/
payments/

hooks/

lib/

db/
drizzle.ts

clerk.ts
supabase.ts
stripe.ts
socket.ts
weather.ts

schemas/

types/

providers/

constants/

==================================================
DATABASE SCHEMA
==================================================

users

- id
- clerk_id
- email
- role
- created_at

marinas

- id
- name
- description
- latitude
- longitude
- created_at

boats

- id
- marina_id
- name
- description
- type
- capacity
- price_per_hour
- image_url
- created_at

bookings

- id
- boat_id
- user_id
- start_time
- end_time
- total_amount
- status
- created_at

reviews

- id
- boat_id
- user_id
- rating
- comment
- created_at

==================================================
ROLES
==================================================

marina_owner

consumer

==================================================
AUTHENTICATION
==================================================

Use Clerk.

Implement:

- Email Login
- Google Login
- Session Management
- Protected Routes
- Role-Based Access

Admin Routes:

Only marina_owner can access.

Consumer Routes:

Accessible to consumers.

Persist Clerk user data inside PostgreSQL.

==================================================
ADMIN DASHBOARD
==================================================

Design Inspiration:

- Stripe
- Vercel
- Linear
- Notion

Desktop-first SaaS dashboard.

Features:

Dashboard

- Total Boats
- Total Bookings
- Revenue Summary
- Recent Activity
- Booking Trends

Marina Management

- Create Marina
- Edit Marina
- View Marina

Boat Management

- Create Boat
- Edit Boat
- Delete Boat
- Search Boats
- Filter Boats

Bookings

- Upcoming
- Completed
- Cancelled
- Booking Details

Analytics

- Revenue Chart
- Booking Chart
- Boat Utilization Chart

Settings

- Profile Settings
- Marina Information

==================================================
CONSUMER EXPERIENCE
==================================================

IMPORTANT:

The consumer experience must feel like a REAL MOBILE APPLICATION.

Even though it is built with Next.js.

Users should feel like they are using:

- Airbnb
- Uber
- Booking.com

on mobile devices.

==================================================
MOBILE-FIRST DESIGN REQUIREMENTS
==================================================

Use:

max-w-md mx-auto

Consumer UI must be mobile-first.

Desktop should display a centered mobile experience.

Use:

- Sticky Header
- Fixed Bottom Navigation
- Large Touch Targets
- Smooth Animations
- Card-Based Layout
- Native App Feel
- Skeleton Loading
- Pull-to-refresh style UX where possible

==================================================
BOTTOM TAB NAVIGATION
==================================================

Create a persistent fixed bottom navigation similar to Expo / React Native apps.

Tabs:

1. Home
2. Bookings
3. Map
4. Profile

Navigation must remain visible while browsing.

==================================================
HOME SCREEN
==================================================

Airbnb-style experience.

Sections:

- Search Bar
- Featured Boats
- Popular Marinas
- Nearby Marinas
- Recommended Boats

Use visually rich cards and images.

==================================================
BOAT DETAILS SCREEN
==================================================

Display:

- Image Gallery
- Boat Name
- Description
- Capacity
- Amenities
- Marina Information
- Weather Information
- Pricing
- Book Now CTA

==================================================
BOOKING FLOW
==================================================

Modern booking experience.

Flow:

Boat Details
→ Select Date
→ Select Time
→ Booking Summary
→ Stripe Checkout
→ Booking Confirmation

==================================================
BOOKINGS SCREEN
==================================================

Display:

- Upcoming
- Completed
- Cancelled

Use card-based layouts.

==================================================
PROFILE SCREEN
==================================================

Display:

- User Information
- Booking History
- Account Settings
- Logout

==================================================
MAP SCREEN
==================================================

Use:

- React Leaflet
- OpenStreetMap

Display:

- User Location
- Marina Locations
- Boat Locations

==================================================
IMAGE STORAGE
==================================================

Use Supabase Storage ONLY.

Store:

- Boat Images
- Marina Images
- User Profile Images

Flow:

Upload
→ Supabase Storage
→ Public URL
→ Save URL in PostgreSQL

Do NOT use:

- Supabase Auth
- Supabase Database

==================================================
REALTIME
==================================================

Use Socket.IO.

Realtime Events:

- New Booking Created
- Booking Status Updated

Flow:

Consumer
→ API Route
→ PostgreSQL
→ Socket Event
→ Admin Dashboard Updates Instantly

==================================================
PAYMENTS
==================================================

Use Stripe Test Mode.

Implement:

- Create Checkout Session
- Success Page
- Failure Page
- Booking Confirmation

No production onboarding required.

==================================================
WEATHER
==================================================

Use OpenWeatherMap.

Display:

- Temperature
- Wind Speed
- Conditions

inside Boat Details.

==================================================
MAPS
==================================================

Use React Leaflet.

Use OpenStreetMap.

No Google Maps API.

==================================================
UI REQUIREMENTS
==================================================

Modern.

Premium.

Responsive.

Accessible.

Dark Mode Support.

Loading States.

Error States.

Empty States.

Skeleton Loaders.

Reusable Components.

Professional Animations.

Consistent Design System.

==================================================
CODE QUALITY
==================================================

- Strict TypeScript
- No any types
- Feature-Based Architecture
- Reusable Hooks
- Reusable Services
- Reusable Schemas
- Reusable Types
- Client Validation
- Server Validation
- Error Handling
- Clean Architecture
- Production Ready Code

==================================================
IMPLEMENTATION PROCESS
==================================================

Always follow this workflow:

1. Scan the current directory.
2. Analyze all files and dependencies.
3. Present implementation plan.
4. Show files to create/modify.
5. Implement ONE feature at a time.
6. Wait for approval before continuing.

START WITH:

Phase 1
- Docker PostgreSQL Setup
- PostGIS Setup
- Drizzle ORM Setup
- Clerk Authentication
- Route Protection

Phase 2
- Database Schema
- Admin Layout
- Consumer Mobile Layout
- Bottom Navigation

Phase 3
- Marina CRUD
- Boat CRUD

Phase 4
- Consumer Home
- Boat Details
- Booking Flow

Phase 5
- Stripe Integration
- Supabase Storage
- Socket.IO Realtime

Phase 6
- Maps
- Weather
- Analytics
- Final UI Polish
- Production Readiness

==================================================
USER SYNCHRONIZATION
==================================================

Use Clerk as the authentication provider.

When a user signs up or signs in using Clerk:

- Automatically create a corresponding record in PostgreSQL.
- Store:

users

- id
- clerk_id
- email
- full_name
- avatar_url
- role
- created_at
- updated_at

Requirements:

- Clerk is the source of truth for authentication.
- PostgreSQL is the source of truth for application data.
- Create user automatically after first login.
- Update existing user information when Clerk profile changes.
- Keep avatar_url synchronized with Clerk.
- Store clerk_id for all authenticated users.

Flow:

Clerk Login
→ Check Database
→ Create User If Missing
→ Sync User Data
→ Continue Session

==================================================
SUPABASE STORAGE REQUIREMENTS
==================================================

Use Supabase Storage ONLY.

Do NOT use:

- Supabase Auth
- Supabase Database

Store:

- Boat Images
- Marina Images
- Profile Images

Upload Flow:

Upload Image
→ Supabase Storage
→ Public URL
→ Save URL into PostgreSQL

Requirements:

- Never store image binaries in PostgreSQL.
- Only store image URLs.
- Organize storage buckets:

boat-images/
marina-images/
profile-images/

All image rendering must use URLs stored in PostgreSQL.

==================================================
DESIGN REQUIREMENTS
==================================================

IMPORTANT:

Do NOT generate an AI-looking website.

Avoid:

- Purple gradients
- Neon colors
- AI startup aesthetics
- Excessive glassmorphism
- Random floating elements
- Overly flashy animations

Design Inspiration:

- Airbnb
- Stripe
- Linear
- Vercel
- Notion
- Booking.com

Requirements:

- Respect existing ShadCN setup.
- Respect existing global.css.
- Respect existing Tailwind theme.
- Reuse existing design tokens.
- Do not create a new color system.
- Do not override the current design system.

Admin Dashboard:

- Professional SaaS dashboard
- Tables
- Charts
- Analytics
- Sidebar navigation

Consumer App:

- Mobile-first
- Airbnb-inspired
- Image-first design
- Native app feel
- Fixed bottom tabs

Before creating UI:

1. Inspect global.css
2. Inspect Tailwind configuration
3. Inspect ShadCN setup
4. Reuse existing theme variables
5. Build consistent UI

The final result should look like a real startup product, not an AI-generated demo.


IMPORTANT:

Prefer Server Components whenever possible.

Use Client Components only when necessary for:

- Forms
- Interactivity
- Zustand
- React Query
- Socket.IO

Follow Next.js 15 best practices.
Optimize for performance, maintainability, and scalability.


PROJECT_RULES.md
├── Architecture
├── Tech Stack
├── Database
├── Authentication
├── Admin Dashboard
├── Consumer App
├── Storage
├── Realtime
├── Payments
├── Maps
├── Weather
├── UI Requirements
├── Coding Standards
└── Implementation Phases