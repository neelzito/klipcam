# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KlipCam is a Creator AI platform targeting Instagram and Shorts creators. The core value proposition is "Create 10 IG-ready images in under 5 minutes from 10 selfies." This is a subscription-based service ($9/month) with credit-based usage.

**Inspiration**: The project draws inspiration from Higgsfield.ai's approach to AI-powered creative tools for modern content creators.

## Design Philosophy (Inspired by Higgsfield.ai)

### UI/UX Approach
- **Clean, minimalist interface** with dark-mode aesthetic
- **Preset-first workflow** - prioritize quick content generation over complex controls
- **Visual-heavy navigation** - emphasize thumbnails and previews
- **Hierarchical tool organization** - clear categorization of features
- **Mobile-responsive design** - creators work across devices

### User Experience Patterns
- **One-click generation** for common use cases
- **Extensive preset libraries** for styles and effects
- **Real-time previews** where possible
- **Streamlined creation process** - minimize steps to output
- **Modular approach** - allow combining different AI tools/effects

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (preferred) or Netlify

### Backend & Services
- **Authentication**: Clerk (Google, Apple social logins)
- **Database**: Supabase Postgres
- **Storage**: Supabase Storage with signed URLs
- **Payments**: Stripe subscriptions with Stripe Tax
- **AI Models**: Replicate platform for model execution
- **Email**: Resend for transactional emails

### AI Model Stack (Replicate)
- **Base Images**: qwen/qwen-image (T2I/I2I, low-res ≤768px)
- **Premium Images**: black-forest-labs/FLUX.1-dev
- **Image Upscaling**: nightmareai/real-esrgan (2x/4x to IG formats)
- **Base Video**: wan-video/wan-2.2-t2v-fast (3s, ≤480p)
- **Viral Effects**: minimax/hailuo-2 (spiders crawling effect)

## Key Features & Constraints

### Content Generation
- **Images**: 6 preset styles (Fashion Editorial, Gym High-Contrast, Warm Indoor, Neon Night Street, Travel Sunset, Studio Color Backdrop)
- **Videos**: Fixed 3-second duration, ≤480p resolution
- **Aspects**: Portrait, vertical 9:16, square 1:1
- **Concurrency**: Max 2 running jobs per user

### Higgsfield.ai-Inspired Features to Consider
- **Extensive preset libraries** - expand beyond 6 initial styles
- **One-click dynamic effects** - similar to Higgsfield's motion controls
- **Modular content creation** - allow combining multiple AI tools
- **Visual effect marketplace** - community-driven presets
- **Ultra-realistic generation** - focus on high-quality outputs
- **Quick iteration tools** - variations and refinements

### Credit System
- Base image: 1 credit
- Premium image: 4 credits  
- Image upscale: 4 credits
- Base video: 18 credits
- Spider effect: 25 credits
- Subscription: 900 credits/month
- Trial: 10 credits (watermarked, no upscale)

## Database Schema (Supabase)

### Core Tables
- `users`: Clerk integration, credit balance, subscription plan
- `subscriptions`: Stripe customer/subscription tracking
- `credits_ledger`: All credit transactions with detailed reasoning
- `jobs`: Generation requests with Replicate prediction tracking
- `assets`: Generated content metadata and storage paths
- `favorites`: User asset favorites

## API Structure (Next.js Route Handlers)

### Primary Endpoints
- `POST /api/jobs`: Create generation jobs with credit validation
- `POST /api/replicate/webhook`: Handle Replicate completion callbacks
- `POST /api/assets/:id/upscale`: Upscale images to IG formats
- `GET /api/jobs`: Paginated job history
- `GET /api/assets`: Paginated asset library
- `POST /api/stripe/webhook`: Handle subscription events

### Key API Patterns
- All endpoints require Clerk authentication
- Credit validation before job creation
- Replicate webhook drives job completion flow
- Supabase Storage for asset management with signed URLs

## Development Workflow

### Image Generation Flow
1. User selects preset + aspect ratio + optional prompt
2. Credit estimation and validation
3. Job creation with Replicate API call
4. Webhook processes completion
5. Asset storage in Supabase with metadata

