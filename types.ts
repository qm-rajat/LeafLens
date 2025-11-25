export interface LeafAnalysisResult {
  isLeaf: boolean;
  species?: string;
  scientificName?: string;
  confidence?: number;
  description?: string;
  reason?: string; // If not a leaf, why?
}

export enum ViewType {
  ORIGINAL = 'Original',
  GRAYSCALE = 'Structure',
  SKELETON = 'Skeleton',
  HEATMAP = 'Chlorophyll Map', // Simulated heatmap
  BLUEPRINT = 'Blueprint',
  XRAY = 'X-Ray',
  ECO = 'Eco Vision',
  BINARY = 'Binary Image',
  HSV = 'Color Image (RGB/HSV)',
  GRADIENT_MAGNITUDE = 'Gradient Magnitude Map',
  GRADIENT_DIRECTION = 'Gradient Direction Map',
  ZERO_CROSSING = 'Zero-Crossing Map',
  WAVELET = 'Multi-scale Representation (Wavelets)',
  FEATURE_MAP = 'Feature Map'
}

export interface FilterProps {
  imageSrc: string;
  type: ViewType;
  className?: string;
}