MVP v1 Product Spec — Creator AI (Hand-off Document)

Overview

Target users: Instagram and Shorts creators who publish images, slideshows, and short vertical clips.
Core value: Create fresh, on-brand content fast. “Create 10 IG-ready images in under 5 minutes from 10 selfies.”
Launch scope: Images and short videos (3 seconds). LoRA/personal model training deferred to v1.1. Social posting deferred.

v1 Decisions (Locked)

- Pricing: single $9/month plan (900 credits). Additional tiers deferred to v1.1.
- Concurrency: max 2 running jobs per user. Tiered increases deferred to v1.1.
- Retention: defer automated tier-based cleanup to v1.1. Show simple copy only; keep trial watermarking.
Plans and Credits

Pricing: Subscription-based (Stripe). USD. Stripe Tax enabled.
- **Subscription**: $9/month, 900 credits/month.
- **Trial**: 10 free credits (watermarked, no upscale).
Credit costs:
- Base image: 1 credit
- Premium image: 4 credits  
- Image upscale: 4 credits
- Base video: 18 credits
- Spider effect: 25 credits
No one-time top-ups in v1.
Content Types and Features

Images
Modes: Text-to-image (T2I), Image-to-image (I2I).
Presets: 6 image styles
Fashion Editorial
Gym High-Contrast
Warm Indoor
Neon Night Street
Travel Sunset
Studio Color Backdrop
Controls: orientation/aspect (portrait, vertical 9:16, square), style strength, guidance, seed; optional prompt box; sample prompts.
Resolution: low-res by default (long edge ≤768). Optional upscale to IG formats: 1080x1350, 1080x1920, 1080x1080.
Watermark: only on free trial outputs.
Videos
Durations: fixed 3 seconds.
Resolutions: ≤480p.
Modes:
AI Short (base): Text-to-video and Image-to-video.
Viral effect: “Spiders crawling” via Minimax Hailuo 2 (image + prompt).
Controls: aspect (9:16, 1:1), prompt, optional reference image (for I2V), fixed duration, optional seed.
Watermark: only on free trial outputs.
Batch/queue
Queue-based generation; show status per job (Queued, Running, Succeeded, Failed).
Concurrent jobs: v1 = max 2 running jobs per user. v1.1: tiered limits (TBD).
Safety and Policy

Disallow NSFW and celebrity likeness per ToS. Rely on model-level safety filters; no additional technical blocking in v1.
Clear UI guidance about allowed content.
Report/abuse tools deferred to v1.1.
Tech Stack

Web framework: Next.js (App Router), Tailwind for styling.
Auth: Clerk (Google, Apple social logins).
Database: Supabase Postgres.
Storage: Supabase Storage for generated assets; signed URLs for downloads.
Hosting: Vercel or Netlify (prefer Vercel for Next.js).
Payments: Stripe subscription; Stripe Tax. Webhooks to manage credits.
Emails: Resend (welcome). Stripe handles payment receipts. No job-complete emails in v1.
AI providers:
Replicate for model execution.
OpenAI, Claude, Gemini Flash 2.5 can be integrated later for logic/creativity/cheap tasks; not core to v1 workflows.
Model Selection (Replicate)

Base image (cheap):
qwen/qwen-image for T2I and I2I. Default low-res params.
Fallback: stability-ai/sdxl-lightning or juggernautXL if needed.
Premium image:
black-forest-labs/FLUX.1-dev (or FLUX.1-schnell for speed) for higher quality presets.
Upscale (images):
nightmareai/real-esrgan (2x/4x). Optional face fix via xinntao/GFPGAN if needed.
Base video (cheap, 3s):
wan-video/wan-2.2-t2v-fast for T2V and I2V at ≤480p.
Fallbacks: thudm/cogvideox-2b, tencent/HunyuanVideo small variant (validate current cost/queue).
Viral effects (minimax/hailuo-2):
1. Earth Zoom Out
2. Spiders From Mouth  
3. Eyes In
4. Explosion
5. Face Punch
6. Live Concert
7. Turning Metal
8. Paint Splash
9. Powder Explosion
10. Paparazzi
11. Kiss
12. Fast Sprint

Approved v1 Model Stack & Defaults

- Base image (T2I/I2I): qwen/qwen-image
  - Defaults: steps 24, guidance 7.5, seed randomized by default
  - Aspects: portrait 768x1024, square 768x768, landscape 1024x768
  - I2I strength: 0.7
  - Fallback: stability-ai/sdxl-lightning
- Premium image (higher quality): black-forest-labs/FLUX.1-dev
  - Defaults: steps 20–25, guidance 3.5; same aspect presets
  - Fallbacks: FLUX.1-schnell (speed), then SDXL-lightning
- Upscale (images): nightmareai/real-esrgan (2x/4x)
  - Targets: 1080x1350 (portrait), 1080x1080 (square), 1080x1920 (vertical) with crop/pad
  - Optional: xinntao/GFPGAN for face fix if artifacts
- Base video (3s ≤480p): wan-video/wan-2.2-t2v-fast
  - Defaults: 3s, fps 8–12, seed optional, aspects 9:16 or 1:1
  - Fallbacks: thudm/cogvideox-2b, tencent/HunyuanVideo small
- Viral effect (Spiders): minimax/hailuo-2
  - Input: face image + prompt template; 3s; vertical default

- Universal negative prompt: "blurry, low quality, distorted, deformed, extra limbs, watermark, signature, text"
- Seed policy: random by default; persist seed in metadata for reproducibility and "Generate Similar".
- Fallback triggers: model queue >5 minutes, model unavailable, or cost spike >20% → auto-swap to fallback with subtle UI notice.
User Experience and Flows

