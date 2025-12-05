
export interface EffectSettings {
  // Style
  saturation: number;
  brightness: number;
  contrast: number;
  hueRotate: number; // 0-1 (0-360)
  invert: boolean;
  grain: number;
  colorAbyss: number; // 0-1, maps colors to a psychedelic ramp

  // Retro / Digital
  pixelation: number; // 0 to ~20
  glitchStrength: number;
  halftone: number; // 0-1 intensity
  scanlines: boolean;
  vignette: boolean;

  // Geometry & Distortion
  rgbShift: number; // pixel shift
  chromaticAberration: number; // lens-like
  fluidDistortion: number; // noise-based fluid effect
  edgeDistortion: number;
  sobelStrength: number; // Edge detection
  crtCurvature: number;

  // Kaleidoscope
  kaleidoscope: boolean;
  kaleidoscopeSegments: number;

  // Feedback
  feedback: boolean;
  feedbackAmount: number; // mix factor
  feedbackZoom: number;
  feedbackRotation: number;
  feedbackEdgeFade: number;

  // LFO Modulation
  lfoTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'feedbackRotation' | 'fluidDistortion' | 'edgeDistortion' | 'colorAbyss' | 'hueRotate' | 'glitchStrength' | 'pixelation';
  lfoWaveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  lfoSpeed: number;
  lfoAmount: number;

  // Audio Reactivity
  audioEnabled: boolean;
  bassTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration' | 'glitchStrength' | 'pixelation' | 'hueRotate' | 'sobelStrength';
  midsTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration' | 'glitchStrength' | 'pixelation' | 'hueRotate' | 'sobelStrength';
  trebleTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration' | 'glitchStrength' | 'pixelation' | 'hueRotate' | 'sobelStrength';
  audioGain: number;

  // Output
  fitMode: 'contain' | 'cover' | 'fill';
}

export enum VideoSourceType {
  NONE,
  WEBCAM,
  FILE,
}

export interface VideoSource {
  type: VideoSourceType;
  data: MediaStream | string | null;
}

export interface AudioAnalysisData {
  bass: number;
  mids: number;
  treble: number;
}