'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Zap, ArrowRight, Crown, Camera, Video, Wand2, Heart, Shield, Brain, Scale, Github, Twitter } from 'lucide-react';

// Generate placeholder images using data URIs
const generatePlaceholderImage = (width: number, height: number, color: string, text: string) => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <text x="50%" y="45%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${text}</text>
    <text x="50%" y="60%" dominant-baseline="central" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">AI Generated</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Sample images data with working placeholder images
const sampleImages = [
  {
    id: 1,
    title: "Fashion Editorial",
    description: "Professional studio portraits",
    imageUrl: generatePlaceholderImage(400, 400, "#ec4899", "Fashion Editorial"),
    category: "Portrait",
    isNew: false,
    isTopChoice: true
  },
  {
    id: 2,
    title: "Fitness Influencer",
    description: "Dynamic gym photography",
    imageUrl: generatePlaceholderImage(400, 400, "#10b981", "Fitness Influencer"),
    category: "Lifestyle",
    isNew: true,
    isTopChoice: false
  },
  {
    id: 3,
    title: "Street Style",
    description: "Urban fashion vibes",
    imageUrl: generatePlaceholderImage(400, 400, "#f97316", "Street Style"),
    category: "Urban",
    isNew: false,
    isTopChoice: true
  },
  {
    id: 4,
    title: "Beach Swimwear",
    description: "Summer vacation aesthetic",
    imageUrl: generatePlaceholderImage(400, 400, "#06b6d4", "Beach Swimwear"),
    category: "Lifestyle",
    isNew: false,
    isTopChoice: false
  },
  {
    id: 5,
    title: "Travel Adventure",
    description: "Wanderlust moments",
    imageUrl: generatePlaceholderImage(400, 400, "#0891b2", "Travel Adventure"),
    category: "Travel",
    isNew: true,
    isTopChoice: false
  },
  {
    id: 6,
    title: "Glamour Shot",
    description: "Red carpet ready",
    imageUrl: generatePlaceholderImage(400, 400, "#dc2626", "Glamour Shot"),
    category: "Portrait",
    isNew: false,
    isTopChoice: true
  },
  {
    id: 7,
    title: "Earth Zoom Out",
    description: "Viral TikTok effect",
    imageUrl: generatePlaceholderImage(400, 400, "#7c3aed", "Earth Zoom Out"),
    category: "Video Effect",
    isNew: true,
    isTopChoice: false
  },
  {
    id: 8,
    title: "Spiders From Mouth",
    description: "Horror viral trend",
    imageUrl: generatePlaceholderImage(400, 400, "#be185d", "Spiders Effect"),
    category: "Video Effect",
    isNew: false,
    isTopChoice: false
  }
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Portrait', 'Lifestyle', 'Urban', 'Travel', 'Video Effect'];
  
  const filteredImages = selectedCategory === 'All' 
    ? sampleImages 
    : sampleImages.filter(img => img.category === selectedCategory);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Video Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient - No video needed for now */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 animate-gradient-xy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          
          {/* Animated particles for visual interest */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" />
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-primary-400/40 rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-secondary-400/30 rounded-full animate-bounce delay-300" />
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-700" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold">KlipCam</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-primary-300 to-secondary-300 bg-clip-text text-transparent">
              Create Viral
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Content
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your selfies into Instagram-ready content with AI. 
            <span className="text-primary-400 font-semibold"> 10 viral images in under 5 minutes.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/create"
              className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-secondary-600 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Start Creating Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            <Link
              href="#samples"
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>See Examples</span>
              </div>
            </Link>
          </div>

          {/* Stats/Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>10M+ images generated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>Trusted by 100K+ creators</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary-400" />
              <span>5-min generation time</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Sample Images Gallery */}
      <section id="samples" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Endless Possibilities
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From professional headshots to viral TikTok effects. Your creativity, amplified by AI.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-gray-900 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden">
                  {/* Actual image */}
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = generatePlaceholderImage(400, 400, "#6366f1", image.title);
                    }}
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover content */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="text-center space-y-2">
                      {image.category === 'Video Effect' ? (
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <p className="text-white font-medium text-sm">Try This Style</p>
                    </div>
                  </div>
                  
                  {/* Top right action button */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {image.isNew && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        New
                      </span>
                    )}
                    {image.isTopChoice && (
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                        Top Choice
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1">{image.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{image.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary-400 font-medium">{image.category}</span>
                    <div className="flex items-center space-x-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Wand2 className="w-4 h-4" />
                      <span className="text-xs">Try Style</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA at bottom */}
          <div className="text-center mt-16">
            <Link
              href="/create"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-secondary-600 transition-all transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              <span>Create Your First Masterpiece</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">KlipCam</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                AI-powered content creation platform for modern creators. Transform your selfies into viral content in minutes.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-gray-400" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Github className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/create" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Create Content
                  </Link>
                </li>
                <li>
                  <Link href="/characters" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Train Characters
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ai-policy" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center space-x-2">
                    <Brain className="w-3 h-3" />
                    <span>AI Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center space-x-2">
                    <Scale className="w-3 h-3" />
                    <span>Terms of Service</span>
                  </Link>
                </li>
                <li>
                  <a href="mailto:legal@klipcam.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Contact Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} KlipCam. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <span className="text-gray-500 text-sm">Made with</span>
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-gray-500 text-sm">for creators worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}


