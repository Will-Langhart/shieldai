# API Integrations Documentation

This directory contains documentation for external API integrations and third-party service configurations.

## Available API Documentation

- **[BIBLE_API_INTEGRATION.md](BIBLE_API_INTEGRATION.md)** - Bible API setup and integration

## API Categories

### Bible APIs
- Multiple Bible version support
- Verse lookup and search
- Cross-reference systems

### External Services
- Google Places API (Church Finder)
- Pinecone Vector Database
- Stripe Payment Processing
- Supabase Authentication

### Notifications API (Server)
- Endpoint: `POST /api/notifications/register`
- Auth: `Authorization: Bearer <supabaseAccessToken>`
- Body:
  ```json
  {
    "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
    "deviceInfo": { "model": "iPhone15,3", "os": "iOS 17.5" }
  }
  ```
- Response: `{ "success": true }` on success
- Storage:
  - Table: `user_devices` with columns:
    - `user_id` (uuid, references users.id)
    - `expo_push_token` (text)
    - `device_info` (jsonb, nullable)
    - `updated_at` (timestamptz)
    - Unique constraint: `(user_id, expo_push_token)`
- Notes:
  - If `user_devices` is not available, token is stored under `users.preferences.expoPushToken` as a fallback
  - Intended for Expo Push notification delivery via server-side jobs

## Integration Overview

Each API integration includes:
- Setup instructions
- Configuration details
- Environment variables
- Testing procedures
- Troubleshooting guides