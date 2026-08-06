# Startaply HR Portal

A complete HR management system built for Startaply. Manage employees, attendance, leaves, tasks, and more.

## Features

### Admin Features
- 📊 Real-time dashboard with live employee status
- 👥 Employee management (create, edit, deactivate)
- ⏰ Attendance tracking with correction tools
- 📅 Leave management with approve/reject workflow
- ✅ Task management with Kanban board
- 📈 Reports with CSV export (Attendance, Work Hours, Performance)
- 📢 Company announcements
- 🔔 Notification center
- ⚙️ Configurable settings

### Employee Features
- 🕐 Clock in/out with live timer
- ☕ Break tracking with progress bar
- 📅 Leave application with balance tracking
- ✅ Task board with status updates
- 💬 Task comments
- 📢 Announcement feed
- 👤 Profile management
- 🔒 Password management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma v5.14.0 |
| Auth | NextAuth.js v4 |
| State | Zustand |
| Charts | Recharts |
| Real-time | Pusher |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd startaply-hr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your .env.local:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@startaply.com | Admin@123 |
| Employee 1 | rahul@startaply.com | Emp@123 |
| Employee 2 | priya@startaply.com | Emp@123 |
| Employee 3 | arjun@startaply.com | Emp@123 |
| Employee 4 | sneha@startaply.com | Emp@123 |
| Employee 5 | karan@startaply.com | Emp@123 |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Project Structure

```
startaply-hr/
├── app/
│   ├── (auth)/          # Login, change-password
│   ├── (admin)/         # All admin pages
│   ├── (employee)/      # All employee pages
│   └── api/             # API routes
├── components/
│   ├── admin/           # Admin-specific components
│   ├── employee/        # Employee-specific components
│   └── shared/          # Shared components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configs
├── store/               # Zustand stores
├── types/               # TypeScript types
└── prisma/              # Database schema and seed
```

## Deployment

### Switch to PostgreSQL for Production

1. Change DATABASE_URL in .env:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

2. Update prisma/schema.prisma:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Run migrations:
```bash
npm run db:migrate
npm run db:seed
```

4. Deploy to Vercel:
```bash
vercel deploy
```

## License
MIT