Onboarding
Sign in/up via Clerk. Seed 10 trial credits.
Show short explainer of base vs premium generations and credit costs.
Dashboard
Tabs: Images / Videos / Library / Billing.
Remaining credits visible at top; simple tooltip showing cost per operation.
Images flow
Choose a preset → choose aspect (portrait/vertical/square) → optional prompt tweak → Generate (shows credit estimate).
Job appears in queue with status.
On completion: preview low-res, actions: Favorite, Download, Upscale (shows additional credit cost), Regenerate with variations.
Videos flow
AI Short (base):
Choose Text-to-video or Image-to-video → select aspect (9:16 or 1:1) → enter prompt (and optional reference image for I2V) → Generate (credit estimate shown).
Spider Effect:
Upload face image → prompt field with suggested template → Generate (3s, ≤480p).
On completion: preview, Favorite, Download.
Library
Views: All, Recents, Favorites.
Filters: Images / Videos.
Watermark only on trial assets.
Billing
Subscribe $9/month via Stripe Checkout.
On payment success: +900 credits, plan set to paid. Monthly renewal +900 credits.
Cancel: plan goes to free at period end; no rollover credits in v1.
Limits and Defaults

Video: max 3 seconds, ≤480p; fixed steps/fps for cost control.
Images: low-res ≤768 long edge by default; upscales to IG formats.
Concurrency: max 2 running jobs per user.
Storage retention: trial assets retained 30 days; paid unlimited within reasonable quota (suggest 10 GB soft cap in v1). Soft delete.
Data Model (Supabase) — Minimal Schema

users
id (uuid), clerk_id (text unique), email, plan (enum: free|paid), credit_balance (int), trial_ends_at (timestamptz), created_at
subscriptions
id (uuid), user_id (fk), stripe_customer_id, stripe_subscription_id, status (active|canceled|incomplete), current_period_end, created_at, updated_at
credits_ledger
id (uuid), user_id (fk), delta (int), reason (enum: trial_seed|subscription_grant|job_charge|job_refund|manual_adjust), job_id (fk nullable), metadata (jsonb), created_at
jobs
id (uuid), user_id (fk), type (enum: image|video), subtype (enum: t2i|i2i|t2v|i2v|spider), model (text), params (jsonb), status (enum: queued|running|succeeded|failed), cost_credits (int), replicate_prediction_id (text), created_at, completed_at, error (text)
assets
id (uuid), user_id (fk), job_id (fk), kind (enum: image|video), path (text), width (int), height (int), size_bytes (int), is_low_res (bool), created_at
favorites
id (uuid), user_id (fk), asset_id (fk), created_at
API Endpoints (Next.js route handlers)

POST /api/jobs
Auth: Clerk.
Body: { type, subtype, params }
Image T2I/I2I params: prompt, negative_prompt?, width, height, steps, guidance, seed, reference_image_url? (for I2I), model_tier (base|premium)
Video T2V/I2V params: prompt, aspect, duration=3s, fps, seed?, reference_image_url? (I2V)
Spider params: reference_image_url, prompt
Logic: validate; estimate credits; ensure credit_balance >= estimate; reserve credits (temporary hold); create jobs record; call Replicate; return job id.
POST /api/replicate/webhook
Verify signature; find job by replicate_prediction_id.
On success: download file(s), store in Supabase Storage; create assets rows; finalize credit charge in credits_ledger and decrement users.credit_balance; update jobs to succeeded.
On failure: release reservation (refund credits); update jobs to failed.
POST /api/assets/:id/upscale
Auth + credit check. Body: { target: square|portrait|vertical }
Call real-esrgan; store result; ledger entry; return new asset.
GET /api/jobs (paginated) and GET /api/assets (paginated, filters kind)
POST /api/favorites { asset_id, is_favorite }
Stripe webhooks /api/stripe/webhook
checkout.session.completed: set plan=paid, create subscriptions row, +900 credits in credits_ledger and users.credit_balance.
invoice.paid: +900 credits; update subscriptions.current_period_end.
customer.subscription.deleted: set plan=free.
Optional: POST /api/credits/estimate to display predicted costs pre-run.
Model Defaults and Payload Hints

Base image — qwen/qwen-image
width/height: 768x1024 (portrait), 1024x768 (landscape), 768x768 (square)
steps: ~24; guidance: moderate; seed: randomized unless user sets
I2I: image_url for reference; strength ~0.6–0.8
Preset prompt template example: “[subject/style keywords], high-detail, cinematic lighting, shallow depth of field, IG portrait”
Premium image — black-forest-labs/FLUX.1-dev
Same orientation targets; steps ~20–25; style tokens per preset
Upscale — nightmareai/real-esrgan
2x/4x upscale; then crop/pad to target IG dimensions if needed
Base video — wan-video/wan-2.2-t2v-fast
duration: 3s; fps: ~8–12; resolution: ≤480p; seed optional
I2V: image_url + prompt; strength to preserve input loosely
Viral effect — minimax/hailuo-2
input: face image + prompt like “realistic horror short; spiders crawl out of mouth; dramatic lighting; macro; 3 seconds; vertical”
Queueing and Concurrency

Enforce max 2 running jobs per user.
Additional jobs remain queued in app; Replicate webhooks drive state updates.
Storage and Delivery

Supabase Storage bucket generated/ with per-user prefix user_{id}/....
Signed URLs for downloads with short expiry.
Trial watermarking: images via Sharp; videos via ffmpeg overlay.
Admin and Observability (v1 minimal)

Basic admin view (internal): list users, credit balances, recent jobs, retry/abort job, manual credit adjust.
Logging: Vercel logs; Replicate dashboard. Add Sentry in v1.1.
Legal and Terms

ToS and Privacy Policy: include clauses disallowing NSFW and celebrity likeness; clarify AI-generated content ownership.
Region: USD pricing, US-first; Stripe Tax to handle VAT/sales tax where applicable.
Open Items and Next Steps

