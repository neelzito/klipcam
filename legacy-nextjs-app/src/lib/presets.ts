export type PresetCategory = "portrait" | "lifestyle" | "fashion" | "cinematic" | "artistic" | "social" | "business" | "creative" | "video-effects";

export interface Preset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  negativePrompt?: string;
  category: PresetCategory;
  cost: 1 | 4 | 25; // base, premium, or video effects
  tags: string[];
  trending?: boolean;
  new?: boolean;
  thumbnail?: string; // URL to example image
  type?: "image" | "video"; // default is image
}

export const PRESET_CATEGORIES: Record<PresetCategory, { name: string; icon: string; description: string }> = {
  portrait: { name: "Portraits", icon: "👤", description: "Professional headshots and portraits" },
  lifestyle: { name: "Lifestyle", icon: "🌟", description: "Everyday moments and activities" },
  fashion: { name: "Fashion", icon: "👗", description: "Editorial and style photography" },
  cinematic: { name: "Cinematic", icon: "🎬", description: "Movie-like dramatic shots" },
  artistic: { name: "Artistic", icon: "🎨", description: "Creative and artistic styles" },
  social: { name: "Social", icon: "📱", description: "Perfect for social media" },
  business: { name: "Business", icon: "💼", description: "Professional and corporate" },
  creative: { name: "Creative", icon: "✨", description: "Unique and experimental" },
  "video-effects": { name: "Video Effects", icon: "🎥", description: "Viral video transformations" },
};

