import React, { useState, useEffect } from 'react';
import type { EffectSettings } from '../types';

const DEFAULT_SETTINGS: EffectSettings = {
  saturation: 1.0, brightness: 1.0, contrast: 1.0, grain: 0.05, colorAbyss: 0.0,
  rgbShift: 0, chromaticAberration: 0, fluidDistortion: 0, edgeDistortion: 0, crtCurvature: 0.0,
  kaleidoscope: false, kaleidoscopeSegments: 8,
  feedback: false, feedbackAmount: 0.95, feedbackZoom: 0.01, feedbackRotation: 0, feedbackEdgeFade: 1.0,
  scanlines: false, vignette: true,
  lfoTarget: 'none', lfoWaveform: 'sine', lfoSpeed: 0.2, lfoAmount: 0.1,
  audioEnabled: false, bassTarget: 'none', midsTarget: 'none', trebleTarget: 'none', audioGain: 1.0,
  fitMode: 'contain',
};

export const createInitialPresets = (): {name: string; settings: EffectSettings}[] => [
  { name: 'Default', settings: DEFAULT_SETTINGS },
  { name: 'Melting', settings: { ...DEFAULT_SETTINGS, fluidDistortion: 0.05, saturation: 1.5, feedback: true, feedbackAmount: 0.96, feedbackZoom: 0.005, colorAbyss: 0.2 } },
  { name: 'CRT Overdrive', settings: { ...DEFAULT_SETTINGS, grain: 0.2, crtCurvature: 0.1, edgeDistortion: 0.15, chromaticAberration: 8, scanlines: true, vignette: true } },
  { name: 'Kaleido-Dream', settings: { ...DEFAULT_SETTINGS, kaleidoscope: true, kaleidoscopeSegments: 12, feedback: true, feedbackAmount: 0.95, feedbackRotation: 0.005, saturation: 1.8 } },
  { name: 'Data Stream', settings: { ...DEFAULT_SETTINGS, grain: 0.1, fluidDistortion: 0.01, rgbShift: 15, feedback: true, feedbackAmount: 0.92, feedbackZoom: -0.01, lfoTarget: 'rgbShift', lfoWaveform: 'square', lfoSpeed: 1.5, lfoAmount: 20 } },
];

interface PresetManagerProps {
  onSelectPreset: (settings: EffectSettings) => void;
  currentSettings: EffectSettings;
}

const PresetManager: React.FC<PresetManagerProps> = ({ onSelectPreset, currentSettings }) => {
  const [userPresets, setUserPresets] = useState<Record<string, EffectSettings>>({});
  const [selectedPreset, setSelectedPreset] = useState('Default');

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
    const name = prompt("Enter a name for your preset:", "My Preset");
    if (name) {
      const newPresets = { ...userPresets, [name]: currentSettings };
      saveUserPresets(newPresets);
      setSelectedPreset(name);
    }
  };
  
  const handleDelete = () => {
      if (selectedPreset && userPresets[selectedPreset] && confirm(`Are you sure you want to delete "${selectedPreset}"?`)) {
          const newPresets = { ...userPresets };
          delete newPresets[selectedPreset];
          saveUserPresets(newPresets);
          setSelectedPreset('Default');
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

  const allPresets = [...createInitialPresets().map(p => p.name), ...Object.keys(userPresets)];

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 space-y-3 border border-purple-500/30">
      <h3 className="text-md font-semibold text-purple-300">Presets</h3>
      <div className="flex gap-2">
        <select value={selectedPreset} onChange={handleSelect} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
          <optgroup label="Built-in">
            {createInitialPresets().map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </optgroup>
          {Object.keys(userPresets).length > 0 && <optgroup label="User">
            {Object.keys(userPresets).map(name => <option key={name} value={name}>{name}</option>)}
          </optgroup>}
        </select>
        <button onClick={handleSave} title="Save current settings as preset" className="px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500">Save</button>
        {userPresets[selectedPreset] && <button onClick={handleDelete} title="Delete selected preset" className="px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">Del</button>}
      </div>
    </div>
  );
};

export default PresetManager;
