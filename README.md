# ProdBay - Production Management Platform

ProdBay is a comprehensive production management web application that connects clients, producers, and suppliers to streamline the production process from initial brief to final delivery.

## Features

### 🎯 Core Functionality
- **Smart Brief Parsing**: Automatically identify required assets from project descriptions
- **Supplier Network Management**: Intelligent matching with relevant suppliers
- **Quote Management**: Streamlined quote collection and comparison
- **Real-time Tracking**: Monitor project progress and status updates

### 👥 User Roles

#### Producer Portal
- Project oversight dashboard
- Asset management and coordination
- Supplier network management
- Quote review and acceptance workflow

#### Supplier Portal
- Email-based quote requests (no login required)
- Simple quote submission interface
- Direct project access via unique links

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Database Schema

### Projects
- Project details (name, client, brief, parameters)
- Timeline and budget information
- Status tracking

### Assets
- Project-specific requirements
- Specifications and timelines
- Supplier assignments

### Suppliers
- Contact information
- Service categories
- Capabilities

### Quotes
- Cost proposals
- Supplier capacity notes
- Status tracking with unique tokens

## Getting Started
## Deploying to Railway

1. Push your repo to GitHub/GitLab.
2. In Railway, create a New Project → Deploy from Repo → select this repo.
3. Configure variables in Railway → Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional `PORT` (Railway provides one; our start script reads it)
4. Build & start commands (Railway auto-detects):
   - Build: `npm run build`
   - Start: `npm run start`
5. Set Node version (Project Settings → Environment): Node 18+ is required (we declare `engines.node >=18`).
6. Apply database schema in your Supabase project using the SQL in `supabase/migrations/20250820125716_crimson_disk.sql`.
7. Deploy. Railway will serve the static build via Vite preview.
 
Notes:
- The app requires valid Supabase vars at build time. Ensure variables are present in Railway before the first deployment.
- Default port is taken from `PORT` env; our script falls back to 4174 for local runs.


### Prerequisites
- Node.js 18+ (recommend 20 LTS)
- Supabase account (hosted) or Supabase CLI for local

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a Supabase project (dashboard) OR run `supabase start` (CLI) for local
   - Apply schema from `supabase/migrations/20250820125716_crimson_disk.sql` using the SQL editor or CLI

3. **Environment Variables**
   - Copy one of the examples and fill in your values
   ```bash
   # local dev
   cp env.local.example .env.local
   # production build preview
   cp env.production.example .env.production
   ```
   Required keys (Vite will expose only `VITE_` prefixed):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Start Development**
   ```bash
   npm run dev
   # http://localhost:5173
   ```

5. **Production build and local preview**
   ```bash
   npm run build
   npm run start
   # default: http://localhost:4174 (set PORT=xxxx to override)
   ```

### Troubleshooting blank page after build
- Ensure `.env.production` exists and contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running `npm run build`.
- Check DevTools Console for messages starting with `[Supabase]` indicating missing env.
- Rebuild after setting envs.

## Automated Workflows

### Project Creation Flow
1. Client submits project brief
2. System automatically parses brief to identify required assets
3. Assets are created in database with specifications
4. Relevant suppliers are identified based on service categories

### Quote Request Flow
1. Producer reviews assets and clicks "Send to Suppliers"
2. System automatically emails relevant suppliers with quote requests
3. Each supplier receives unique link with project details
4. Quotes are collected and organized for producer review

### Quote Acceptance Flow
1. Producer reviews submitted quotes
2. Accepts best quote for each asset
3. System automatically assigns supplier to asset
4. Other quotes for same asset are rejected
5. Project status updates based on asset progress

## User Journey

### For Producers  
1. Access `/producer/dashboard` to view all projects
2. Review automatically created assets
3. Manage supplier network at `/producer/suppliers`
4. Send quote requests and review submissions
5. Accept quotes and track project progress

### For Suppliers
1. Access `/supplier/quotes` to view quotes you have submitted
2. Use `/supplier/submit` to upload a new quote for an asset
3. Alternatively, follow unique email links to submit quotes for specific requests

## Key Automation Features

- **Asset Parsing**: Automatically identifies printing, staging, audio, lighting, catering, transport, and design requirements from project briefs
- **Supplier Matching**: Matches suppliers to assets based on service category alignment
- **Email Generation**: Creates personalized quote request emails with project context
- **Status Tracking**: Updates project and asset statuses based on quote acceptances
- **Real-time Updates**: Synchronizes data across all user interfaces

## Project Structure

```
src/
├── components/
│   ├── client/          # Client portal components
│   ├── producer/        # Producer portal components
│   ├── supplier/        # Supplier portal components
│   └── Layout.tsx       # Shared layout component
├── lib/
│   └── supabase.ts      # Database client and types
├── services/
│   └── automationService.ts  # Business logic automation
└── App.tsx              # Main application router
```

## Contributing

ProdBay is designed as a production-ready MVP with a focus on:
- Clean, maintainable code architecture
- Comprehensive business logic automation
- Professional user experience across all roles
- Scalable database design

The application demonstrates modern web development practices with TypeScript, React hooks, and modular component design.