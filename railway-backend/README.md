# ProdBay Backend Service

Backend service for processing project briefs and creating asset categories. This service migrates the brief processing logic from the frontend to a dedicated Railway backend.

## Features

- **Brief Processing**: Parse project briefs and identify required asset categories
- **Asset Creation**: Automatically create asset records in the database
- **RESTful API**: Clean API endpoints for frontend integration
- **Error Handling**: Comprehensive error handling and validation
- **Health Monitoring**: Health check endpoints for monitoring

## API Endpoints

### POST /api/process-brief

Process a project brief and create corresponding assets.

**Request Body:**
```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "briefDescription": "We need a corporate event with stage setup, audio system, lighting, and catering for 200 people."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "projectId": "123e4567-e89b-12d3-a456-426614174000",
    "identifiedAssets": ["Staging", "Audio", "Lighting", "Catering"],
    "createdAssets": [
      {
        "id": "asset-uuid-1",
        "project_id": "123e4567-e89b-12d3-a456-426614174000",
        "asset_name": "Staging",
        "specifications": "Requirements for staging based on project brief",
        "status": "Pending",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "processingTime": 245
  },
  "message": "Brief processed successfully. 4 assets created."
}
```

### GET /api/health

Health check endpoint for monitoring.

**Response:**
```json
{
  "success": true,
  "message": "Brief processing service is healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration (optional)
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your actual values
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Railway Deployment

1. Connect your Railway account to this repository
2. Set the environment variables in Railway dashboard
3. Deploy the service
4. Update your frontend to use the new Railway endpoint URL

## Asset Categories

The service identifies the following asset categories based on keyword matching:

- **Printing**: print, banner, poster, flyer, brochure, signage
- **Staging**: stage, platform, backdrop, display
- **Audio**: sound, speaker, microphone, audio, music
- **Lighting**: light, lighting, illumination, led
- **Catering**: food, catering, meal, refreshment, beverage
- **Transport**: transport, delivery, logistics, shipping
- **Design**: design, graphic, branding, logo, creative

If no categories are identified, a "General Requirements" asset is created.

## Error Handling

The API returns structured error responses with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input data
- **403 Forbidden**: CORS policy violation
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Server or database errors

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Test the API
curl -X POST http://localhost:3000/api/process-brief \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test-uuid","briefDescription":"test brief"}'
```

## Monitoring

- Health check: `GET /api/health`
- Request logging: All requests are logged with timestamps
- Error logging: Comprehensive error logging for debugging
