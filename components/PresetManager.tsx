import React, { useState, useEffect } from 'react';
import type { EffectSettings } from '../types';

const DEFAULT_SETTINGS: EffectSettings = {
  saturation: 1.0, brightness: 1.0, contrast: 1.0, hueRotate: 0.0, invert: false, grain: 0.05, colorAbyss: 0.0,
  pixelation: 0, glitchStrength: 0, halftone: 0, scanlines: false, vignette: true,
  rgbShift: 0, chromaticAberration: 0, fluidDistortion: 0, edgeDistortion: 0, sobelStrength: 0, crtCurvature: 0.0,
  kaleidoscope: false, kaleidoscopeSegments: 8,
  feedback: false, feedbackAmount: 0.95, feedbackZoom: 0.01, feedbackRotation: 0, feedbackEdgeFade: 1.0,
  lfoTarget: 'none', lfoWaveform: 'sine', lfoSpeed: 0.2, lfoAmount: 0.1,
  audioEnabled: false, bassTarget: 'none', midsTarget: 'none', trebleTarget: 'none', audioGain: 1.0,
  fitMode: 'contain',
};

export const createInitialPresets = (): {name: string; settings: EffectSettings}[] => [
  { name: 'Reality Base', settings: DEFAULT_SETTINGS },
  { name: 'Acid Melt', settings: { ...DEFAULT_SETTINGS, fluidDistortion: 0.05, saturation: 1.5, feedback: true, feedbackAmount: 0.96, feedbackZoom: 0.005, colorAbyss: 0.2 } },
  { name: 'Neural Interface', settings: { ...DEFAULT_SETTINGS, grain: 0.2, crtCurvature: 0.1, edgeDistortion: 0.15, chromaticAberration: 8, scanlines: true, vignette: true, rgbShift: 5 } },
  { name: 'Fractal God', settings: { ...DEFAULT_SETTINGS, kaleidoscope: true, kaleidoscopeSegments: 12, feedback: true, feedbackAmount: 0.95, feedbackRotation: 0.005, saturation: 1.8, hueRotate: 0.2, lfoTarget: 'hueRotate', lfoSpeed: 0.1, lfoAmount: 0.5 } },
  { name: 'Matrix Rain', settings: { ...DEFAULT_SETTINGS, grain: 0.1, fluidDistortion: 0.01, rgbShift: 15, feedback: true, feedbackAmount: 0.92, feedbackZoom: -0.01, lfoTarget: 'rgbShift', lfoWaveform: 'square', lfoSpeed: 1.5, lfoAmount: 20 } },
  { name: 'Neon Tokyo', settings: { ...DEFAULT_SETTINGS, saturation: 2.0, contrast: 1.2, sobelStrength: 0.8, hueRotate: 0.5, feedback: true, feedbackAmount: 0.8, feedbackZoom: 0.02 } },
  { name: 'System Failure', settings: { ...DEFAULT_SETTINGS, glitchStrength: 0.4, rgbShift: 10, pixelation: 5, chromaticAberration: 10, lfoTarget: 'glitchStrength', lfoWaveform: 'sawtooth', lfoSpeed: 0.8, lfoAmount: 0.5 } },
  { name: 'Cartridge Blow', settings: { ...DEFAULT_SETTINGS, pixelation: 10, saturation: 1.2, contrast: 1.5, scanlines: true, crtCurvature: 0.05 } },
  { name: 'Lichtenstein Trip', settings: { ...DEFAULT_SETTINGS, halftone: 0.6, contrast: 1.5, saturation: 0.8, sobelStrength: 0.3 } },
];

interface PresetManagerProps {
  onSelectPreset: (settings: EffectSettings) => void;
  currentSettings: EffectSettings;
}

const PresetManager: React.FC<PresetManagerProps> = ({ onSelectPreset, currentSettings }) => {
  const [userPresets, setUserPresets] = useState<Record<string, EffectSettings>>({});
  const [selectedPreset, setSelectedPreset] = useState('Reality Base');

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem('videoManglerPresets');
      if (storedPresets) {
        setUserPresets(JSON.parse(storedPresets));
      }
    } catch (e) {
      console.error("Could not load user presets", e);
    }
  }, []);

  const saveUserPresets = (presets: Record<string, EffectSettings>) => {
    try {
      localStorage.setItem('videoManglerPresets', JSON.stringify(presets));
      setUserPresets(presets);
    } catch (e) {
      console.error("Could not save user presets", e);
    }
  };

  const handleSave = () => {
    const name = prompt("Name your hallucination:", "My Trip");
    if (name) {
      const newPresets = { ...userPresets, [name]: currentSettings };
      saveUserPresets(newPresets);
      setSelectedPreset(name);
    }
  };
  
  const handleDelete = () => {
      if (selectedPreset && userPresets[selectedPreset] && confirm(`Forget "${selectedPreset}"?`)) {
          const newPresets = { ...userPresets };
          delete newPresets[selectedPreset];
          saveUserPresets(newPresets);
          setSelectedPreset('Reality Base');
          onSelectPreset(createInitialPresets()[0].settings);
      }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedPreset(name);
    const allPresets = { ...Object.fromEntries(createInitialPresets().map(p => [p.name, p.settings])), ...userPresets };
    if (allPresets[name]) {
      onSelectPreset(allPresets[name]);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 space-y-3 border border-white/10 shadow-lg">
      <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Presets
          </h3>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-grow">
            <select value={selectedPreset} onChange={handleSelect} className="w-full bg-gray-900 text-cyan-300 text-sm font-medium p-2 pr-8 rounded border border-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <optgroup label="Built-in Reality Tunnels">
                {createInitialPresets().map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </optgroup>
              {Object.keys(userPresets).length > 0 && <optgroup label="User Trips">
                {Object.keys(userPresets).map(name => <option key={name} value={name}>{name}</option>)}
              </optgroup>}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
        
        <button onClick={handleSave} className="px-3 py-1 text-xs font-bold uppercase rounded bg-gray-800 text-gray-300 hover:bg-fuchsia-600 hover:text-white transition-colors border border-gray-600 hover:border-fuchsia-500">Save</button>
        {userPresets[selectedPreset] && <button onClick={handleDelete} className="px-3 py-1 text-xs font-bold uppercase rounded bg-gray-800 text-red-400 hover:bg-red-600 hover:text-white transition-colors border border-gray-600 hover:border-red-500">Del</button>}
      </div>
    </div>
  );
};

export default PresetManager;