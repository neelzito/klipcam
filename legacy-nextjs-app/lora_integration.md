# LoRA Integration Implementation Guide

## API Endpoints Implementation

### Core LoRA Endpoints

#### 1. LoRA Training Endpoint
```typescript
// POST /api/lora/train
interface LoRATrainingRequest {
  name: string;
  images: File[]; // 10-15 training images
  description?: string;
}

interface LoRATrainingResponse {
  lora_model_id: string;
  trigger_word: string;
  status: 'queued' | 'training';
  estimated_completion: string; // ISO timestamp
  cost_credits: number;
}
```

#### 2. Enhanced Generation Endpoint
```typescript
// POST /api/generate/lora
interface LoRAGenerationRequest {
  lora_model_id: string;
  preset_id: string;
  params: {
    prompt: string;
    aspect: "9:16" | "1:1" | "portrait";
    model_tier: "base" | "premium";
  };
}
```

#### 3. LoRA Model Management
```typescript
// GET /api/lora/models
// PUT /api/lora/models/:id/status
// DELETE /api/lora/models/:id
```

## Replicate Integration Pattern

### Training Flow
```typescript
export async function trainLoRAModel(
  userId: string,
  trainingImages: string[],
  triggerWord: string
) {
  const training = await replicate.trainings.create(
    "ostris", // FLUX LoRA trainer
    "flux-dev-lora-trainer",
    {
      input: {
        images: trainingImages,
        trigger_word: triggerWord,
        steps: 1000,
        learning_rate: 0.0001,
        batch_size: 1,
        resolution: 1024,
        autocaption: true
      },
      webhook: `${process.env.NEXT_PUBLIC_URL}/api/replicate/lora-webhook`
    }
  );
  
  return training.id;
}
```

### Enhanced Generation Flow
```typescript
export async function generateWithLoRA(
  loraModelId: string,
  prompt: string,
  params: GenerationParams
) {
  const enhancedPrompt = `${triggerWord} ${prompt}`;
  
  const prediction = await replicate.run(
    `${loraModelId}:latest`,
    {
      input: {
        prompt: enhancedPrompt,
        width: params.width,
        height: params.height,
        guidance_scale: params.guidance,
        num_inference_steps: params.steps
      }
    }
  );
  
  return prediction;
}
```

## Implementation Priorities (6-Day Sprint)

### Day 1-2: Database & Core Infrastructure
- [x] Extend database schema with LoRA tables
- [ ] Create LoRA model management functions
- [ ] Set up training image upload handling

### Day 3-4: Training Pipeline
- [ ] Implement image preprocessing pipeline
- [ ] Integrate with Replicate training API
- [ ] Build training status tracking system
- [ ] Create webhook handlers for training completion

### Day 5-6: Enhanced Generation & UI
- [ ] Extend generation API with LoRA support
- [ ] Update preset system for LoRA integration
- [ ] Build LoRA model selection UI
- [ ] Implement batch generation with LoRA

## Credit System Integration

### Training Costs
```sql
-- Training job costs 150 credits
INSERT INTO presets (id, name, cost_credits, type) 
VALUES ('lora-training', 'Personal LoRA Training', 150, 'lora_training');
```

### Enhanced Generation Costs
```sql
-- Base image with LoRA: 1 -> 3 credits (2x multiplier)
-- Premium image with LoRA: 4 -> 8 credits (2x multiplier)
SELECT estimate_lora_generation_cost(base_cost, true) as lora_cost;
```

## Quality Assurance & Safety

### Training Image Validation
- Minimum resolution: 512x512 (auto-upscale to 1024x1024)
- Face detection: Ensure face present in each image
- Diversity check: Validate variety in poses/lighting
- Content safety: Apply NSFW filters

### Model Quality Control
- Training convergence monitoring
- Generated sample validation
- User feedback integration
- Automatic model archival for poor performers

## User Experience Considerations

### Training UX Flow
1. **Upload Interface**: Drag-and-drop with image previews
2. **Quality Feedback**: Real-time validation messages
3. **Progress Tracking**: Training progress bar with ETA
4. **Notification System**: Email/push when training completes

### Generation UX Flow
1. **Model Selection**: Visual picker for trained LoRA models
2. **Style Combination**: Preset + LoRA model selection
3. **Batch Options**: Generate multiple variations simultaneously
4. **Result Organization**: Group LoRA-generated content

### Mobile Optimization
- Efficient image upload with compression
- Progressive enhancement for training status
- Responsive grid layouts for model management
- Touch-friendly selection interfaces

## Performance Optimizations

### Caching Strategy
- Cache trained model metadata in Redis
- Pre-load user's LoRA models on dashboard
- CDN distribution for training image thumbnails

### Concurrency Management
- Limit to 1 training job per user simultaneously
- Queue system for training requests
- Priority handling for paid users

### Cost Optimization
- Batch training image processing
- Automatic model cleanup for inactive users
- Smart retry logic for failed trainings

## Monitoring & Analytics

### Key Metrics
- LoRA training success rate
- Average training time
- Generation quality scores (user ratings)
- Credit conversion rates for LoRA features

### Error Handling
- Training failure notifications
- Automatic refund processing
- Fallback to base models on LoRA failures
- Comprehensive error logging

## Future Enhancements

### Advanced Features
- Multi-concept LoRA training (face + style)
- LoRA model sharing/marketplace
- Advanced prompt engineering for LoRA
- Style transfer between LoRA models

### Scaling Considerations
- Multi-region training distribution
- Advanced queue management
- Custom training parameter tuning
- Enterprise features for teams

This implementation focuses on rapid deployment while maintaining quality and user experience standards for creator-focused LoRA integration.