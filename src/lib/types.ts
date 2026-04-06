// Space Analysis Types
export interface SurfaceToMeasure {
  id: string;
  label: string;
  description: string;
  region: string;
}

export interface SpaceAnalysis {
  space_type: string;
  surfaces_to_measure: SurfaceToMeasure[];
  existing_items: string[];
  constraints: string[];
  lighting: string;
  suggested_intent?: 'refresh' | 'redesign' | 'fill'; // AI-suggested design intent based on room state
}

// Measurement Types
export interface Measurement {
  id: string;
  label: string;
  value: number | null; // in cm
}

// Preference Types
export type DesignIntent = 'refresh' | 'redesign' | 'fill';
export type SpaceType = 'living_room' | 'bedroom' | 'kids_room' | 'office' | 'kitchen' | 'bathroom' | 'hallway' | 'other';
export type Goal = 'storage' | 'seating' | 'decoration' | 'workspace' | 'display' | 'sleep' | 'play';
export type StylePreference = 'modern' | 'scandinavian' | 'industrial' | 'bohemian' | 'classic' | 'minimalist' | 'no_preference';
export type BudgetRange = 'under_50' | '50_150' | '150_500' | 'over_500';
export type SpecialNeed = 'pet_friendly' | 'child_safe' | 'waterproof' | 'wheelchair_accessible' | 'none';

export interface UserPreferences {
  designIntent: DesignIntent | null;
  spaceTypes: SpaceType[];
  goals: Goal[];
  styles: StylePreference[];
  budget: BudgetRange | null;
  specialNeeds: SpecialNeed[];
}

// Design Recommendation Types
export interface RecommendedItem {
  type: string;
  search_query: string;
  max_width_cm: number;
  max_depth_cm: number;
  max_height_cm: number;
  color: string;
  placement: string;
  priority: 'essential' | 'recommended' | 'optional';
  price_range_eur?: { min: number; max: number };
  position_hint?: { x: number; y: number }; // 0-100 percentage position on image
}

export interface WallColor {
  name: string;
  hex: string;
  note: string;
}

export interface DesignRecommendation {
  concept: string;
  items: RecommendedItem[];
  wall_color?: WallColor;
  styling_tip: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  dimensions?: {
    width?: number;
    depth?: number;
    height?: number;
  };
  rating?: number;
  affiliate_url: string;
  source: 'awin' | 'amazon';
}

export interface ProductMatch {
  item: RecommendedItem;
  products: Product[];
}

// App State
export interface AppState {
  // Step 1: Photo
  photo: string | null; // base64 data URL

  // Step 2: Analysis
  spaceAnalysis: SpaceAnalysis | null;
  isAnalyzing: boolean;

  // Step 3: Measurements
  measurements: Measurement[];

  // Step 4: Preferences
  preferences: UserPreferences;

  // Step 5: Design
  designRecommendation: DesignRecommendation | null;
  isGeneratingDesign: boolean;

  // Step 6: Products
  productMatches: ProductMatch[];
  isLoadingProducts: boolean;

  // Step 7: Rendered visualization
  renderedImage: string | null; // base64 data URL of AI-generated redesign
  renderType: 'redesign' | 'moodboard' | null; // type of render generated
  isRenderingImage: boolean;
}

// Preference Options for UI
export const DESIGN_INTENTS: { value: DesignIntent; label: string; description: string }[] = [
  { value: 'refresh', label: 'Refresh it', description: 'Keep the layout, just organize and add finishing touches' },
  { value: 'redesign', label: 'Redesign it', description: 'Start fresh with new furniture and layout' },
  { value: 'fill', label: 'Fill it', description: "It's empty and needs furnishing" },
];

export const SPACE_TYPES: { value: SpaceType; label: string }[] = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kids_room', label: 'Kids Room' },
  { value: 'office', label: 'Office' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'other', label: 'Other' },
];

export const GOALS: { value: Goal; label: string }[] = [
  { value: 'storage', label: 'Storage' },
  { value: 'seating', label: 'Seating' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'display', label: 'Display' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'play', label: 'Play' },
];

export const STYLES: { value: StylePreference; label: string }[] = [
  { value: 'modern', label: 'Modern' },
  { value: 'scandinavian', label: 'Scandinavian' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'bohemian', label: 'Bohemian' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'no_preference', label: 'No Preference' },
];

export const BUDGETS: { value: BudgetRange; label: string }[] = [
  { value: 'under_50', label: 'Under €50' },
  { value: '50_150', label: '€50 - €150' },
  { value: '150_500', label: '€150 - €500' },
  { value: 'over_500', label: '€500+' },
];

export const SPECIAL_NEEDS: { value: SpecialNeed; label: string }[] = [
  { value: 'pet_friendly', label: 'Pet-Friendly' },
  { value: 'child_safe', label: 'Child-Safe' },
  { value: 'waterproof', label: 'Waterproof' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { value: 'none', label: 'None' },
];