### Video Generation Flow  
1. T2V or I2V mode selection
2. Prompt + optional reference image (I2V)
3. Fixed 3s duration, aspect selection
4. Similar credit validation and webhook flow

## Content Safety
- Rely on model-level safety filters in v1
- Clear UI guidance about allowed content
- NSFW and celebrity likeness prohibited per ToS
- Watermarking only on trial outputs

## Storage & Asset Management
- Supabase Storage bucket: `generated/` with `user_{id}/` prefixes
- Trial assets: 30-day retention
- Paid assets: unlimited within 10GB soft cap
- Signed URLs for downloads with short expiry
- Watermarking via Sharp (images) and ffmpeg (videos)

## Billing Integration
- Stripe Checkout for subscriptions
- Automatic credit grants on payment success
- Webhook-driven credit management
- No rollover credits in v1

## Important Implementation Notes
- Queue-based generation with status tracking
- Enforce concurrency limits per user
- Proper error handling and credit refunds on failures
- All pricing and credit costs subject to Replicate rate validation
- Target ≥60% margin after Stripe fees and taxes

## UI Implementation Priorities

### Design System (Based on styleguide.md)
- **Typography**: Geist (sans-serif) for UI text, Geist Mono for technical/code elements, ui-serif for headlines
- **Color Palette**: 
  - Primary: Black (`#000000`), White (`#FFFFFF`), various grays
  - Accents: Orange (`#FF7825`, `#E114E7`), Purple (`#7c3aed`), Blue (`#3080ff`), Green (`#00c758`), Red (`#fb2c36`)
- **Framework**: Next.js + Tailwind CSS + React + Lucide icons
- **Responsive Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)

### Visual Design (Capacity.so-Inspired)
- **Layout**: Grid-based, clean sectioning with strong visual hierarchy
- **Aesthetic**: Modern minimalist with tech-forward approach
- **Components**: Spacious design with consistent padding/margins
- **Interactions**: Subtle animations, smooth transitions, hover effects
- **Navigation**: Adaptive navigation (hamburger on mobile, full menu on desktop at lg breakpoint)

### Essential Interface Elements
- **Dark theme by default** - matches both Higgsfield.ai and Capacity.so aesthetics
- **Preset thumbnail grid** - visual style selection over text dropdowns
- **Real-time credit estimation** - transparent cost display with vibrant accent colors
- **Queue status indicators** - clear job progress with minimal UI clutter
- **One-click workflows** - reduce friction in common creation paths
- **Scroll animations** - reveal elements as user scrolls (Capacity.so pattern)

### Advanced Interface Considerations
- **Drag-and-drop asset management** - intuitive file handling
- **Hover previews** - quick asset inspection without navigation
- **Keyboard shortcuts** - power user efficiency
- **Responsive grid layouts** - mobile-first approach (1-column mobile, multi-column desktop)
- **Progressive disclosure** - advanced controls available but not prominent
- **Dynamic navigation bar** - transparent to solid on scroll (Capacity.so pattern)

## Component Implementation Guidelines

### Key UI Components (Reference styleguide.md)
- **Background**: Dark abstract with subtle gradient and particle effects
- **Icons**: Mix of custom designs + Lucide library
- **Buttons**: Color-changing hover effects using accent palette
- **Cards**: Clean, modular design with consistent spacing
- **Grids**: Flexible system adapting to screen sizes (1-col mobile → 4-col desktop)

### Animation & Interaction Patterns
- **Scroll-triggered animations** - progressive content reveal
- **Navigation transitions** - transparent to solid background on scroll
- **Hover states** - color transitions using accent palette
- **Loading states** - progress indicators with brand colors
- **Micro-interactions** - button feedback, icon animations

## Future Expansion Opportunities
- **Community presets** - user-generated style sharing
- **Batch processing** - bulk operations for power users  
- **Advanced motion effects** - inspired by Higgsfield's camera controls
- **Collaborative features** - team content creation
- **Integration APIs** - connect with other creator tools

## Development Reference Files
- **Design System**: See `styleguide.md` for complete color palette, typography, and technical implementation
- **Visual Inspiration**: Capacity.so layout patterns and Higgsfield.ai UX approach
- **Tech Stack**: Next.js + Tailwind + Lucide (per styleguide.md specifications)