"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useDemoAwareUser } from "@/hooks/useDemoAwareUser";
import { useDemoMode } from "@/components/DemoModeProvider";
import { DemoAwareUserButton } from '@/components/DemoAwareUserButton';
import { Upload, Plus, User, Zap, AlertTriangle, Camera, Settings, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

function CharactersContent() {
  const { user, clerkUser, isLoading, error } = useDemoAwareUser();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'gallery' | 'train'>('gallery');
  const [trainingFiles, setTrainingFiles] = useState<File[]>([]);
  const [trainingFileUrls, setTrainingFileUrls] = useState<string[]>([]);
  const [characterName, setCharacterName] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [isStyleTraining, setIsStyleTraining] = useState(false);
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [isTraining, setIsTraining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // No cleanup needed for data URLs (unlike object URLs)

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('Files selected:', files.length);
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const isValid = validTypes.includes(file.type) && file.size <= maxSize;
      console.log(`File ${file.name}: type=${file.type}, size=${file.size}, valid=${isValid}`);
      return isValid;
    });
    
    if (validFiles.length === 0) {
      alert('No valid image files selected. Please choose JPEG, PNG, or WebP images under 10MB.');
      return;
    }
    
    // Create data URLs using FileReader for better compatibility
    const newUrls: string[] = [];
    
    for (const file of validFiles) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('File read error'));
          reader.readAsDataURL(file);
        });
        
        newUrls.push(dataUrl);
        console.log(`Created data URL for ${file.name}: ${dataUrl.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }
    
    setTrainingFiles(prev => {
      const combined = [...prev, ...validFiles].slice(0, 20); // Max 20 files
      console.log('Updated training files:', combined.length);
      return combined;
    });
    
    setTrainingFileUrls(prev => {
      const combined = [...prev, ...newUrls].slice(0, 20);
      console.log('Updated training URLs count:', combined.length);
      return combined;
    });
    
    // Clear the input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Remove file from training set
  const removeFile = (index: number) => {
    setTrainingFiles(prev => prev.filter((_, i) => i !== index));
    setTrainingFileUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle training submission
  const handleStartTraining = async () => {
    if (!characterName || !triggerWord || trainingFiles.length < 4) {
      alert('Please provide character name, trigger word, and at least 4 training images.');
      return;
    }

    if (user && user.credit_balance < 50) {
      alert('Insufficient credits. LoRA training costs 50 credits.');
      return;
    }

    setIsTraining(true);

    try {
      const formData = new FormData();
      formData.append('characterName', characterName);
      formData.append('triggerWord', triggerWord);
      formData.append('isStyle', isStyleTraining.toString());
      formData.append('steps', trainingSteps.toString());

      trainingFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch('/api/characters/train', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Training started successfully! Job ID: ${result.jobId}. Estimated time: ${Math.round(result.estimatedTime / 60)} minutes.`);
        // Reset form
        setCharacterName('');
        setTriggerWord('');
        setTrainingFiles([]);
        setTrainingFileUrls([]);
        setActiveTab('gallery');
      } else {
        alert(`Training failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Training error:', error);
      alert('Failed to start training. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  // Generate suggested trigger word from character name
  const generateTriggerWord = () => {
    if (characterName) {
      const cleaned = characterName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setTriggerWord(`${cleaned}char`);
    }
  };

  // Loading state
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

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to sign in to access Characters</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Characters</h1>
            <p className="text-gray-400">Train custom LoRA models of yourself or characters for personalized content generation</p>
          </div>
          <DemoAwareUserButton 
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              }
            }}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'gallery'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>My Characters</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'train'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Train New</span>
            </div>
          </button>
        </div>

        {/* Characters Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Trained Characters</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-secondary-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Training Jobs</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Camera className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Generated Images</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <User className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">No Characters Yet</h3>
                <p className="text-gray-400 mb-6">
                  Train your first character by uploading 10-20 photos. Once trained, you can generate unlimited personalized content.
                </p>
                <button
                  onClick={() => setActiveTab('train')}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Train Your First Character</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Train New Character Tab */}
        {activeTab === 'train' && (
          <div>
            <div className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">FLUX LoRA Fast Training</h3>
                  <p className="text-gray-300 mb-4">
                    Train custom FLUX LoRA models using FAL AI's fast training technology. Upload 4-20 high-quality images for best results.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Training cost: 50 credits (~$2)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Training time: ~5-10 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Minimum: 4 images, Recommended: 10-20</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>High resolution (1024x1024+) preferred</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Form */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Start Training</h3>
              
              {/* Character Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g., My Character, John Doe"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Trigger Word */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Trigger Word
                  <span className="text-gray-400 text-xs ml-2">(Used to activate this character in prompts)</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    placeholder="e.g., mychar, johnchar"
                    className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={generateTriggerWord}
                    className="px-4 py-3 bg-primary-500/20 border border-primary-500/30 rounded-lg text-primary-400 hover:bg-primary-500/30 transition-colors"
                  >
                    Auto-generate
                  </button>
                </div>
              </div>

              {/* Training Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Training Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsStyleTraining(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !isStyleTraining
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Character/Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStyleTraining(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isStyleTraining
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Art Style
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Training Photos ({trainingFiles.length}/20 selected, minimum 4)
                </label>
                
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
                >
                  <div className="max-w-sm mx-auto">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <Upload className="w-6 h-6 text-primary-400" />
                    </div>
                    <p className="text-white font-medium mb-2">Upload training photos</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Click to select files or drag & drop here
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, WebP • Max 10MB each • 4-20 photos • High resolution preferred
                    </p>
                  </div>
                </div>

                {/* Selected Files */}
                {trainingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-white">Selected Files:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {trainingFiles.map((file, index) => {
                        const imageUrl = trainingFileUrls[index];
                        console.log(`Rendering image ${index}: URL=${imageUrl}, File=${file.name}`);
                        
                        return (
                          <div key={`${file.name}-${index}`} className="relative group">
                            <div className="aspect-square bg-gray-800 rounded-lg p-2 border border-gray-700">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`Training image ${index + 1}`}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    console.error(`Failed to load image ${index + 1}: ${imageUrl}`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    // Show fallback text instead
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-text')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'fallback-text flex items-center justify-center h-full text-gray-400 text-sm';
                                      fallback.textContent = 'Image Load Error';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log(`Image ${index + 1} loaded successfully: ${imageUrl}`);
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                  Loading...
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <details className="mb-6">
                <summary className="text-white font-medium cursor-pointer flex items-center space-x-2 mb-4">
                  <Settings className="w-4 h-4" />
                  <span>Advanced Settings</span>
                </summary>
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Training Steps
                      <span className="text-gray-400 text-xs ml-2">(More steps = higher quality, longer training)</span>
                    </label>
                    <select 
                      value={trainingSteps}
                      onChange={(e) => setTrainingSteps(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="1000">1000 (Fast, Recommended)</option>
                      <option value="1500">1500 (High Quality)</option>
                      <option value="2000">2000 (Maximum Quality)</option>
                    </select>
                  </div>
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Training will cost <span className="text-white font-medium">50 credits</span> (~$2)
                  {trainingFiles.length < 4 && (
                    <div className="text-red-400 mt-1">
                      Need at least 4 training images
                    </div>
                  )}
                </div>
                <button
                  onClick={handleStartTraining}
                  disabled={
                    !user || 
                    user.credit_balance < 50 || 
                    !characterName || 
                    !triggerWord || 
                    trainingFiles.length < 4 ||
                    isTraining
                  }
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
                    <span>{isTraining ? 'Starting Training...' : 'Start Training'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CharactersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    }>
      <CharactersContent />
    </Suspense>
  );
}