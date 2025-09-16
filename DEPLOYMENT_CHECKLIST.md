# AI Allocation Feature - Deployment Checklist

## Pre-Deployment Checklist

### Backend (Railway) Configuration

#### Environment Variables
- [ ] `OPENAI_API_KEY` is set with valid OpenAI API key
- [ ] `SUPABASE_URL` is configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured
- [ ] `NODE_ENV` is set to `production`
- [ ] `PORT` is configured (default: 3000)

#### Dependencies
- [ ] `openai` package is installed (version ^4.20.1)
- [ ] All existing dependencies are up to date
- [ ] Package.json includes new test script: `npm run test:ai`

#### Database Migration
- [ ] AI allocation migration is applied: `20250121000000_ai_allocation_tables.sql`
- [ ] New tables created:
  - [ ] `ai_allocations`
  - [ ] `ai_processing_logs`
- [ ] Enhanced `projects` table with AI columns
- [ ] Indexes are created for performance
- [ ] RLS policies are applied

#### API Endpoints
- [ ] `/api/ai-allocate-assets` is accessible
- [ ] `/api/ai-suggest-suppliers` is accessible
- [ ] `/api/ai-allocate-project` is accessible
- [ ] `/api/ai-create-assets` is accessible
- [ ] `/api/ai-health` is accessible

### Frontend (Vercel) Configuration

#### Environment Variables
- [ ] `VITE_RAILWAY_API_URL` is set to Railway backend URL
- [ ] `VITE_SUPABASE_URL` is configured
- [ ] `VITE_SUPABASE_ANON_KEY` is configured

#### New Components
- [ ] `AIAllocationService` is properly imported and configured
- [ ] `NewProject.tsx` includes AI allocation toggle
- [ ] `ProducerDashboard.tsx` includes AI allocation controls
- [ ] All AI-related UI components are styled and functional

### Testing

#### Backend Testing
- [ ] Run `npm run test:ai` in railway-backend directory
- [ ] All AI API endpoints return expected responses
- [ ] Error handling works correctly
- [ ] Fallback mechanisms function properly

#### Frontend Testing
- [ ] AI toggle appears in New Project form
- [ ] AI allocation dropdown appears in Producer Dashboard
- [ ] AI modals open and display correctly
- [ ] Loading states work properly
- [ ] Error states are handled gracefully

#### Integration Testing
- [ ] End-to-end flow: Create project with AI → Process brief → View results
- [ ] AI suggestions are displayed correctly
- [ ] Apply AI suggestions functionality works
- [ ] Fallback to traditional processing works when AI fails

## Deployment Steps

### 1. Backend Deployment (Railway)

```bash
# Navigate to railway-backend directory
cd railway-backend

# Install new dependencies
npm install

# Test AI functionality
npm run test:ai

# Deploy to Railway
# (Railway will automatically deploy on git push)
```

### 2. Database Migration (Supabase)

```sql
-- Apply the AI allocation migration
-- This should be done through Supabase dashboard or CLI
-- File: supabase/migrations/20250121000000_ai_allocation_tables.sql
```

### 3. Frontend Deployment (Vercel)

```bash
# Navigate to project root
cd ..

# Build the project
npm run build

# Deploy to Vercel
# (Vercel will automatically deploy on git push)
```

## Post-Deployment Verification

### 1. Health Checks

#### Backend Health
```bash
# Test basic health
curl https://your-railway-backend-url/api/health

# Test AI health
curl https://your-railway-backend-url/api/ai-health
```

#### Frontend Health
- [ ] Application loads without errors
- [ ] All pages are accessible
- [ ] AI features are visible in UI

### 2. Functional Testing

#### AI Asset Analysis
1. Create a new project with AI enabled
2. Verify AI processes the brief
3. Check that assets are created with AI specifications
4. Verify confidence scores are displayed

#### AI Supplier Matching
1. Open Producer Dashboard
2. Select a project with existing assets
3. Use "AI Supplier Matching" feature
4. Verify supplier suggestions are generated
5. Test applying AI suggestions

#### Complete AI Allocation
1. Use "Complete AI Allocation" feature
2. Verify both assets and supplier allocations are generated
3. Test the complete workflow

### 3. Error Handling Verification

#### AI Service Failure
1. Temporarily disable OpenAI API key
2. Verify system falls back to traditional processing
3. Check that error messages are user-friendly

#### Network Issues
1. Test with slow network conditions
2. Verify timeout handling works correctly
3. Check loading states are appropriate

## Monitoring Setup

### 1. Log Monitoring
- [ ] Set up monitoring for `ai_processing_logs` table
- [ ] Monitor success/failure rates
- [ ] Track processing times
- [ ] Set up alerts for high error rates

### 2. Performance Monitoring
- [ ] Monitor OpenAI API response times
- [ ] Track database query performance
- [ ] Monitor memory usage during AI processing
- [ ] Set up alerts for performance degradation

### 3. Usage Analytics
- [ ] Track AI feature usage rates
- [ ] Monitor user adoption of AI features
- [ ] Analyze confidence score distributions
- [ ] Track user satisfaction with AI suggestions

## Rollback Plan

### If Issues Arise

#### Backend Rollback
1. Revert to previous Railway deployment
2. Remove AI-related environment variables
3. Disable AI endpoints in routing

#### Frontend Rollback
1. Revert to previous Vercel deployment
2. Remove AI-related UI components
3. Disable AI service imports

#### Database Rollback
```sql
-- Remove AI allocation tables (if needed)
DROP TABLE IF EXISTS ai_allocations;
DROP TABLE IF EXISTS ai_processing_logs;

-- Remove AI columns from projects table
ALTER TABLE projects 
DROP COLUMN IF EXISTS use_ai_allocation,
DROP COLUMN IF EXISTS ai_allocation_enabled_at;
```

## Success Criteria

### Technical Success
- [ ] All AI endpoints respond correctly
- [ ] AI processing completes within acceptable time limits (< 30 seconds)
- [ ] Fallback mechanisms work when AI fails
- [ ] No critical errors in production logs

### User Experience Success
- [ ] AI features are intuitive and easy to use
- [ ] Loading states provide clear feedback
- [ ] AI suggestions are relevant and useful
- [ ] Users can easily accept or reject AI recommendations

### Business Success
- [ ] AI features improve project creation efficiency
- [ ] Users adopt AI features at reasonable rates
- [ ] AI suggestions reduce manual work for producers
- [ ] System maintains reliability and performance

## Maintenance Tasks

### Regular Maintenance
- [ ] Monitor OpenAI API usage and costs
- [ ] Review and clean up old AI processing logs
- [ ] Update AI prompts based on user feedback
- [ ] Monitor and optimize database performance

### Monthly Reviews
- [ ] Analyze AI feature usage statistics
- [ ] Review error rates and common issues
- [ ] Assess user feedback and satisfaction
- [ ] Plan improvements and optimizations

---

*This checklist ensures a smooth deployment and operation of the AI allocation feature. Follow each step carefully and verify completion before proceeding to the next phase.*
