"use client";
import { useState } from "react";
import { JobList } from "@/components/JobList";
import { AssetGrid } from "@/components/AssetGrid";
import { ImageUpload } from "@/components/ImageUpload";

type VideoType = "base" | "spider" | "loop" | "first-last";
type AspectRatio = "vertical" | "square" | "landscape";
type VideoMode = "t2v" | "i2v" | "loop" | "first-last";

export default function VideosPage() {
  const [prompt, setPrompt] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("base");
  const [videoMode, setVideoMode] = useState<VideoMode>("t2v");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("vertical");
  const [submitting, setSubmitting] = useState(false);
  const [lastJob, setLastJob] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<{file: File; url: string; uploadedUrl?: string} | null>(null);
  const [secondImage, setSecondImage] = useState<{file: File; url: string; uploadedUrl?: string} | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function handleSecondImageUpload(file: File, previewUrl: string) {
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
        setSecondImage({
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

  function handleSecondImageRemove() {
    setSecondImage(null);
  }

  async function submitVideoJob() {
    setSubmitting(true);
    try {
      // Validate required images based on video mode
      if (videoMode === "i2v" && !referenceImage?.uploadedUrl) {
        alert("Please upload a reference image for image-to-video generation");
        setSubmitting(false);
        return;
      }
      
      if (videoMode === "loop" && !referenceImage?.uploadedUrl) {
        alert("Please upload an image for loop video generation");
        setSubmitting(false);
        return;
      }
      
      if (videoMode === "first-last" && (!referenceImage?.uploadedUrl || !secondImage?.uploadedUrl)) {
        alert("Please upload both first and last frame images for transition video");
        setSubmitting(false);
        return;
      }

      const body: any = {
        type: "video",
        subtype: videoMode === "loop" ? "loop" : videoMode === "first-last" ? "first-last" : videoType,
        prompt: prompt,
        aspect_ratio: aspectRatio,
        duration: 3,
        fps: 10,
      };

      // Handle different video modes
      if (videoMode === "i2v" && referenceImage?.uploadedUrl) {
        body.reference_image_url = referenceImage.uploadedUrl;
      } else if (videoMode === "loop" && referenceImage?.uploadedUrl) {
        body.image_url = referenceImage.uploadedUrl;
      } else if (videoMode === "first-last" && referenceImage?.uploadedUrl && secondImage?.uploadedUrl) {
        body.first_frame_image_url = referenceImage.uploadedUrl;
        body.last_frame_image_url = secondImage.uploadedUrl;
      }
      
      const res = await fetch("/api/jobs", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (res.ok) setLastJob(data.jobId);
    } finally {
      setSubmitting(false);
    }
  }

  const getCost = () => {
    if (videoMode === "loop" || videoMode === "first-last") return 20;
    if (videoType === "spider") return 25;
    return 18;
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Create Videos</h1>
          <p className="text-gray-400 mt-2">Generate viral 3-second video clips for social media</p>
        </div>

        {/* Video Generation Form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Generate Video</h2>
          <div className="space-y-6">
            {/* Video Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Generation Mode</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    videoMode === "t2v" 
                      ? "border-primary-500 bg-primary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setVideoMode("t2v")}
                >
                  Text to Video
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    videoMode === "i2v" 
                      ? "border-primary-500 bg-primary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setVideoMode("i2v")}
                >
                  Image to Video
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    videoMode === "loop" 
                      ? "border-secondary-500 bg-secondary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setVideoMode("loop")}
                >
                  🔄 Loop Video
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    videoMode === "first-last" 
                      ? "border-secondary-500 bg-secondary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setVideoMode("first-last")}
                >
                  🎬 Transition
                </button>
              </div>
            </div>

            {/* Image Upload Sections */}
            {(videoMode === "i2v" || videoMode === "loop" || videoMode === "first-last") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {videoMode === "i2v" ? "Reference Image" : 
                   videoMode === "loop" ? "Image to Loop" : "First Frame Image"}
                </label>
                <ImageUpload
                  onImageSelected={handleImageUpload}
                  onImageRemoved={handleImageRemove}
                  currentImage={referenceImage?.url}
                />
              </div>
            )}

            {/* Second Image Upload (First-Last mode) */}
            {videoMode === "first-last" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Last Frame Image</label>
                <ImageUpload
                  onImageSelected={handleSecondImageUpload}
                  onImageRemoved={handleSecondImageRemove}
                  currentImage={secondImage?.url}
                />
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {videoMode === "i2v" ? "Animation description" : 
                 videoMode === "loop" ? "Loop animation description" :
                 videoMode === "first-last" ? "Transition description" : 
                 "Describe your video"} (minimum 10 characters)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  videoMode === "i2v" 
                    ? "Animate this image with gentle movement, flowing hair in the wind..."
                  : videoMode === "loop"
                    ? "Create a smooth looping animation, subtle movement, seamless transitions..."
                  : videoMode === "first-last"
                    ? "Smooth transition between the two images, morphing, flowing movement..."
                  : "A spider crawling across a person's face in slow motion..."
                }
                className="w-full h-24 lg:h-32 p-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Video Type Selection - Only show for T2V and I2V modes */}
            {(videoMode === "t2v" || videoMode === "i2v") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Video Type</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <button
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      videoType === "base" 
                        ? "border-primary-500 bg-primary-500/10" 
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                    onClick={() => setVideoType("base")}
                  >
                    <div className="font-medium">Standard Video</div>
                    <div className="text-sm text-gray-400">18 credits • 3-second clip</div>
                  </button>
                  <button
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      videoType === "spider" 
                        ? "border-secondary-500 bg-secondary-500/10" 
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                    onClick={() => setVideoType("spider")}
                  >
                    <div className="font-medium">🕷️ Spider Effect</div>
                    <div className="text-sm text-gray-400">25 credits • Viral crawling effect</div>
                  </button>
                </div>
              </div>
            )}

            {/* New Video Types Info */}
            {(videoMode === "loop" || videoMode === "first-last") && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="font-medium text-white">
                  {videoMode === "loop" ? "🔄 Loop Video Generation" : "🎬 First-Last Frame Transition"}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {videoMode === "loop" 
                    ? "20 credits • Creates seamless looping video from single image"
                    : "20 credits • Smooth transition between two images"}
                </div>
              </div>
            )}

            {/* Aspect Ratio Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    aspectRatio === "vertical" 
                      ? "border-primary-500 bg-primary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setAspectRatio("vertical")}
                >
                  9:16 Stories
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    aspectRatio === "square" 
                      ? "border-primary-500 bg-primary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setAspectRatio("square")}
                >
                  1:1 Square
                </button>
                <button
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    aspectRatio === "landscape" 
                      ? "border-primary-500 bg-primary-500/10 text-white" 
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                  }`}
                  onClick={() => setAspectRatio("landscape")}
                >
                  16:9 Landscape
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={submitVideoJob}
              disabled={
                submitting || 
                prompt.length < 10 ||
                (videoMode === "i2v" && !referenceImage?.uploadedUrl) ||
                (videoMode === "loop" && !referenceImage?.uploadedUrl) ||
                (videoMode === "first-last" && (!referenceImage?.uploadedUrl || !secondImage?.uploadedUrl))
              }
              className="w-full h-14 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating Video...
                </span>
              ) : (
                `Generate Video (${getCost()} credits)`
              )}
            </button>

            {lastJob && (
              <div className="text-sm text-gray-400 text-center">
                Video job submitted: {lastJob}
              </div>
            )}
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">About Video Generation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Standard Videos</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• 3-second duration</li>
                <li>• 10 FPS for smooth motion</li>
                <li>• Perfect for social media clips</li>
                <li>• Text-to-video generation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Spider Effects</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Viral crawling spider effect</li>
                <li>• Ultra-realistic animation</li>
                <li>• Trending on social platforms</li>
                <li>• Premium quality output</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">🔄 Loop Videos</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Seamless looping animation</li>
                <li>• Single image to video</li>
                <li>• Perfect for boomerangs</li>
                <li>• 480p/720p resolution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">🎬 Transitions</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Smooth image transitions</li>
                <li>• Two images to video</li>
                <li>• AI-powered morphing</li>
                <li>• Creative storytelling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
            <JobList />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Video Library</h2>
            <AssetGrid />
          </div>
        </div>
      </div>
    </div>
  );
}