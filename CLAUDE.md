# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server (usually on port 3000)
npm run build        # Production build with type checking
npm run start        # Start production server
npm run lint         # Run ESLint for code quality

# Database migrations (use Supabase MCP server when available)
# Apply migrations via: mcp__supabase__apply_migration with project_id and SQL
```

## Application Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Next.js API routes with Supabase PostgreSQL
- **Authentication**: Supabase Auth with Google OAuth and Strava integration
- **Styling**: Tailwind CSS 4 with dark mode support
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for images and files

### Core Application Structure

This is a **Japanese triathlon community site** with several main feature areas:

1. **Board System** (`/app/board/`) - Slack-like real-time messaging
   - Hierarchical: Categories → Channels → Messages → Thread Replies
   - Features: reactions, mentions, image uploads, search, typing indicators
   - Uses Supabase real-time subscriptions for live updates

2. **Events** (`/app/events/`) - Community event management with calendar views
3. **Cafes** (`/app/cafes/`) - Directory with Google Maps integration and reviews
4. **Courses** (`/app/courses/`) - Training route database with ratings
5. **Gear** (`/app/gear/`) - Equipment reviews and recommendations
6. **User Profiles** (`/app/user/[username]/`, `/app/profile/`) - With Strava integration

### Database Architecture

**Key Tables:**
- `profiles` - Extended user data (username, display_name, avatar_url, role)
- `messages` - Unified table for board posts and thread replies
- `channels`, `board_categories` - Board hierarchy
- `reactions`, `mentions`, `notifications` - Interactive features
- `events`, `courses`, `cafes`, `gear_reviews` - Content types

**Important Notes:**
- Uses Row Level Security (RLS) policies extensively
- Soft delete system with `deleted_at` and deletion reasons
- Admin/user role system with permission checking
- Thread replies use `thread_id` self-reference to parent message

### Authentication & User Management

- **AuthContext** (`/contexts/AuthContext.tsx`) provides global auth state
- **Supabase client** (`/lib/supabase/client.ts`) has robust cookie error handling
- **Strava integration** uses OAuth 2.0 with PKCE flow
- **Profile system** extends Supabase auth.users with custom profiles table

### Real-time Board System

The board system (`/app/board/page.tsx`) is the most complex component:
- Real-time message updates via Supabase subscriptions
- Thread modal system (`/components/slack-board/ThreadView.tsx`)
- Message editing with cursor position preservation
- Multi-image upload support
- Mention system with notifications
- Search across messages, channels, and categories

### File Upload System

- **Upload API** (`/app/api/upload/route.ts`) handles file uploads to Supabase Storage
- **ImageUploader component** (`/components/ImageUploader.tsx`) provides drag-and-drop UI
- **Storage buckets**: `avatars` for profiles, `board-images` for messages
- **Size limits**: Max 10MB per file, supports JPG/PNG/GIF/WebP

### Admin Features

- **Role-based permissions** with `profiles.role` field (user/admin)
- **Content moderation** with soft delete and deletion reasons
- **Action logging** for admin operations
- **Admin pages** under `/app/admin/` for management tasks

## Development Guidelines

### Working with the Board System
- Messages table serves both channel posts (thread_id=null) and replies (thread_id=parent_id)
- Always check for `deleted_at IS NULL` when querying messages
- Use `thread_reply_count` column for display (auto-updated via triggers)
- Real-time subscriptions require cleanup in useEffect

### Database Operations
- Use Supabase MCP server for migrations when available
- RLS policies are strictly enforced - test with appropriate user roles
- Soft delete is preferred over hard delete for content
- Always include `deleted_at IS NULL` filters for user-facing queries

### Authentication Patterns
- Check user role with `profile.role === 'admin'` for admin features
- Use `useAuth()` hook for current user state
- Handle cookie parsing errors gracefully (auth system auto-recovers)

### File Handling
- Images should be uploaded to appropriate buckets (`avatars`, `board-images`)
- Always validate file types and sizes on both client and server
- Use Next.js Image component with remotePatterns for Supabase storage

### Mobile & PWA
- Application is fully responsive with mobile-first design
- PWA manifest and service worker are configured
- Touch-friendly interactions throughout

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
NEXT_PUBLIC_STRAVA_CLIENT_ID=      # Strava OAuth client ID
STRAVA_CLIENT_SECRET=              # Strava OAuth secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Google Maps API key
GMAIL_USER=                        # Gmail for contact form
GMAIL_APP_PASSWORD=                # Gmail app password
GMAIL_TO=                          # Contact form recipient
```

### Common Debugging Areas
- **Cookie parsing errors**: Auth system has automatic recovery
- **RLS policy violations**: Check user permissions and policy definitions
- **Real-time subscription leaks**: Ensure proper cleanup in useEffect
- **Image upload failures**: Verify storage permissions and file types
- **Thread reply counts**: Use triggers for automatic updates

### Testing User Features
- Board messaging requires authenticated users
- Admin features need `profiles.role = 'admin'`
- Strava integration needs OAuth setup
- File uploads need proper storage bucket permissions