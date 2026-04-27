#!/bin/bash

# KlipCam Production Launch Script
# Run this script after configuring all production services

set -e

echo "🚀 KlipCam Production Launch Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Check if required environment variables are set
echo "📋 Checking environment configuration..."

required_vars=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "CLERK_SECRET_KEY"
    "STRIPE_SECRET_KEY"
    "REPLICATE_API_TOKEN"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf ' - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables and try again."
    exit 1
fi

echo "✅ Environment variables configured"

# Run tests
echo ""
echo "🧪 Running tests..."
npm run test -- --run

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please fix issues before launching."
    exit 1
fi

echo "✅ All tests passed"

# Type check
echo ""
echo "🔍 Running TypeScript check..."
npm run typecheck

if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript errors found. Consider fixing before launch."
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ TypeScript check completed"

# Build check
echo ""
echo "🔨 Testing production build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Production build failed. Please fix build issues."
    exit 1
fi

echo "✅ Production build successful"

# Pre-launch checklist
echo ""
echo "📋 Pre-Launch Checklist"
echo "======================="
echo "Please confirm you have completed the following:"
echo ""

checklist=(
    "Domain purchased and configured"
    "Supabase production project created and configured"
    "Clerk production app created with social providers"
    "Stripe production account activated with products"
    "Replicate API keys generated"
    "All webhooks configured and tested"
    "Database schema deployed to production"
    "Environment variables set in Vercel"
    "SSL certificate configured"
    "Monitoring and alerts set up"
)

all_confirmed=true

for item in "${checklist[@]}"; do
    echo -n "☐ $item - Confirm (y/n): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        all_confirmed=false
        echo "❌ Please complete: $item"
    else
        echo "✅ Confirmed"
    fi
done

if [ "$all_confirmed" = false ]; then
    echo ""
    echo "❌ Please complete all checklist items before launching."
    exit 1
fi

echo ""
echo "🎉 Pre-launch checklist completed!"

# Final confirmation
echo ""
echo "🚀 READY TO LAUNCH!"
echo "=================="
echo "Your KlipCam application is ready for production deployment."
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: 'vercel --prod'"
echo "2. Test all critical user flows"
echo "3. Monitor logs and metrics"
echo "4. Celebrate your launch! 🎉"
echo ""

echo "Deploy to production now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying to production..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi
    
    # Deploy to production
    vercel --prod
    
    echo ""
    echo "🎉 LAUNCH SUCCESSFUL!"
    echo "Your KlipCam application is now live!"
    echo ""
    echo "Don't forget to:"
    echo "- Monitor the first few hours closely"
    echo "- Test all critical user flows"
    echo "- Share your success! 🎊"
    
else
    echo ""
    echo "✅ Launch preparation complete."
    echo "Run 'vercel --prod' when you're ready to deploy."
fi

echo ""
echo "🚀 Happy launching!"