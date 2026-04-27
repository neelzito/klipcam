/**
 * LoRA UI Components Library
 * 
 * React components for the LoRA workflow in KlipCam, following the Capacity.so
 * design system with Higgsfield.ai UX patterns. Mobile-first, dark theme,
 * optimized for rapid Creator workflow.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Upload, Camera, Trash2, CheckCircle, AlertCircle, 
  Zap, Users, TrendingUp, Clock, Star, Download,
  Play, Pause, RotateCcw, Settings, Eye, Archive
} from 'lucide-react';
import {
  LoRAModelWithStats,
  TrainingImageUpload,
  ImageValidationResult,
  LoRATrainingJob,
  LoRAGenerationJob,
  GenerationProgress,
  LoRAPreset,
  ValidationIssue
} from '../lib/lora-workflow-components';

// =============================================
// TRAINING UPLOAD COMPONENT
// =============================================

interface LoRAUploadZoneProps {
  onImagesUploaded: (images: TrainingImageUpload[]) => void;
  maxImages: number;
  validationResults: ImageValidationResult[];
  isProcessing: boolean;
  existingImages: TrainingImageUpload[];
}

export function LoRAUploadZone({
  onImagesUploaded,
  maxImages = 15,
  validationResults = [],
  isProcessing = false,
  existingImages = []
}: LoRAUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<TrainingImageUpload[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    const newImages: TrainingImageUpload[] = [];
    const remainingSlots = maxImages - uploadedImages.length;
    
    Array.from(files).slice(0, remainingSlots).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUpload: TrainingImageUpload = {
            id: `upload_${Date.now()}_${index}`,
            file,
            preview: e.target?.result as string,
            uploadOrder: uploadedImages.length + index + 1,
            status: 'uploading'
          };
          newImages.push(imageUpload);
          
          if (newImages.length === Array.from(files).slice(0, remainingSlots).length) {
            const updated = [...uploadedImages, ...newImages];
            setUploadedImages(updated);
            onImagesUploaded(updated);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [uploadedImages, maxImages, onImagesUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((imageId: string) => {
    const updated = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updated);
    onImagesUploaded(updated);
  }, [uploadedImages, onImagesUploaded]);

  const validImagesCount = uploadedImages.filter(img => {
    const validation = validationResults.find(v => v.isValid);
    return validation?.isValid !== false;
  }).length;

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">
          Upload Training Images ({uploadedImages.length}/{maxImages})
        </h3>
        <p className="text-gray-400 text-sm">
          {validImagesCount >= 8 ? (
            <span className="text-green-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Ready to train with {validImagesCount} valid images
            </span>
          ) : (
            <span>Need at least 8 valid selfies • {8 - validImagesCount} more required</span>
          )}
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
          ${dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 hover:border-gray-500'}
          ${uploadedImages.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => uploadedImages.length < maxImages && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploadedImages.length >= maxImages}
        />
        
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-2">
            {uploadedImages.length >= maxImages ? 'Maximum images reached' : 'Drag photos here or click to upload'}
          </p>
          <p className="text-sm text-gray-400">
            JPG, PNG, HEIC • Max 10MB each • Clear face shots work best
          </p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <p className="text-orange-300 font-medium">Drop images here</p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {uploadedImages.map((image, index) => {
            const validation = validationResults[index];
            const isValid = validation?.isValid !== false;
            
            return (
              <div key={image.id} className="relative group">
                <div className={`
                  relative rounded-lg overflow-hidden border-2 transition-all
                  ${isValid ? 'border-green-500' : 'border-red-500'}
                  ${image.status === 'uploading' ? 'opacity-50' : ''}
                `}>
                  <img
                    src={image.preview}
                    alt={`Upload ${image.uploadOrder}`}
                    className="w-full aspect-square object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-2 left-2">
                    {image.status === 'uploading' ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse" />
                    ) : isValid ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Order Number */}
                  <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{image.uploadOrder}</span>
                  </div>
                </div>

                {/* Validation Message */}
                {validation && !isValid && (
                  <div className="mt-1 text-xs text-red-400">
                    {validation.issues?.[0]?.message || 'Invalid image'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 justify-center">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadedImages.length >= maxImages}
        >
          <Camera className="w-4 h-4" />
          Add Photos
        </button>
        
        {uploadedImages.length > 0 && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
            onClick={() => {
              setUploadedImages([]);
              onImagesUploaded([]);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================
// TRAINING PROGRESS COMPONENT
// =============================================

interface TrainingProgressProps {
  job: LoRATrainingJob;
  onCancel?: () => void;
  onComplete?: (modelId: string) => void;
  showDetails?: boolean;
}

export function TrainingProgress({ 
  job, 
  onCancel, 
  onComplete, 
  showDetails = true 
}: TrainingProgressProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (job.status === 'completed' && onComplete) {
      onComplete(job.modelId);
    }
  }, [job.status, job.modelId, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-blue-400';
      case 'training': return 'text-purple-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="w-5 h-5" />;
      case 'training': return <Zap className="w-5 h-5 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'failed': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${getStatusColor(job.status)}`}>
            {getStatusIcon(job.status)}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              Training: {job.modelId}
            </h3>
            <p className={`text-sm ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </p>
          </div>
        </div>

        {onCancel && job.status === 'training' && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {job.status === 'training' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">{job.progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{job.progress.currentStep}/{job.progress.totalSteps} steps</span>
            <span>~{job.progress.eta} remaining</span>
          </div>
        </div>
      )}

      {/* Status Details */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Started:</span>
            <span className="text-white">
              {new Date(job.startedAt!).toLocaleString()}
            </span>
          </div>
          
          {job.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-400">Completed:</span>
              <span className="text-white">
                {new Date(job.completedAt).toLocaleString()}
              </span>
            </div>
          )}

          {job.errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
              <p className="text-red-400 text-sm">{job.errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {job.status === 'completed' && (
        <div className="mt-4 flex gap-3">
          <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Start Generating
          </button>
          <button className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors">
            View Details
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================
// MODEL SELECTOR COMPONENT  
// =============================================

interface LoRAModelSelectorProps {
  models: LoRAModelWithStats[];
  selectedModelId?: string;
  onModelSelect: (modelId: string) => void;
  showStats?: boolean;
}

export function LoRAModelSelector({
  models,
  selectedModelId,
  onModelSelect,
  showStats = true
}: LoRAModelSelectorProps) {
  const readyModels = models.filter(m => m.status === 'ready');
  const trainingModels = models.filter(m => m.status === 'training');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Choose Your AI Model
        </h3>
        <p className="text-gray-400 text-sm">
          Personal models generate enhanced, consistent results
        </p>
      </div>

      {/* Ready Models */}
      {readyModels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Personal Models</h4>
          {readyModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModelId === model.id}
              onSelect={onModelSelect}
              showStats={showStats}
            />
          ))}
        </div>
      )}

      {/* Training Models */}
      {trainingModels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Training in Progress</h4>
          {trainingModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={false}
              onSelect={() => {}}
              showStats={false}
              disabled
            />
          ))}
        </div>
      )}

      {/* Base Model Option */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Base Models</h4>
        <div
          className={`
            p-4 border rounded-xl cursor-pointer transition-all
            ${!selectedModelId ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 hover:border-gray-500'}
          `}
          onClick={() => onModelSelect('')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Generic Fashion Model</h4>
                <p className="text-xs text-gray-400">Standard generation • 1× credits</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-gray-400">1 credit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: LoRAModelWithStats;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
  showStats: boolean;
  disabled?: boolean;
}

function ModelCard({ model, isSelected, onSelect, showStats, disabled = false }: ModelCardProps) {
  return (
    <div
      className={`
        p-4 border rounded-xl transition-all cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 hover:border-gray-500'}
      `}
      onClick={() => !disabled && onSelect(model.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              {model.name}
              {model.status === 'ready' && <span className="text-yellow-400">✨</span>}
            </h4>
            <p className="text-xs text-gray-400">
              {model.status === 'training' 
                ? 'Training in progress...' 
                : `Enhanced generation • 2× credits`
              }
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {model.status === 'ready' ? (
            <span className="text-sm text-gray-400">3 credits</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400">Training</span>
            </div>
          )}
        </div>
      </div>

      {showStats && model.status === 'ready' && (
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {model.stats.totalGenerations} uses
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {model.stats.averageRating.toFixed(1)}/5.0
          </span>
          <span>
            Last used: {model.stats.lastUsedAt 
              ? new Date(model.stats.lastUsedAt).toLocaleDateString()
              : 'Never'
            }
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================
// PRESET GRID WITH LORA ENHANCEMENT
// =============================================

interface LoRAPresetGridProps {
  presets: LoRAPreset[];
  selectedModelId: string;
  onPresetSelect: (presetId: string) => void;
  selectedPresets: string[];
  multiSelect?: boolean;
}

export function LoRAPresetGrid({
  presets,
  selectedModelId,
  onPresetSelect,
  selectedPresets = [],
  multiSelect = false
}: LoRAPresetGridProps) {
  const hasLoRA = !!selectedModelId;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Choose Your Style
        </h3>
        {hasLoRA && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">Enhanced with your AI model</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const isSelected = selectedPresets.includes(preset.id);
          const enhancedCost = hasLoRA ? preset.baseCredits * preset.loraMultiplier : preset.baseCredits;
          
          return (
            <div
              key={preset.id}
              className={`
                relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                ${isSelected ? 'border-orange-500' : 'border-gray-600 hover:border-gray-500'}
              `}
              onClick={() => onPresetSelect(preset.id)}
            >
              {/* Preset Image */}
              <div className="aspect-[4/5] relative overflow-hidden">
                <img
                  src={preset.thumbnailUrl}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Enhancement Badge */}
                {hasLoRA && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-purple-500/90 rounded-full">
                    <Zap className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">Enhanced</span>
                  </div>
                )}
              </div>

              {/* Preset Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="font-semibold text-white mb-1">{preset.name}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">{preset.description}</p>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${hasLoRA ? 'text-purple-300' : 'text-gray-300'}`}>
                      {enhancedCost} credits
                    </span>
                    {hasLoRA && preset.loraMultiplier > 1 && (
                      <p className="text-xs text-gray-400">
                        {preset.loraMultiplier}× enhanced
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Generation Summary */}
      {multiSelect && selectedPresets.length > 1 && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">
                Batch Generation ({selectedPresets.length} styles)
              </h4>
              <p className="text-sm text-gray-400">
                Generate multiple styles simultaneously
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold text-white">
                {selectedPresets.reduce((total, presetId) => {
                  const preset = presets.find(p => p.id === presetId);
                  const cost = preset ? (hasLoRA ? preset.baseCredits * preset.loraMultiplier : preset.baseCredits) : 0;
                  return total + cost;
                }, 0)} credits
              </span>
              <p className="text-xs text-gray-400">
                ~{Math.ceil(selectedPresets.length / 2)} minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// GENERATION PROGRESS COMPONENT
// =============================================

interface GenerationProgressProps {
  progress: GenerationProgress;
  onCancel?: () => void;
  showPreview?: boolean;
}

export function GenerationProgress({ 
  progress, 
  onCancel, 
  showPreview = true 
}: GenerationProgressProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              Generating Your Collection
            </h3>
            <p className="text-sm text-gray-400">
              {progress.currentJob}/{progress.totalJobs} complete
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg transition-colors"
          >
            Cancel All
          </button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Overall Progress</span>
          <span className="text-white">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-gray-400">
            ~{progress.estimatedTimeRemaining} remaining
          </span>
        </div>
      </div>

      {/* Individual Generation Status */}
      <div className="space-y-3">
        {progress.activeGenerations.map((gen, index) => (
          <div key={gen.presetId} className="flex items-center gap-4">
            {/* Status Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${gen.status === 'completed' ? 'bg-green-500' :
                gen.status === 'generating' ? 'bg-blue-500 animate-pulse' :
                gen.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'}
            `}>
              {gen.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : gen.status === 'generating' ? (
                <Zap className="w-4 h-4 text-white" />
              ) : gen.status === 'failed' ? (
                <AlertCircle className="w-4 h-4 text-white" />
              ) : (
                <Clock className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Generation Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{gen.presetName}</span>
                {gen.status === 'generating' && (
                  <span className="text-sm text-blue-400">{gen.progress}%</span>
                )}
              </div>
              
              {gen.status === 'generating' && (
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${gen.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            {showPreview && gen.resultUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img
                  src={gen.resultUrl}
                  alt={`Generated ${gen.presetName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================
// MODEL MANAGEMENT DASHBOARD
// =============================================

interface LoRAModelLibraryProps {
  models: LoRAModelWithStats[];
  onModelAction: (modelId: string, action: string) => void;
  onTrainNew: () => void;
}

export function LoRAModelLibrary({ 
  models, 
  onModelAction, 
  onTrainNew 
}: LoRAModelLibraryProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const readyModels = models.filter(m => m.status === 'ready');
  const trainingModels = models.filter(m => m.status === 'training');
  const archivedModels = models.filter(m => m.status === 'archived');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Personal AI Models ({readyModels.length}/3)
          </h2>
          <p className="text-gray-400">
            Train personalized models for consistent, high-quality results
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <button
            onClick={onTrainNew}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            disabled={readyModels.length + trainingModels.length >= 3}
          >
            <Zap className="w-4 h-4" />
            Train New Model
          </button>
        </div>
      </div>

      {/* Ready Models */}
      {readyModels.length > 0 && (
        <ModelSection
          title="Ready Models"
          models={readyModels}
          viewMode={viewMode}
          onModelAction={onModelAction}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      )}

      {/* Training Models */}
      {trainingModels.length > 0 && (
        <ModelSection
          title="Training in Progress"
          models={trainingModels}
          viewMode={viewMode}
          onModelAction={onModelAction}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      )}

      {/* Archived Models */}
      {archivedModels.length > 0 && (
        <ModelSection
          title="Archived Models"
          models={archivedModels}
          viewMode={viewMode}
          onModelAction={onModelAction}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      )}

      {/* Empty State */}
      {models.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Personal AI Models Yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Train your first personal AI model to generate consistent, 
            high-quality content that looks just like you.
          </p>
          <button
            onClick={onTrainNew}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Train Your First Model
          </button>
        </div>
      )}
    </div>
  );
}

interface ModelSectionProps {
  title: string;
  models: LoRAModelWithStats[];
  viewMode: 'grid' | 'list';
  onModelAction: (modelId: string, action: string) => void;
  selectedModel: string | null;
  setSelectedModel: (id: string | null) => void;
}

function ModelSection({ 
  title, 
  models, 
  viewMode, 
  onModelAction,
  selectedModel,
  setSelectedModel
}: ModelSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }
      `}>
        {models.map((model) => (
          <ModelLibraryCard
            key={model.id}
            model={model}
            viewMode={viewMode}
            onAction={onModelAction}
            isSelected={selectedModel === model.id}
            onSelect={() => setSelectedModel(
              selectedModel === model.id ? null : model.id
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface ModelLibraryCardProps {
  model: LoRAModelWithStats;
  viewMode: 'grid' | 'list';
  onAction: (modelId: string, action: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelLibraryCard({ 
  model, 
  viewMode, 
  onAction, 
  isSelected, 
  onSelect 
}: ModelLibraryCardProps) {
  if (viewMode === 'list') {
    return (
      <div className={`
        p-4 border rounded-xl transition-all cursor-pointer
        ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-600'}
      `} onClick={onSelect}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h4 className="font-semibold text-white flex items-center gap-2">
                {model.name}
                {model.status === 'ready' && <span className="text-yellow-400">✨</span>}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{model.stats.totalGenerations} generations</span>
                <span>{model.stats.averageRating.toFixed(1)}/5.0 rating</span>
                <span>Created {new Date(model.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {model.status === 'ready' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(model.id, 'generate');
                  }}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                >
                  Generate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(model.id, 'archive');
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-gray-900/50 border rounded-xl p-6 transition-all cursor-pointer
      ${isSelected ? 'border-orange-500' : 'border-gray-700 hover:border-gray-600'}
    `} onClick={onSelect}>
      {/* Model Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        
        {model.status === 'ready' && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white">{model.stats.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Model Info */}
      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
        {model.name}
        {model.status === 'ready' && <span className="text-yellow-400">✨</span>}
      </h4>

      <div className="space-y-2 text-sm text-gray-400 mb-4">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`capitalize ${
            model.status === 'ready' ? 'text-green-400' :
            model.status === 'training' ? 'text-blue-400' : 'text-gray-400'
          }`}>
            {model.status}
          </span>
        </div>
        
        {model.status === 'ready' && (
          <>
            <div className="flex justify-between">
              <span>Generations:</span>
              <span className="text-white">{model.stats.totalGenerations}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Last Used:</span>
              <span className="text-white">
                {model.stats.lastUsedAt 
                  ? new Date(model.stats.lastUsedAt).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {model.status === 'ready' ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(model.id, 'generate');
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Generate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(model.id, 'stats');
              }}
              className="px-3 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </>
        ) : model.status === 'training' ? (
          <button
            disabled
            className="flex-1 bg-gray-700 text-gray-400 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Training...
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(model.id, 'restore');
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
}

export default {
  LoRAUploadZone,
  TrainingProgress,
  LoRAModelSelector,
  LoRAPresetGrid,
  GenerationProgress,
  LoRAModelLibrary
};