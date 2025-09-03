# Database Management Guide

## Overview
This document explains how to manage the ProdBay database, including migrations, seeding, and best practices.

## 🏗️ Database Structure

### Tables
- **suppliers**: Service providers and vendors
- **projects**: Client projects and briefs
- **assets**: Individual deliverables within projects
- **quotes**: Supplier proposals for assets

### Relationships
- Projects have many Assets (1:N)
- Assets can have one Supplier (N:1)
- Assets have many Quotes (1:N)
- Suppliers can quote on many Assets (N:N through quotes)

## 📋 Migration vs Seeding Strategy

### ✅ **Migrations (Schema Only)**
- **Purpose**: Define database structure, tables, constraints, and policies
- **Content**: CREATE TABLE, ALTER TABLE, CREATE POLICY, etc.
- **When**: Always run in production, staging, and development
- **File**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

### 🌱 **Seeding (Data Only)**
- **Purpose**: Populate database with initial/test data
- **Content**: INSERT statements for sample data
- **When**: Development and testing environments only
- **Files**: 
  - `supabase/seed.sql` (basic data, runs automatically)
  - `scripts/seed-dev.js` (comprehensive development data)

## 🚀 Available Commands

### Database Management
```bash
# Start Supabase services
npm run db:start

# Stop Supabase services
npm run db:stop

# Reset database (schema + basic seed)
npm run db:reset

# Add comprehensive development data
npm run seed:dev
```

### Development Workflow
```bash
# 1. Start services
npm run db:start

# 2. Reset database (if needed)
npm run db:reset

# 3. Add development data
npm run seed:dev

# 4. Start development server
npm run dev
```

## 🔄 Seeding Workflow

### 1. Basic Seed (`supabase/seed.sql`)
- **Automatically runs** after migrations
- **Minimal data** for basic functionality
- **Always present** in all environments
- **Content**: Essential suppliers, basic reference data

### 2. Development Seed (`scripts/seed-dev.js`)
- **Manual execution** when needed
- **Comprehensive data** for testing
- **Development only** - never in production
- **Content**: Projects, assets, quotes, additional suppliers

## 🎯 Best Practices

### ✅ **Do:**
- Keep migrations focused on schema changes only
- Use seed files for data population
- Separate basic seed (always) from development seed (optional)
- Document your seeding strategy
- Use npm scripts for common operations

### ❌ **Don't:**
- Put sample data in migration files
- Mix schema and data changes in migrations
- Use the same seed data in production
- Forget to document your approach

## 🛠️ Customization

### Adding New Seed Data
1. **Basic data**: Add to `supabase/seed.sql`
2. **Development data**: Add to `scripts/seed-dev.js`
3. **Environment-specific**: Create new seed files as needed

### Creating New Seed Scripts
```bash
# Create a new seed script
touch scripts/seed-custom.js

# Add to package.json
"seed:custom": "node scripts/seed-custom.js"
```

## 🔍 Troubleshooting

### Common Issues
- **Duplicate data**: Check for existing records before inserting
- **Foreign key errors**: Ensure referenced records exist
- **Migration conflicts**: Reset database and reapply migrations

### Reset Everything
```bash
# Complete reset
npm run db:stop
npm run db:start
npm run db:reset
npm run seed:dev
```

## 📊 Current Data Summary

After running both seed files:
- **Suppliers**: 10 total (5 basic + 5 additional)
- **Projects**: 5 sample projects
- **Assets**: 5 linked assets
- **Quotes**: 5 sample quotes

## 🔗 Useful Links
- **Supabase Studio**: http://127.0.0.1:54323
- **Web App**: http://localhost:5173
- **API**: http://127.0.0.1:54321