Validate current Replicate pricing for:
qwen/qwen-image low-res
wan-2.2-t2v-fast 3s 480p
minimax/hailuo-2 3s effect
real-esrgan 2x/4x
Adjust credit costs if needed to maintain target margin (recommend ≥60% after Stripe fees and tax).
Finalize preset prompt templates and negative prompts for the 6 image styles.
Implement seed handling for reproducibility and “variation” controls.
Decide hosting: Vercel preferred for API routes and background functions.
If you want, I can follow up with:

A JSON OpenAPI-style spec for /api/jobs and /api/replicate/webhook.
Preset prompt library (image and video) ready to paste into config.
A small spreadsheet to map Replicate costs to credits and margin.

## Critical Product Definitions Needed Before Development

### 1. User Experience & Flows
**Q1.1: Detailed Onboarding Sequence** ✅ ANSWERED (Based on Higgsfield.ai patterns)
- **Exact steps after Clerk signup:**
  1. Redirect to main dashboard (no separate welcome screens - Higgsfield approach)
  2. Auto-seed 10 trial credits + show credit balance in header
  3. Display preset gallery immediately (visual-first like Higgsfield)
  4. Show "Try your first generation - 10 free credits!" CTA prominently
- **Guide first-time users:** Contextual hints on hover/click, no separate tutorials (Higgsfield's learn-by-doing approach)
- **Tutorial format:** No tutorials - preset thumbnails with hover previews show what each style creates
- **Different skill levels:** Single simplified flow for all users - presets eliminate need for prompt engineering skills

**Q1.2: Empty States & First Use** ✅ ANSWERED (Higgsfield visual-heavy approach)
- **Dashboard with no content:** Show preset gallery + sample generations immediately (never truly "empty" - Higgsfield pattern)
- **Three main sections:**
  1. Preset thumbnails (6 styles) with sample outputs as backgrounds
  2. "Your Library" section with placeholder message: "Your creations will appear here"
  3. Recent generations from other users (anonymized) for inspiration
- **Encourage first generation:** Large "Generate Your First Image" button + "10 free credits" badge
- **Sample content:** Each preset shows 2-3 high-quality sample generations as background thumbnails

**Q1.3: Mobile Experience Details** ✅ ANSWERED (Higgsfield responsive patterns + mobile-first)
- **Touch interactions:**
  - Long-press preset thumbnails for quick preview
  - Swipe navigation between Images/Videos/Library tabs
  - Pull-to-refresh on library view
  - Pinch-to-zoom on generated content
- **Small screen adaptation:**
  - Hamburger navigation (lg breakpoint) like Higgsfield
  - 2-column preset grid (vs 3-column desktop)
  - Bottom sheet for generation options
  - Simplified parameter controls (hide advanced options)
- **Camera integration:** Yes - "Use Camera" button in I2I mode for reference images
- **Offline capabilities:** View library, favorites, browse presets | **Requires internet:** All generation, uploads, account sync

**Q1.4: Error Handling Flows** ✅ ANSWERED (Enhanced from Higgsfield - they don't show this well)
- **Failed generations:**
  - Toast notification: "Generation failed - credits refunded"
  - Job status shows "Failed" with retry button
  - Auto-refund credits to user balance
  - Error details in job history for debugging
- **Insufficient credits:**
  - Pre-generation check with clear warning modal
  - "Upgrade to Pro" CTA with cost breakdown ($9 = 900 credits)
  - Show exact cost vs. remaining balance
  - Block generation attempt (don't queue and fail)
- **Replicate API downtime:**
  - Queue status shows "Service temporarily unavailable"
  - ETA estimate based on historical data
  - Email notification when service resumes (optional opt-in)
- **Retry mechanisms:**
  - Manual retry button on failed jobs
  - Auto-retry once for transient errors (network timeouts)
  - No auto-retry for content policy violations

### 2. Content & Creative Features
**Q2.1: Preset Implementation Details** ✅ ANSWERED (Optimized for qwen/qwen-image & FLUX.1-dev)

**Exact Prompt Templates:**
1. **Professional Headshots**: "{user_prompt}, professional headshot, business portrait, corporate photography, clean background, confident pose, professional lighting, high-quality studio photography"
2. **Fitness Influencer**: "{user_prompt}, fitness influencer photography, athletic wear, gym environment, high contrast lighting, dynamic pose, motivational energy, sports photography aesthetic"
3. **Street Style**: "{user_prompt}, street style fashion, urban photography, natural lighting, candid pose, trendy outfit, city background, lifestyle photography, editorial feel"
4. **Beach Bikini/Swimwear**: "{user_prompt}, beach photography, swimwear, tropical setting, golden hour lighting, vacation vibes, summer aesthetic, ocean background, lifestyle portrait"
5. **Travel**: "{user_prompt}, travel photography, wanderlust aesthetic, scenic location, adventure vibes, natural lighting, vacation mood, destination photography, lifestyle portrait"
6. **Glamour**: "{user_prompt}, glamour photography, beauty portrait, dramatic lighting, elegant pose, high-fashion aesthetic, professional makeup, luxurious feel, magazine style"

**Negative Prompts (Universal):** "blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, watermark, signature, text, low resolution, pixelated"

**Parameter Configurations:**
- **Base Model (qwen)**: Steps: 24, Guidance: 7.5, Width/Height: 768x1024 (portrait), 1024x768 (landscape), 768x768 (square)
- **Premium Model (FLUX)**: Steps: 20, Guidance: 3.5, Same dimensions
- **I2I Strength**: 0.7 (allows significant transformation while preserving structure)

**Preview Thumbnails:** Generate 3 high-quality samples per preset using our own models, showcase diverse subjects (different ethnicities, ages, genders)

**Q2.2: Sample Prompts & Inspiration** ✅ ANSWERED (Curated for Instagram creator needs)

**Sample Prompts (5 per style):**

**Fashion Editorial:**
- "Confident woman in oversized blazer, minimalist jewelry"
- "Male model in streetwear, urban rooftop setting"
- "Person in vintage leather jacket, moody expression"
- "Elegant portrait with bold red lipstick, black outfit"
- "Androgynous model in designer coat, artistic pose"

**Gym High-Contrast:**
- "Athletic woman lifting weights, determined expression"
- "Muscular man doing pull-ups, gym background"
- "Fitness influencer in yoga pose, meditation vibe"
- "CrossFit athlete with battle ropes, intense workout"
- "Runner stretching outdoors, early morning light"

**Warm Indoor:**
- "Person reading book by window, cozy sweater"
- "Coffee shop moment, laptop and latte"
- "Cooking in kitchen, warm natural lighting"
- "Relaxing on sofa with pet, comfortable setting"
- "Home office setup, golden hour lighting"

**Neon Night Street:**
- "Person walking through neon-lit alley, cyberpunk vibes"
- "Night market scene, colorful street food lights"
- "Urban explorer in rain-soaked streets, reflections"
- "Motorcycle rider under neon signs, city night"
- "Late night diner, retro neon aesthetic"

**Travel Sunset:**
- "Silhouette on mountain peak, golden hour"
- "Beach walk at sunset, waves and warm light"
- "Desert landscape, person watching sunset"
- "City skyline from rooftop, dusk lighting"
- "Forest hike, sunlight filtering through trees"

**Studio Color Backdrop:**
- "Professional headshot, blue backdrop, business attire"
- "Creative portrait, pink backdrop, artistic expression"
- "LinkedIn-style photo, white backdrop, confident pose"
- "Actor headshot, neutral backdrop, engaging smile"
- "Fashion portrait, gradient backdrop, designer clothes"

**Content Strategy:**
- **Curated samples** (not user-generated) for quality control
- **Update monthly** with trending topics and seasonal themes
- **Diverse representation** across all ethnicities, ages, body types
- **Instagram-optimized** - focus on content that performs well on social

**Q2.3: Advanced Generation Controls** ✅ ANSWERED (Simplified for v1, advanced features for v1.1)

**Style Strength Controls:**
- **v1: No** - Keep simple with preset-optimized strength values (0.7 for I2I)
- **v1.1 consideration**: "Style Intensity" slider (0.4-0.9 range) for power users
- **UI approach**: "Light", "Medium", "Strong" style application vs. technical sliders

**Variation Generation:**
- **Implementation**: Generate 2-4 variations by modifying seed while keeping other parameters identical
- **UI**: "Generate Variations" button after initial generation (costs 1 credit per variation for base model)
- **Seed strategy**: Base seed + incremental offsets (seed, seed+1, seed+2, seed+3)
- **Display**: Grid view showing original + variations for easy comparison

**Seed Handling Strategy:**
- **Auto-seed**: Random seed by default for variety
- **Reproducibility**: Store seed in asset metadata for "Generate Similar" functionality
- **User control**: Hidden advanced option - no exposed seed input in v1
- **Consistency**: Use stored seed + prompt for "Generate More Like This" feature

**Reference Image Blending:**
- **v1: Single reference** for I2I mode only
- **v1.1 consideration**: Multi-image blending (2-3 references with weight controls)
- **Current capability**: Upload single image → auto-resize → pass to model
- **Aspect handling**: Crop/pad reference to match selected aspect ratio automatically

### 3. Safety & Content Moderation
**Q3.1: Input Validation Rules** ✅ ANSWERED (Simplified - rely on Replicate filtering)

**Basic Input Validation:**
- **Character Limits**: 500 characters max for user prompts, 10 character minimum
- **File Validation**: Max 10MB uploads, formats: JPG, PNG, WebP
- **Dimension Limits**: Min 256x256, Max 2048x2048 pixels for reference images
- **Metadata Stripping**: Remove EXIF data from uploads for privacy

**Content Policy (ToS Protection):**
- **NSFW Policy**: Clear ToS stating NSFW content prohibited (rely on Replicate enforcement)
- **Celebrity Policy**: No celebrity likeness generation (rely on Replicate enforcement)
- **No Active Filtering**: Let Replicate models handle content restrictions

**Q3.2: Content Safety Pipeline** ✅ ANSWERED (Minimal - private content only)

**Safety Approach:**
- **Replicate Model Filtering**: Rely entirely on built-in model safety filters
- **Private Content**: No public sharing means no content moderation needed
- **Error Handling**: When Replicate blocks content, show user-friendly error message
- **Rate Limiting**: Basic abuse prevention (max 20 generations/hour per user)

**When Replicate Blocks Content:**
- Show message: "Content couldn't be generated due to safety policies. Try different prompts or reference images."
- Auto-refund credits for blocked generations
- No user penalties - just try again with different input

**Q3.3: Moderation Workflow** ✅ ANSWERED (No moderation needed)

**No Content Moderation Required:**
- **Private Library**: Users only see their own generated content
- **No Public Galleries**: No shared content means no reporting mechanisms needed
- **No User-to-User Interaction**: No comments, likes, or social features requiring moderation

**Account-Level Issues Only:**
- **Payment Disputes**: Handle via Stripe's standard dispute process
- **Abuse Prevention**: Rate limiting and usage monitoring for API abuse
- **Terms Violations**: Only suspend accounts for payment fraud or extreme API abuse
- **Simple Process**: Email-based customer support for any account issues

### 4. Queue & Job Management
**Q4.1: Queue Visualization** ✅ ANSWERED (Minimal but informative UI)

**Queue Display Location:**
- **Header Bar**: Small queue indicator showing "1/2" or "2/2" active jobs
- **Main Dashboard**: Dedicated "Active Jobs" section above library content
- **Mobile**: Collapsible "Generating..." card that expands to show details

**Job Information Display:**
- **Job Card Layout**: Thumbnail of input/reference image + preset style badge
- **Status Indicators**: 
  - "Queued" (gray) - waiting to start
  - "Running" (blue animated pulse) - actively generating
  - "Completed" (green checkmark) - ready to view
  - "Failed" (red X) - error occurred
- **Job Details**: Preset name, aspect ratio, timestamp, estimated completion
- **Progress**: Simple status text (no percentage bars since Replicate doesn't provide granular progress)

**Job Ordering & Prioritization:**
- **First-in, First-out**: Simple queue order, no priority system in v1
- **User Control**: Can't reorder jobs once submitted
- **Model-based Ordering**: Base model jobs may complete before premium if submitted later

**When Queue is Full (2/2 jobs active):**
- **Generate Button**: Disabled with tooltip "Queue full - wait for completion"
- **Clear Message**: "You have 2 active generations. New jobs will start when current ones complete."
- **Queue Preview**: Show what will happen next ("Next generation will start when...​")

**Q4.2: Job Control Features** ✅ ANSWERED (User-friendly controls)

**Job Cancellation:**
- **Queued Jobs**: Yes, can cancel with full credit refund (haven't started processing)
- **Running Jobs**: Yes, can cancel with full credit refund (Replicate bills on completion, not start)
- **Cancel Button**: Red "Cancel" button on each job card
- **Confirmation**: "Cancel generation? Your credits will be refunded." modal

**Credit Refund Policy:**
- **Cancelled Jobs**: Full credit refund always (no processing = no cost)
- **Failed Jobs**: Automatic full credit refund (system error, not user error)
- **Completed Jobs**: No refunds (successful generation delivered)
- **Refund Speed**: Immediate credit return to user balance

**Job Failure & Retry Handling:**
- **Auto-Retry**: Once for transient network errors (timeout, connection issues)
- **Manual Retry**: "Try Again" button for failed jobs (costs credits again)
- **Failure Reasons**: Clear error messages:
  - "Generation failed due to content policy"
  - "Service temporarily unavailable - try again"
  - "Network error - generation was cancelled and credits refunded"
- **No Penalty**: Failed jobs don't count against queue limit

**Job Scheduling:**
- **v1: No scheduling** - immediate queue only
- **Simple Queue**: Submit job → goes to queue → processes when slot available
- **v1.1 Consideration**: "Schedule for later" feature for batch processing

**Q4.3: Progress & Status Updates** ✅ ANSWERED (Efficient polling + webhooks)

**Status Update Strategy:**
- **Primary**: Replicate webhooks for status changes (instant updates)
- **Backup Polling**: Every 30 seconds for active jobs (in case webhooks fail)
- **Smart Polling**: Only poll jobs in "running" status, not queued or completed
- **Timeout Handling**: If no update after 10 minutes, mark as potentially stalled

**Real-time User Feedback:**
- **Status Changes**: Instant UI updates when webhook received
- **Live Status Text**: 
  - "Starting generation..." (first 30 seconds)
  - "Generating your image..." (active processing)
  - "Almost done..." (if taking longer than expected)
- **Visual Indicators**: Animated pulse on "running" jobs, static icons for others
- **Page Updates**: Auto-refresh job cards without page reload

**Long-running Generation Handling:**
- **Expected Times**: 
  - Base model (qwen): 30-90 seconds
  - Premium model (FLUX): 60-180 seconds
  - Video generation: 2-5 minutes
- **Extended Time Messages**: "This generation is taking longer than usual - your credits are safe"
- **Timeout Policy**: After 15 minutes, mark as failed and refund credits
- **User Communication**: Email notification if generation takes over 10 minutes

**Job Completion Notifications:**
- **In-App**: Toast notification + job card status change
- **Browser**: Browser notification if tab not active (permission-based)
- **Email**: Optional email notification for completed jobs (user preference)
- **No SMS**: Email only to keep costs low
- **Batch Completion**: Single notification if multiple jobs finish simultaneously

### 5. Credit System & Monetization
**Q5.1: Credit Estimation & Transparency** ✅ ANSWERED (Full cost transparency)

**Pre-Generation Cost Display:**
- **Generate Button**: Always shows cost "Generate (4 credits)" or "Generate (1 credit)"
- **Model Tier Selection**: Clear pricing "Base (1 credit)" vs "Premium (4 credits)" toggle
- **Upscale Pricing**: "Upscale to Instagram (4 credits)" button on completed images
- **Video Costs**: "Generate Video (18 credits)" or "Spider Effect (25 credits)"
- **Running Total**: Show remaining credits after action: "You'll have 45 credits left"

**Credit Balance Warnings:**
- **Low Credit Alert**: Warning when balance < 10 credits "Running low - upgrade to continue creating"
- **Insufficient Credits**: Block generation with clear message "Need 4 credits, you have 2 - upgrade now"
- **Smart Warnings**: Warn when credits < cost of most expensive operation (25 for spider effect)
- **No Surprise Charges**: Never charge without explicit user confirmation

**Replicate Price Change Handling:**
- **Monthly Price Review**: Check and update credit costs monthly
- **User Communication**: Email notification 7 days before price changes
- **Grandfathering**: Current subscribers keep existing credit values for their billing cycle
- **Transparency**: Price change history visible in billing section

**Usage Analytics Dashboard:**
- **This Month**: Credits used, generations created, most popular preset
- **Credit Breakdown**: Pie chart showing credits spent on base/premium/upscale/video
- **Generation History**: Calendar view showing daily usage patterns
- **Efficiency Metrics**: "Average cost per generation" and usage trends
- **Export Data**: CSV download of usage history for power users

**Q5.2: Subscription & Upsell Flow** ✅ ANSWERED (Gentle but effective conversion)

**Upgrade Promotion Triggers:**
- **Credit Depletion**: When user has <3 credits left, show upgrade modal
- **High Usage**: After user generates 15+ images in trial, suggest subscription
- **Premium Features**: When user tries premium model with insufficient credits
- **Value Demonstration**: After 3 successful generations, show "Loved your results? Upgrade for 900 more credits"
- **Time-Based**: Day 3 and Day 7 of trial via email campaigns

**Free Trial Expiration:**
- **7-Day Grace Period**: Can view/download content for 7 days after credit expiration
- **Soft Paywall**: Generate button shows "Subscribe to continue creating"
- **Content Deletion Warning**: "Your content will be deleted in X days - subscribe to keep it"
- **Re-engagement**: Email series highlighting their best generations + upgrade offer
- **Auto-Deletion**: Delete trial user content after 7 days to minimize storage costs

**Subscription Management:**
- **No Downgrades**: Only one plan ($9/month) - users either subscribe or cancel
- **Cancellation**: Immediate effect - no new credits, keep existing credits until used
- **30-Day Content Access**: Cancelled users can access content for 30 days
- **Win-back**: Email campaigns for cancelled users with special offers during 30-day window

**Credit Rollover Policy:**
- **v1: No Rollover**: Use-it-or-lose-it to encourage regular usage
- **Max Balance Caps**: Basic (300), Pro (1200), Ultimate (2400), Creator (12000) credits
- **Transparency**: Clear messaging about monthly credit grants and expiration
- **v1.1 Consideration**: Limited rollover (100 credits max) based on user feedback

**Storage Limits (v1.1 — Tiered by Subscription):**
- **Trial**: 500MB, 24h expiration
- **Basic ($9)**: 2GB storage, 24h expiration  
- **Pro ($29)**: 5GB storage, 1 week expiration
- **Ultimate ($49)**: 10GB storage, 1 month expiration
- **Creator ($249)**: 50GB storage, 6 months expiration
- **Archive Options**: ZIP download feature before content expires

**Q5.3: Billing Edge Cases** ✅ ANSWERED (Realistic cost-conscious policies)

**Failed Payment Handling:**
- **Stripe Retry Logic**: Automatic retry 3 times over 3 days
- **User Communication**: Email on failure with "Update payment method" link
- **Grace Period**: 3 days to fix payment while keeping existing credits
- **Service Interruption**: After 3 days, prevent new credit grants and start 30-day deletion countdown
- **Easy Recovery**: One-click payment update restores service and stops deletion timer

**Refund Policy for Generations:**
- **Technical Failures**: Full credit refund for failed/corrupted generations
- **Content Policy Blocks**: Full credit refund when Replicate blocks content
- **Unsatisfactory Results**: No refunds for successful generations user dislikes
- **System Downtime**: Credit compensation for extended service outages (>4 hours)
- **Clear Expectations**: "Credits charged only for successful generations" messaging

**System Outage Compensation:**
- **Downtime Threshold**: Compensate for outages >4 hours during business hours
- **Credit Compensation**: Proportional credits for extended downtime only
- **Communication**: Status page updates + email notifications about outages
- **No SLA Guarantees**: Best effort uptime, compensation at discretion
- **Manual Review**: Case-by-case compensation for major outages only

**Content Access After Cancellation:**
- **30-Day Access**: Cancelled users can download content for 30 days
- **Deletion Warning**: Email notifications at 7, 3, and 1 day before deletion
- **Archive Download**: Option to download all content as ZIP file during 30-day window
- **No Generation**: Only new content creation requires active subscription
- **Re-activation**: Previous content restored if resubscribed within 30 days

### 6. Asset Management & Library
**Q6.1: Organization System** ✅ ANSWERED (Simple but functional)

**Content Organization:**
- **v1: Simple Grid View**: Chronological feed of all generated content
- **No Folders**: Keep v1 simple - just date-based organization
- **Basic Sorting**: Sort by "Recent", "Oldest", "Favorites Only"
- **Preset Filter**: Filter by style preset (Fashion, Gym, Travel, etc.)

**Search & Filtering:**
- **Basic Search**: Search by prompt text only (no image content search)
- **Date Range Filter**: "Last 7 days", "Last month", "All time"
- **Type Filter**: Images vs Videos vs Upscaled versions
- **Favorite Toggle**: Show only favorited content
- **No Advanced Search**: Keep search simple to minimize development/server costs

**Bulk Operations:**
- **Multi-Select**: Checkbox selection for multiple items
- **Bulk Actions**: Delete, Favorite/Unfavorite, Download as ZIP
- **No Bulk Editing**: No bulk tagging, moving, or metadata changes
- **Storage Management**: "Free up space" bulk delete for users approaching limits

**Q6.2: Sharing & Export** ✅ ANSWERED (Download-focused, no public sharing)

**Export Options:**
- **Individual Downloads**: Right-click → Save As (JPG for images, MP4 for videos)
- **Bulk Download**: ZIP file with selected content
- **Quality Options**: Full resolution only (no multiple quality tiers to save complexity)
- **File Naming**: Auto-generated: "klipcam_preset_timestamp.jpg"

**No Public Sharing Features:**
- **No Public Links**: Users download and share via their own social media
- **No Built-in Social Sharing**: Reduces liability and development overhead
- **No Gallery Features**: Private library only to minimize moderation needs
- **User Responsibility**: Users handle their own sharing/posting

**Watermarking:**
- **Trial Users Only**: Watermark applied to trial generations
- **Paid Users**: No watermarks on any content
- **No Sharing-Specific Watermarks**: Keep watermarking simple

**Copyright & Attribution:**
- **User Ownership**: Users own their generated content
- **ToS Protection**: Clear terms that users are responsible for their prompts/usage
- **No Attribution Required**: No "Created with KlipCam" requirements
- **DMCA Compliance**: Standard DMCA process for any copyright claims

**Q6.3: Storage & Retention** ✅ ANSWERED (Cost-optimized retention)

**Storage Quotas & Content Expiration:**
- **Trial**: 500MB limit, content expires after 24 hours
- **Basic ($9)**: 2GB limit, content expires after 24 hours
- **Pro ($29)**: 5GB limit, content expires after 1 week
- **Ultimate ($49)**: 10GB limit, content expires after 1 month
- **Creator ($249)**: 50GB limit, content expires after 6 months
- **Storage Warnings**: Notifications at 80% and 95% of quota

**Content Expiration Process:**
- **Automatic Expiration**: Content auto-deletes based on subscription tier (24h to 6 months)
- **Expiration Warnings**: Email notifications at 50%, 80%, and 95% of retention period
- **Download Reminders**: "Your content expires in X days - download now" notifications
- **No Recovery**: Once expired, content cannot be recovered
- **Account Deletion**: Failed payments or cancellations follow standard 30-day account deletion

**Backup & Recovery:**
- **No User Backups**: Users responsible for downloading their content
- **System Backups**: Basic database backups for business continuity only
- **No Content Recovery Service**: Keep support overhead minimal
- **User Education**: Clear messaging about download responsibility

**Storage Cost Management:**
- **Automatic Cleanup**: Delete temp files, failed generations, expired content
- **Compression**: Optimize file sizes without quality loss during storage
- **CDN Strategy**: Use cost-effective storage tiers (cold storage for older content)
- **Monitoring**: Track storage usage per user and overall system costs

### 7. Technical Architecture & Performance
**Q7.1: Performance Requirements** ✅ ANSWERED (Cost-effective performance targets)

**Dashboard Load Time Targets:**
- **Initial Load**: <2 seconds for dashboard with empty state
- **Library Load**: <3 seconds for 20 recent generations
- **Generation Preview**: <500ms for individual asset preview
- **Mobile Performance**: Target same speeds on mobile devices

**Image Delivery & Caching:**
- **Supabase Storage**: Primary storage with built-in CDN
- **Image Optimization**: WebP format for web, original quality for downloads
- **Lazy Loading**: Load images as user scrolls through library
- **Thumbnail Generation**: 400px thumbnails for grid view, full-res on click
- **Browser Caching**: 7-day cache headers for generated content

**CDN Strategy (Cost-Conscious):**
- **Supabase CDN**: Use built-in CDN, no additional CloudFront costs
- **Geographic Distribution**: Rely on Supabase's global edge locations
- **Cache Strategy**: Static assets (presets, thumbnails) cached for 30 days
- **Dynamic Content**: User generations cached based on subscription tier retention periods

**Traffic Spike Handling:**
- **Vercel Auto-Scaling**: Handles frontend traffic spikes automatically
- **Supabase Connection Pooling**: Built-in database connection management
- **Queue Rate Limiting**: Prevent API overload with max generations per user per hour
- **Graceful Degradation**: Show cached content when live data unavailable

**Q7.2: Model Selection & Fallbacks** ✅ ANSWERED (Simple, reliable model strategy)

**Fallback Logic:**
- **Primary Models**: qwen (base tier), FLUX.1-dev (premium tier), wan-2.2-t2v-fast (video)
- **Fallback Triggers**: 
  - Model queue >5 minutes: Switch to fallback automatically
  - Model unavailable: Show user "Using alternate model for faster generation"
  - Cost spike >20%: Temporary fallback to maintain margins
- **Fallback Models**: stability-ai/sdxl-lightning (images), thudm/cogvideox-2b (video)

**A/B Testing Strategy:**
- **v1: No A/B Testing**: Keep simple with proven models
- **v1.1**: Test new models on 10% of generations for Pro+ users
- **Success Metrics**: Generation success rate, user satisfaction, cost per generation
- **Implementation**: Feature flags in database to control model routing

**User Speed vs Quality Controls:**
- **v1: No User Controls**: Preset-optimized parameters only
- **Tier-Based Optimization**: 
  - Basic: Prioritize speed (lower steps/guidance)
  - Pro+: Prioritize quality (higher steps/guidance)
- **v1.1 Consideration**: "Fast Generation" toggle for Pro+ users

**Model Deprecation Handling:**
- **Replicate Monitoring**: Track model status and deprecation notices
- **Migration Strategy**: Test replacement models before primary model deprecated
- **User Communication**: No user notification needed (seamless backend change)
- **Cost Analysis**: Evaluate new model costs before migration

**Q7.3: Monitoring & Analytics** ✅ ANSWERED (Essential metrics for sustainable growth)

**Critical Business Metrics:**
- **Revenue**: MRR, churn rate, upgrade conversion rate by tier
- **Usage**: Credits consumed per user, generations per day, popular presets
- **Conversion**: Trial-to-paid conversion rate, tier upgrade rate
- **Costs**: Replicate spend per user, storage costs, overall unit economics
- **Retention**: DAU/MAU ratio, content download rates, subscription renewal rates

**User Engagement Tracking:**
- **Generation Patterns**: Frequency, preferred times, batch vs. individual usage  
- **Feature Adoption**: Preset usage, I2I vs T2I, video vs image generation
- **Content Lifecycle**: Download rates, time between generation and download
- **Tier Progression**: User journey from trial → Basic → Pro → Ultimate → Creator
- **Retention Signals**: Days since last generation, approaching content expiration

**Technical Monitoring:**
- **System Health**: API response times, Replicate webhook success rates, database performance
- **Error Tracking**: Failed generations, payment failures, content expiration issues
- **Performance**: Dashboard load times, image delivery speed, mobile performance
- **Storage**: Usage per tier, cleanup effectiveness, cost per GB
- **Security**: Failed logins, unusual usage patterns, API abuse

**Issue Detection & Response:**
- **Automated Alerts**: 
  - Replicate API errors >5%
  - Dashboard response time >3 seconds
  - Payment failure rate >2%
  - Storage costs >budget thresholds
- **Response Protocols**:
  - < 5 minutes: Acknowledge and investigate
  - < 30 minutes: Implement temporary fix or communicate status
  - < 2 hours: Deploy permanent fix
- **Tools**: Vercel Analytics, Supabase Dashboard, Stripe Dashboard, custom metrics in database

### 8. Launch & Go-to-Market
**Q8.1: Beta Testing Strategy** ✅ ANSWERED (Focused beta with Instagram creators)

**Initial Beta Users (50-100 total):**
- **Instagram Content Creators**: 10k-100k followers, post daily/weekly
- **Small Business Owners**: Need product photos, social content  
- **Freelance Designers**: Can compare against existing tools
- **Personal Network**: Friends/family who create social content
- **Content Creator Communities**: Discord servers, Reddit communities

**Feedback Mechanisms:**
- **In-App**: Simple 👍👎 rating after each generation + optional comment
- **Weekly Surveys**: Email survey focusing on specific features tested that week
- **Discord Channel**: Private beta Discord for real-time feedback and discussion
- **Usage Analytics**: Track actual behavior vs stated preferences
- **Exit Interviews**: 15-minute calls with users who stop using the product

**Beta Iteration Process:**
- **Week 1-2**: Core generation functionality, preset effectiveness
- **Week 3-4**: UI/UX improvements, mobile experience  
- **Week 5-6**: Credit system, pricing validation, upgrade flows
- **Rapid Fixes**: UI bugs fixed within 24 hours
- **Feature Changes**: Assessed weekly, implemented bi-weekly

**Beta Success Metrics:**
- **Engagement**: >60% of users generate 5+ images in first week
- **Retention**: >40% return after 7 days, >25% after 14 days
- **Satisfaction**: >4.0/5.0 average rating on generations
- **Conversion Intent**: >30% say they'd pay $9-29/month for the service
- **Technical**: <5% generation failure rate, <3 second dashboard load times

**Q8.2: Marketing & Positioning** ✅ ANSWERED (Instagram-focused differentiation)

**Differentiation from Higgsfield & Competitors:**
- **Instagram-Specific**: Presets designed for IG success vs generic styles
- **Content Expiration Model**: Unique tiered retention creates upgrade pressure
- **Simpler Feature Set**: 6 presets vs 100+ effects - less overwhelming
- **Social Creator Focus**: "IG-ready in 5 minutes" vs general creative tools
- **Transparent Pricing**: Clear credit costs vs hidden/complex pricing

**Priority Marketing Channels:**
1. **Instagram Organic**: Post examples from each preset, before/after reels
2. **TikTok Content**: Quick tutorials, preset comparisons, results showcases
3. **YouTube**: Creator tool reviews, workflow tutorials, preset deep-dives
4. **Reddit**: r/Instagram, r/socialmedia, r/entrepreneur communities
5. **Twitter**: Creator community engagement, feature announcements

**Launch Content Strategy:**
- **Preset Showcases**: Video showing each preset's range and capabilities
- **Before/After Comparisons**: Real creator photos → KlipCam generations
- **Speed Demos**: "10 IG posts in 10 minutes" style content
- **Use Case Stories**: Small business owner, influencer, freelancer workflows
- **Competition Comparisons**: Side-by-side with other tools (quality, speed, cost)

**Initial User Base Building:**
- **Creator Outreach**: Direct message 500+ micro-influencers with free Pro trials
- **Partnership Program**: Offer rev-share to creators who refer paid users
- **Product Hunt Launch**: Time launch with strong creator community support
- **Facebook Groups**: Share in entrepreneur, Instagram growth, small business groups
- **SEO Content**: "Best AI tools for Instagram content" targeting long-tail keywords

**Q8.3: Support & Documentation** ✅ ANSWERED (Minimal but effective support)

**Launch Support Channels:**
- **Primary**: Email support (hello@klipcam.com) - 24hr response time goal
- **Knowledge Base**: Self-service help center with common issues
- **In-App Chat**: Intercom or similar for immediate questions during onboarding
- **Community**: Discord server for user-to-user help and feature discussions
- **No Phone Support**: Keep costs low, email covers 95% of issues

**Essential Documentation:**
- **Getting Started Guide**: 5-step walkthrough from signup to first generation
- **Preset Guide**: What each style is best for, with visual examples
- **Credit System Explained**: How credits work, costs per action, tier differences
- **Mobile Guide**: Using KlipCam on phone/tablet effectively
- **Troubleshooting**: Common generation failures and fixes

**Feature Requests & Bug Reports:**
- **In-App Feedback**: Simple thumbs up/down + comment on each generation
- **Feature Request Form**: Typeform collecting user details, use case, willingness to pay
- **Bug Report Template**: Include browser, steps to reproduce, expected vs actual
- **Priority System**: Payment issues > generation failures > feature requests > UI improvements
- **Response Time**: Bugs acknowledged within 4 hours, features monthly review

**Essential FAQ Content:**
- **"Why did my generation fail?"** - Content policy, technical issues, retry steps
- **"When will I be charged?"** - Credit deduction timing, refund policy
- **"How long do I keep my images?"** - Tier-based retention explanation
- **"Can I download in high resolution?"** - Quality options by tier
- **"What's the difference between Base and Premium models?"** - Speed vs quality tradeoff
- **"How do I cancel?"** - Cancellation process, data retention policy
- **"Why do I need to upgrade?"** - Benefits of each tier, upgrade timing suggestions