export const PRESETS: Preset[] = [
  // 6 Core Preset Styles from CLAUDE.md specification
  {
    id: "fashion-editorial",
    name: "Fashion Editorial",
    description: "High-fashion magazine editorial style with dramatic lighting",
    prompt: "{user_prompt}, fashion editorial photography, high-fashion magazine style, dramatic lighting, professional fashion shoot, editorial pose, luxury fashion, studio photography, magazine quality",
    category: "fashion",
    cost: 1,
    tags: ["editorial", "fashion", "magazine", "dramatic", "luxury"],
    trending: true,
  },
  {
    id: "gym-high-contrast",
    name: "Gym High-Contrast",
    description: "High-contrast fitness photography perfect for gym content",
    prompt: "{user_prompt}, gym photography, high contrast lighting, fitness motivation, athletic wear, workout environment, dramatic shadows, fitness lifestyle, energetic pose",
    category: "lifestyle",
    cost: 1,
    tags: ["gym", "fitness", "high-contrast", "workout", "athletic"],
    trending: true,
  },
  {
    id: "warm-indoor",
    name: "Warm Indoor",
    description: "Cozy indoor atmosphere with warm, inviting lighting",
    prompt: "{user_prompt}, warm indoor lighting, cozy atmosphere, soft natural light, comfortable interior, homey feel, relaxed mood, lifestyle photography, intimate setting",
    category: "lifestyle",
    cost: 1,
    tags: ["warm", "indoor", "cozy", "comfortable", "lifestyle"],
  },
  {
    id: "neon-night-street",
    name: "Neon Night Street",
    description: "Urban nighttime photography with vibrant neon lighting",
    prompt: "{user_prompt}, neon night street photography, urban nighttime, vibrant neon lights, city streets at night, cyberpunk atmosphere, street style, night photography",
    category: "cinematic",
    cost: 1,
    tags: ["neon", "night", "street", "urban", "cyberpunk"],
    trending: true,
  },
  {
    id: "travel-sunset",
    name: "Travel Sunset",
    description: "Golden hour travel photography with sunset ambiance",
    prompt: "{user_prompt}, travel sunset photography, golden hour lighting, vacation vibes, scenic destination, warm sunset glow, travel lifestyle, wanderlust mood, outdoor adventure",
    category: "lifestyle",
    cost: 1,
    tags: ["travel", "sunset", "golden-hour", "vacation", "adventure"],
  },
  {
    id: "studio-color-backdrop",
    name: "Studio Color Backdrop",
    description: "Professional studio setup with colorful backdrop",
    prompt: "{user_prompt}, studio photography, colorful backdrop, professional lighting, portrait studio, vibrant background, clean studio setup, professional portrait",
    category: "portrait",
    cost: 1,
    tags: ["studio", "backdrop", "colorful", "professional", "portrait"],
  },

  // Additional I2I Styles from content_types.md (for transforming uploaded photos)
  {
    id: "professional-headshot",
    name: "Professional Headshots",
    description: "LinkedIn, business profiles, corporate needs",
    prompt: "{user_prompt}, professional headshot, business portrait, corporate photography, clean background, confident pose, professional lighting, high-quality studio photography",
    category: "business",
    cost: 1,
    tags: ["professional", "headshot", "corporate", "linkedin", "business"],
    trending: true,
  },
  {
    id: "fitness-influencer",
    name: "Fitness Influencer",
    description: "Gym content, workout posts, athletic brands",
    prompt: "{user_prompt}, fitness influencer photography, athletic wear, gym environment, high contrast lighting, dynamic pose, motivational energy, sports photography aesthetic",
    category: "lifestyle",
    cost: 1,
    tags: ["fitness", "gym", "athletic", "motivation", "sports"],
    trending: true,
  },
  {
    id: "street-style",
    name: "Street Style",
    description: "Fashion content, lifestyle posts, urban aesthetics",
    prompt: "{user_prompt}, street style fashion, urban photography, natural lighting, candid pose, trendy outfit, city background, lifestyle photography, editorial feel",
    category: "fashion",
    cost: 1,
    tags: ["street", "urban", "fashion", "trendy", "lifestyle"],
  },
  {
    id: "beach-swimwear",
    name: "Beach Bikini/Swimwear",
    description: "Summer content, vacation posts, swimwear brands",
    prompt: "{user_prompt}, beach photography, swimwear, tropical setting, golden hour lighting, vacation vibes, summer aesthetic, ocean background, lifestyle portrait",
    category: "lifestyle",
    cost: 1,
    tags: ["beach", "summer", "vacation", "tropical", "swimwear"],
  },
  {
    id: "travel",
    name: "Travel",
    description: "Travel content, destination posts, adventure brands",
    prompt: "{user_prompt}, travel photography, wanderlust aesthetic, scenic location, adventure vibes, natural lighting, vacation mood, destination photography, lifestyle portrait",
    category: "lifestyle",
    cost: 1,
    tags: ["travel", "adventure", "wanderlust", "destination", "vacation"],
  },
  {
    id: "glamour",
    name: "Glamour",
    description: "Beauty content, fashion posts, luxury brands",
    prompt: "{user_prompt}, glamour photography, beauty portrait, dramatic lighting, elegant pose, high-fashion aesthetic, professional makeup, luxurious feel, magazine style",
    category: "fashion",
    cost: 1,
    tags: ["glamour", "beauty", "elegant", "luxury", "magazine"],
  },
  {
    id: "old-money",
    name: "Old Money",
    description: "Luxury fashion, timeless style, sophisticated content",
    prompt: "{user_prompt}, old money aesthetic, timeless elegance, classic fashion, refined sophistication, heritage luxury, understated wealth, traditional style, aristocratic charm",
    category: "fashion",
    cost: 1,
    tags: ["old money", "luxury", "elegant", "classic", "sophisticated"],
    trending: true,
  },
  {
    id: "luxury-lifestyle",
    name: "Luxury Lifestyle",
    description: "Luxury brands, aspirational content, premium lifestyle",
    prompt: "{user_prompt}, luxury lifestyle photography, high-end living, premium quality, sophisticated elegance, exclusive atmosphere, affluent style, upscale environment, refined taste",
    category: "lifestyle",
    cost: 1,
    tags: ["luxury", "premium", "exclusive", "sophisticated", "affluent"],
  },
  {
    id: "y2k-aesthetic",
    name: "Y2K Aesthetic",
    description: "Gen Z content, trendy fashion, nostalgic posts",
    prompt: "{user_prompt}, Y2K aesthetic, early 2000s nostalgia, futuristic retro style, metallic fashion, cyber culture, millennium vibes, digital age fashion, nostalgic trendy",
    category: "fashion",
    cost: 1,
    tags: ["y2k", "retro", "futuristic", "metallic", "nostalgic"],
    trending: true,
  },
  {
    id: "korean-profile",
    name: "Korean Profile Photo",
    description: "K-beauty content, Asian market, clean aesthetic",
    prompt: "{user_prompt}, Korean beauty photography, K-beauty aesthetic, soft natural makeup, clean skincare glow, minimalist style, Seoul fashion, gentle lighting, fresh appearance",
    category: "portrait",
    cost: 1,
    tags: ["korean", "k-beauty", "minimalist", "natural", "clean"],
    new: true,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Artistic content, sci-fi themes, creative posts",
    prompt: "{user_prompt}, cyberpunk aesthetic, neon lighting, futuristic fashion, sci-fi atmosphere, dystopian style, tech noir, electronic culture, digital punk, urban future",
    category: "cinematic",
    cost: 1,
    tags: ["cyberpunk", "neon", "futuristic", "sci-fi", "tech"],
    trending: true,
  },
  {
    id: "linkedin-headshots",
    name: "LinkedIn Headshots",
    description: "Professional networking, career content, B2B posts",
    prompt: "{user_prompt}, LinkedIn professional headshot, business networking photo, corporate profile picture, approachable professional, career-focused portrait, executive presence, workplace appropriate",
    category: "business",
    cost: 1,
    tags: ["linkedin", "professional", "networking", "corporate", "executive"],
  },

  // 12 I2V Video Effects from content_types.md (for adding animation to photos)
  {
    id: "earth-zoom-out",
    name: "Earth Zoom Out",
    description: "Mind-bending perspective shift",
    prompt: "dramatic zoom out revealing Earth from space, cinematic transition, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["space", "earth", "zoom", "perspective", "cinematic"],
    trending: true,
  },
  {
    id: "spiders-from-mouth",
    name: "Spiders From Mouth",
    description: "Shock value, Halloween content",
    prompt: "realistic horror, spiders crawling out of mouth, dramatic lighting, macro shot, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["horror", "halloween", "spiders", "shock", "scary"],
  },
  {
    id: "eyes-in",
    name: "Eyes In",
    description: "Hypnotic transformation",
    prompt: "hypnotic close-up zoom into eye, dramatic focus pull, intense gaze, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["eyes", "hypnotic", "zoom", "intense", "dramatic"],
  },
  {
    id: "explosion",
    name: "Explosion",
    description: "High impact drama",
    prompt: "dramatic explosion effect, action movie style, debris flying, slow motion, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["explosion", "action", "drama", "debris", "slow motion"],
  },
  {
    id: "face-punch",
    name: "Face Punch",
    description: "Comedy/reaction content",
    prompt: "comedy punch effect, exaggerated impact, cartoon-style reaction, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["comedy", "punch", "reaction", "cartoon", "funny"],
  },
  {
    id: "live-concert",
    name: "Live Concert",
    description: "Music/performance energy",
    prompt: "concert stage energy, crowd cheering, spotlight effects, music performance, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["concert", "music", "performance", "stage", "energy"],
  },
  {
    id: "turning-metal",
    name: "Turning Metal",
    description: "Sci-fi transformation",
    prompt: "sci-fi transformation into metal robot, chrome reflection, futuristic effect, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["metal", "robot", "chrome", "sci-fi", "transformation"],
  },
  {
    id: "paint-splash",
    name: "Paint Splash",
    description: "Artistic color burst",
    prompt: "colorful paint explosion, artistic transformation, vibrant colors, dynamic motion, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["paint", "colorful", "explosion", "artistic", "vibrant"],
  },
  {
    id: "powder-explosion",
    name: "Powder Explosion",
    description: "Festival celebration energy",
    prompt: "colored powder burst, Holi festival style, rainbow colors, celebration, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["powder", "holi", "festival", "celebration", "rainbow"],
  },
  {
    id: "paparazzi",
    name: "Paparazzi",
    description: "Celebrity/fame simulation",
    prompt: "camera flash effects, celebrity moment, multiple flashing lights, glamour, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["paparazzi", "celebrity", "flash", "glamour", "fame"],
  },
  {
    id: "kiss",
    name: "Kiss",
    description: "Romantic transformation",
    prompt: "romantic approach, intimate moment, soft focus, dreamy effect, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["kiss", "romantic", "intimate", "dreamy", "love"],
  },
  {
    id: "fast-sprint",
    name: "Fast Sprint",
    description: "Action/fitness movement",
    prompt: "high-speed running motion, athletic movement, dynamic blur, action sequence, 3 seconds, vertical",
    category: "video-effects",
    cost: 25,
    type: "video",
    tags: ["sprint", "running", "athletic", "speed", "action"],
  },
];

export function getPresetsByCategory(category: PresetCategory): Preset[] {
  return PRESETS.filter(preset => preset.category === category);
}

export function getTrendingPresets(): Preset[] {
  return PRESETS.filter(preset => preset.trending);
}

export function getNewPresets(): Preset[] {
  return PRESETS.filter(preset => preset.new);
}

export function searchPresets(query: string): Preset[] {
  const lowercaseQuery = query.toLowerCase();
  return PRESETS.filter(preset => 
    preset.name.toLowerCase().includes(lowercaseQuery) ||
    preset.description.toLowerCase().includes(lowercaseQuery) ||
    preset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(preset => preset.id === id);
}