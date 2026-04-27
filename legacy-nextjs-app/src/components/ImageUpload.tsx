"use client";
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onImageRemoved: () => void;
  currentImage?: string;
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

export function ImageUpload({ 
  onImageSelected, 
  onImageRemoved, 
  currentImage,
  maxSize = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"]
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setUploading(true);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError("Whoops! That file type isn't on the VIP list 😅 (Try JPEG, PNG, or WebP)");
      setUploading(false);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`That image is too thicc for our servers! 💪 Keep it under ${maxSize}MB`);
      setUploading(false);
      return;
    }

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      onImageSelected(file, previewUrl);
    } catch (err) {
      setError("The pixels got stage fright! 🎭 Try uploading again?");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    if (currentImage) {
      URL.revokeObjectURL(currentImage);
    }
    onImageRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  };

  if (currentImage) {
    return (
      <div className="relative">
        <div className="relative border-2 border-gray-700 rounded-xl overflow-hidden bg-gray-800">
          <img 
            src={currentImage} 
            alt="Reference" 
            className="w-full h-48 object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragOver 
            ? "border-primary-500 bg-primary-500/5" 
            : "border-gray-700 hover:border-gray-600"
        } ${uploading ? "opacity-50" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-3">
          {uploading ? (
            <div className="flex justify-center relative">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border border-secondary-500/20 rounded-full animate-ping"></div>
              <div className="absolute top-10 text-lg animate-bounce">✨</div>
            </div>
          ) : (
            <div className="flex justify-center relative">
              {dragOver ? (
                <div className="relative">
                  <Upload className="w-8 h-8 text-primary-500 animate-bounce" />
                  <div className="absolute -top-1 -right-1 text-sm animate-spin">🎆</div>
                </div>
              ) : (
                <div className="relative group">
                  <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  <div className="absolute -top-1 -right-1 text-xs opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity">📸</div>
                </div>
              )}
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-300">
              {uploading 
                ? "Making your pixels camera-ready..." 
                : dragOver 
                  ? "Yes! Drop that fire content 🔥" 
                  : "Upload your reference selfie"
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dragOver 
                ? "We're ready to catch it! 🤾" 
                : `PNG, JPEG or WebP • Up to ${maxSize}MB • The higher quality, the better!`
              }
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">😅</span>
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}