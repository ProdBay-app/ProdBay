# ProdBay - Production Management Platform

ProdBay is a comprehensive production management web application that connects clients, producers, and suppliers to streamline the production process from initial brief to final delivery.

## Features

### 🎯 Core Functionality
- **Smart Brief Parsing**: Automatically identify required assets from project descriptions
- **Supplier Network Management**: Intelligent matching with relevant suppliers
- **Quote Management**: Streamlined quote collection and comparison
- **Real-time Tracking**: Monitor project progress and status updates

### 👥 User Roles

#### Client Portal
- Submit project briefs with requirements and parameters
- Real-time project dashboard with progress tracking
- Cost and timeline visibility
- Producer communication channel

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

### Prerequisites
- Node.js 16+ 
- Supabase account

### Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a new Supabase project
   - Click "Connect to Supabase" in the top right of Bolt
   - The database schema will be automatically created

3. **Environment Variables**
   The environment variables will be automatically set when you connect to Supabase.

4. **Start Development**
   ```bash
   npm run dev
   ```

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

### For Clients
1. Visit `/client/new` to create a new project
2. Fill out project brief with requirements
3. Monitor progress at `/client/dashboard`
4. Track costs, timelines, and status updates

### For Producers  
1. Access `/producer/dashboard` to view all projects
2. Review automatically created assets
3. Manage supplier network at `/producer/suppliers`
4. Send quote requests and review submissions
5. Accept quotes and track project progress

### For Suppliers
1. Receive email notification with quote request
2. Click unique link to access quote submission form
3. Submit cost and capacity details
4. Receive notification of quote acceptance/rejection

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