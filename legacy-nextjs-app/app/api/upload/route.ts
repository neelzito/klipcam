import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { isDemoMode } from '@/lib/env';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Handle demo mode first
    if (isDemoMode()) {
      // Return a mock response for demo mode
      return NextResponse.json({
        url: '/demo-placeholder.jpg',
        message: 'Demo mode - upload simulated'
      }, { headers: corsHeaders });
    }

    // Check authentication
    const { userId } = requireAuth();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400, headers: corsHeaders });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400, headers: corsHeaders });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `user_${userId}/${fileName}`; // Remove "generated/" prefix since bucket is already "generated"

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('generated')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ 
        error: 'Upload failed: ' + error.message 
      }, { status: 500, headers: corsHeaders });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseServer.storage
      .from('generated')
      .getPublicUrl(filePath);

    // Also get a signed URL as backup (valid for 1 hour)
    const { data: signedUrlData } = await supabaseServer.storage
      .from('generated')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    console.log('Upload result:', {
      publicUrl: publicUrlData.publicUrl,
      signedUrl: signedUrlData?.signedUrl,
      filePath,
      isLocalhost: publicUrlData.publicUrl.includes('localhost') || publicUrlData.publicUrl.startsWith('/demo-uploads')
    });

    return NextResponse.json({
      url: signedUrlData?.signedUrl || publicUrlData.publicUrl, // Prefer signed URL for reliability
      publicUrl: publicUrlData.publicUrl,
      signedUrl: signedUrlData?.signedUrl,
      path: filePath,
      size: file.size,
      type: file.type,
      name: fileName
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: corsHeaders });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = requireAuth();

    if (isDemoMode()) {
      return NextResponse.json({ message: 'Demo mode - delete simulated' });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Verify the file belongs to the user
    if (!filePath.includes(`user_${userId}`)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabaseServer.storage
      .from('generated')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ 
        error: 'Delete failed: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}