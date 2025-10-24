export interface EffectSettings {
  // Style
  saturation: number;
  brightness: number;
  contrast: number;
  grain: number;
  colorAbyss: number; // 0-1, maps colors to a psychedelic ramp

  // Geometry & Distortion
  rgbShift: number; // pixel shift
  chromaticAberration: number; // lens-like
  fluidDistortion: number; // noise-based fluid effect
  edgeDistortion: number;
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

  // CRT / Overlay
  scanlines: boolean;
  vignette: boolean;

  // LFO Modulation
  lfoTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'feedbackRotation' | 'fluidDistortion' | 'edgeDistortion' | 'colorAbyss';
  lfoWaveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  lfoSpeed: number;
  lfoAmount: number;

  // Audio Reactivity
  audioEnabled: boolean;
  bassTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration';
  midsTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration';
  trebleTarget: 'none' | 'rgbShift' | 'feedbackZoom' | 'fluidDistortion' | 'edgeDistortion' | 'chromaticAberration';
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
