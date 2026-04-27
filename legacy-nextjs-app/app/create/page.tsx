"use client";
import { useState, useEffect, Suspense } from "react";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";
import { useDemoMode } from "@/components/DemoModeProvider";
import { DemoAwareUserButton } from '@/components/DemoAwareUserButton';
import { PresetGrid } from "@/components/PresetGrid";
import { ImageUpload } from "@/components/ImageUpload";
import { CreditCard, User, TrendingUp, AlertTriangle, Camera, Video, Palette, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PRESETS, getPresetsByCategory, Preset } from "@/lib/presets";
import { ImageResultModal } from "@/components/ImageResultModal";

function CreateContent() {
  const { user, clerkUser, isLoading, error } = useDemoAwareUser();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [referenceImage, setReferenceImage] = useState<{file: File; url: string; uploadedUrl?: string} | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{url: string; jobId: string} | null>(null);
  const [activeCategory, setActiveCategory] = useState<"styles" | "effects" | "all">("all");

  // Debug logging (remove in production)
  // console.log('Create page state:', { user, clerkUser, isLoading, error, isDemoMode });

  // Loading state - simplified, no timeout
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Check authentication - in demo mode we need user, in production we need both user and clerkUser
  if (isDemoMode) {
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Demo Mode Error</h1>
            <p className="text-gray-400">Demo user not loaded properly</p>
          </div>
        </div>
      );
    }
  } else {
    // Production mode - check if user is authenticated
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
            <p className="text-gray-400">You need to sign in to access the create page</p>
          </div>
        </div>
      );
    }
  }

  async function handleImageUpload(file: File, previewUrl: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        setReferenceImage({
          file,
          url: previewUrl,
          uploadedUrl: data.url,
        });
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleImageRemove() {
    setReferenceImage(null);
  }

  function handlePresetSelect(preset: Preset) {
    setSelectedPreset(preset);
    // Clear any previous uploads when changing presets
    setReferenceImage(null);
    setCustomPrompt("");
  }

  async function startGeneration(preset: Preset) {
    if (!preset) return;
    
    setSubmitting(true);
    try {
      // Check credits
      if (user && user.credit_balance < preset.cost) {
        alert(`Insufficient credits. You need ${preset.cost} credits but only have ${user.credit_balance}.`);
        setSubmitting(false);
        return;
      }

      // For video effects, ensure we have an uploaded image
      if (preset.type === "video" && !referenceImage?.uploadedUrl) {
        alert("Please upload a reference image for video effects");
        setSubmitting(false);
        return;
      }

      const body: any = {
        type: preset.type === "video" ? "video" : "image",
        tier: preset.cost === 4 ? "premium" : "base",
        prompt: customPrompt ? `${preset.prompt.replace("{user_prompt}", customPrompt)}` : preset.prompt.replace("{user_prompt}", ""),
        preset_id: preset.id,
        aspect_ratio: "portrait", // Default to portrait for now
      };

      // For image styles or video effects, include reference image
      if (referenceImage?.uploadedUrl) {
        body.reference_image_url = referenceImage.uploadedUrl;
        body.strength = 0.7; // Default strength
      }

      const res = await fetch("/api/jobs", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body) 
      });
      
      const data = await res.json();
      if (res.ok) {
        console.log('🎯 Generation response:', data);
        
        let message = `Generation completed successfully! ID: ${data.jobId}`;
        
        // If we have output, show the result - handle different FAL response formats
        console.log('🔍 FAL Response structure:', data.output);
        
        let imageUrl = null;
        if (data.output) {
          // Try different possible FAL response structures
          if (data.output.images && data.output.images[0]) {
            imageUrl = data.output.images[0].url || data.output.images[0];
          } else if (data.output.url) {
            imageUrl = data.output.url;
          } else if (typeof data.output === 'string') {
            imageUrl = data.output;
          } else if (data.output[0]) {
            imageUrl = data.output[0].url || data.output[0];
          }
        }
        
        if (imageUrl) {
          message += `\n\nGenerated image: ${imageUrl}`;
          
          // Show the image in modal instead of popup
          console.log('🖼️ Generated image:', imageUrl);
          setGeneratedImage({ url: imageUrl, jobId: data.jobId });
          setShowResultModal(true);
        } else {
          console.log('⚠️ Could not find image URL in response:', data);
          alert(message); // Only show alert if no image to display
        }
      } else {
        alert(data.error || "Generation failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Filter presets based on active category
  const filteredPresets = activeCategory === "all" 
    ? PRESETS 
    : activeCategory === "styles"
    ? PRESETS.filter(p => p.type !== "video")
    : PRESETS.filter(p => p.type === "video");

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <h3 className="text-sm font-bold text-yellow-300">Demo Mode</h3>
                <p className="text-xs text-yellow-200/80">
                  This is a demo version. Features are limited and no real processing occurs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Create Amazing Content
            </h1>
            <p className="text-gray-400 mt-2">Transform your photos with AI-powered styles and viral video effects</p>
          </div>
          <DemoAwareUserButton 
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              }
            }}
          />
        </div>

        {/* Credits Display */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user.credit_balance}</p>
                <p className="text-xs text-gray-400">Credits Available</p>
              </div>
            </div>
            {user.plan === 'trial' && user.credit_balance < 10 && (
              <a
                href="/pricing"
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                Get More Credits
              </a>
            )}
          </div>
        </div>

        {/* Step 1: Choose Style */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white text-sm font-bold rounded-full mr-3">
              1
            </div>
            <h2 className="text-lg font-semibold">Choose Your Style</h2>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                activeCategory === "all"
                  ? "border-primary-500 bg-primary-500/10 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>All Options</span>
            </button>
            <button
              onClick={() => setActiveCategory("styles")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                activeCategory === "styles"
                  ? "border-primary-500 bg-primary-500/10 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Photo Styles</span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">1 credit</span>
            </button>
            <button
              onClick={() => setActiveCategory("effects")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                activeCategory === "effects"
                  ? "border-primary-500 bg-primary-500/10 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Effects</span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">25 credits</span>
            </button>
          </div>

          {/* Preset Grid */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              {activeCategory === "styles" ? "Photo Transformation Styles" 
               : activeCategory === "effects" ? "Viral Video Effects"
               : "All Styles & Effects"}
            </h3>
            <PresetGrid
              presets={filteredPresets}
              onSelect={handlePresetSelect}
              showCredits={true}
            />
          </div>
        </div>

        {/* Step 2: Upload Photo - Only show when preset is selected */}
        {selectedPreset && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white text-sm font-bold rounded-full mr-3">
                2
              </div>
              <h2 className="text-lg font-semibold">Upload Your Photo</h2>
            </div>
            
            {/* Selected Style Preview */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedPreset.type === "video" ? "bg-secondary-500" : "bg-primary-500"
                  }`} />
                  <span className="font-medium text-white">{selectedPreset.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedPreset.cost === 25 ? "bg-secondary-500/20 text-secondary-300" : 
                    selectedPreset.cost === 4 ? "bg-purple-500/20 text-purple-300" : "bg-primary-500/20 text-primary-300"
                  }`}>
                    {selectedPreset.cost} credits
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPreset(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Change Style
                </button>
              </div>
              <p className="text-sm text-gray-400">{selectedPreset.description}</p>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Upload a photo to transform it with the "{selectedPreset.name}" style
            </p>
            
            <ImageUpload
              onImageSelected={handleImageUpload}
              onImageRemoved={handleImageRemove}
              currentImage={referenceImage?.url}
            />
            
            {referenceImage && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Description (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific details to enhance the transformation..."
                  className="w-full h-20 p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none resize-none text-sm"
                />
                
                {/* Generate Button */}
                <button
                  onClick={() => startGeneration(selectedPreset)}
                  disabled={submitting || !referenceImage?.uploadedUrl}
                  className="w-full h-12 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Generating...
                    </span>
                  ) : (
                    `Generate ${selectedPreset.name} (${selectedPreset.cost} credits)`
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-primary-400" />
              Photo Styles (1 Credit)
            </h3>
            <p className="text-gray-400 text-sm">
              Transform your uploaded photos with professional styles like Professional Headshots, 
              Fitness Influencer, Street Style, and more. Perfect for social media content.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Video className="w-5 h-5 mr-2 text-secondary-400" />
              Video Effects (25 Credits)
            </h3>
            <p className="text-gray-400 text-sm">
              Add viral animation effects to your photos like Earth Zoom Out, Explosion, 
              Paint Splash, and more. Creates 3-second vertical videos perfect for TikTok and Instagram.
            </p>
          </div>
        </div>
      </div>

      {/* Image Result Modal */}
      <ImageResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        imageUrl={generatedImage?.url}
        jobId={generatedImage?.jobId}
        title="Generated Image"
      />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    }>
      <CreateContent />
    </Suspense>
  );
}