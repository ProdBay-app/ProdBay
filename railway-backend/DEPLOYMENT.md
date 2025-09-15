# Railway Deployment Guide

This guide will help you deploy the ProdBay backend service to Railway.

## Prerequisites

1. Railway account (sign up at [railway.app](https://railway.app))
2. Supabase project with the ProdBay database schema
3. Supabase service role key

## Railway Configuration Files

The project includes multiple configuration files for Railway:

- **`railway.toml`** - Primary Railway configuration (preferred)
- **`nixpacks.toml`** - Alternative Nixpacks configuration  
- **`Dockerfile`** - Docker-based deployment option

Railway will prioritize `railway.toml` over other configuration methods.

## Step 1: Prepare Your Repository

1. Create a new repository for the backend service
2. Copy all files from the `railway-backend/` directory to your new repository
3. Commit and push to your repository

## Step 2: Deploy to Railway

1. **Connect Repository:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your backend repository

2. **Configure Environment Variables:**
   - In your Railway project dashboard, go to "Variables" tab
   - Add the following environment variables:

   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

3. **Deploy:**
   - Railway will use the `railway.toml` configuration to deploy the Node.js backend
   - The service will be available at a Railway-generated URL
   - Make sure the deployment shows "Dockerfile" as the build method in the configuration

## Step 3: Get Your Railway URL

1. After deployment, go to your project dashboard
2. Click on your service
3. Go to the "Settings" tab
4. Copy the "Domain" URL (e.g., `https://your-service.railway.app`)

## Step 4: Test Your Deployment

1. **Health Check:**
   ```bash
   curl https://your-service.railway.app/api/health
   ```

2. **Test Brief Processing:**
   ```bash
   curl -X POST https://humorous-encouragement-development.up.railway.app/api/process-brief \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "123e4567-e89b-12d3-a456-426614174000",
       "briefDescription": "Test brief for corporate event"
     }'
   ```

## Step 5: Update Frontend Configuration

Update your frontend environment variables to point to the new Railway endpoint:

```env
VITE_RAILWAY_API_URL=https://your-service.railway.app
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Your Supabase project URL | Yes | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NODE_ENV` | Environment mode | No | `production` |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | `https://app.vercel.app,http://localhost:5173` |
| `PORT` | Server port | No | `3000` (Railway sets this automatically) |

## Monitoring and Logs

1. **View Logs:**
   - Go to your Railway project dashboard
   - Click on your service
   - Go to the "Deployments" tab
   - Click on a deployment to view logs

2. **Health Monitoring:**
   - Railway automatically monitors the `/api/health` endpoint
   - Failed health checks will trigger service restarts

## Troubleshooting

### Common Issues

1. **405 Method Not Allowed Error:**
   - This happens when Railway detects the project as a frontend instead of backend
   - Solution: Ensure Railway is using the `railway.toml` configuration with `builder = "DOCKERFILE"`
   - Check the Railway dashboard configuration tab to verify the builder setting
   - If using Nixpacks, make sure `nixpacks.toml` is properly configured
   - Redeploy the service after adding the correct configuration files

2. **Database Connection Failed:**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
   - Check that your Supabase project is active
   - Ensure the database schema is properly set up

3. **CORS Errors:**
   - Update `ALLOWED_ORIGINS` to include your frontend domain
   - Check that your frontend is making requests to the correct Railway URL

4. **Service Not Starting:**
   - Check the deployment logs for error messages
   - Verify all required environment variables are set
   - Ensure the `package.json` scripts are correct

### Getting Help

1. Check Railway documentation: [docs.railway.app](https://docs.railway.app)
2. View deployment logs in Railway dashboard
3. Test locally first using `npm run dev`

## Security Considerations

1. **Environment Variables:**
   - Never commit sensitive keys to your repository
   - Use Railway's environment variable system
   - Rotate service keys regularly

2. **CORS Configuration:**
   - Only allow necessary origins
   - Use HTTPS in production
   - Consider adding API key authentication for additional security

3. **Rate Limiting:**
   - Consider implementing rate limiting for production use
   - Monitor usage patterns in Railway dashboard

## Scaling

Railway automatically handles scaling based on traffic. For high-traffic applications:

1. Monitor resource usage in Railway dashboard
2. Consider upgrading to a paid plan for better performance
3. Implement caching strategies if needed
4. Monitor database connection limits
