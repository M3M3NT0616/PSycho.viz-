import React from 'react';
import type { EffectSettings } from '../types';

interface ControlPanelProps {
  settings: EffectSettings;
  onSettingsChange: (settings: Partial<EffectSettings>) => void;
  randomize: () => void;
  audioError: string | null;
  startAudio: () => void;
  stopAudio: () => void;
}

const Slider: React.FC<{label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void;}> = ({ label, value, min, max, step, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-purple-300">{label}</label>
        <span className="text-xs font-mono bg-gray-700/50 px-2 py-1 rounded">{value.toFixed(2)}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
    />
  </div>
);

const Toggle: React.FC<{label: string; checked: boolean; onChange: (checked: boolean) => void;}> = ({ label, checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        <span className="ml-3 text-sm font-medium text-purple-300">{label}</span>
    </label>
);

const ButtonGroup: React.FC<{ label: string; options: string[]; value: string; onChange: (value: string) => void; }> = ({ label, options, value, onChange }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-purple-300">{label}</label>
      <div className="flex space-x-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 w-full ${
              value === option
                ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

const Select: React.FC<{ label: string; options: {value: string; label: string}[]; value: string; onChange: (value: string) => void; }> = ({ label, options, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-purple-300">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const ControlSection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <details className="group" open>
        <summary className="text-md font-semibold text-purple-300 cursor-pointer list-none flex justify-between items-center pb-2 border-b border-gray-700">
            {title}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </summary>
        <div className="pt-4 space-y-4">
            {children}
        </div>
    </details>
);

const lfoTargetOptions: {value: EffectSettings['lfoTarget'], label: string}[] = [
    { value: 'none', label: 'None' }, { value: 'rgbShift', label: 'RGB Shift' }, { value: 'feedbackZoom', label: 'Feedback Zoom' },
    { value: 'feedbackRotation', label: 'Feedback Rotation' }, { value: 'fluidDistortion', label: 'Fluid Distortion' },
    { value: 'edgeDistortion', label: 'Edge Distortion' }, { value: 'colorAbyss', label: 'Color Abyss' },
];

const audioTargetOptions: {value: EffectSettings['bassTarget'], label: string}[] = [
    { value: 'none', label: 'None' }, { value: 'rgbShift', label: 'RGB Shift' }, { value: 'feedbackZoom', label: 'Feedback Zoom' },
    { value: 'fluidDistortion', label: 'Fluid Distortion' }, { value: 'edgeDistortion', label: 'Edge Distortion' },
    { value: 'chromaticAberration', label: 'Chromatic Aberration' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange, randomize, audioError, startAudio, stopAudio }) => {
  const handleChange = <T extends keyof EffectSettings>(key: T, value: EffectSettings[T]) => {
    onSettingsChange({ [key]: value });
  };

  const handleAudioToggle = (enabled: boolean) => {
    handleChange('audioEnabled', enabled);
    if(enabled) startAudio(); else stopAudio();
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 space-y-6 border border-purple-500/30 shadow-lg h-full overflow-y-auto">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
        <h2 className="text-lg font-bold text-purple-300">Effect Controls</h2>
        <button onClick={randomize} className="px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500">
            Randomize
        </button>
      </div>

      <ControlSection title="Style">
        <Slider label="Brightness" value={settings.brightness} min={0} max={2} step={0.01} onChange={v => handleChange('brightness', v)} />
        <Slider label="Contrast" value={settings.contrast} min={0} max={3} step={0.01} onChange={v => handleChange('contrast', v)} />
        <Slider label="Saturation" value={settings.saturation} min={0} max={3} step={0.01} onChange={v => handleChange('saturation', v)} />
        <Slider label="Color Abyss" value={settings.colorAbyss} min={0} max={1} step={0.01} onChange={v => handleChange('colorAbyss', v)} />
        <Slider label="Grain" value={settings.grain} min={0} max={0.5} step={0.01} onChange={v => handleChange('grain', v)} />
      </ControlSection>

      <ControlSection title="Geometry">
        <Slider label="RGB Shift" value={settings.rgbShift} min={0} max={50} step={1} onChange={v => handleChange('rgbShift', v)} />
        <Slider label="Chromatic Aberration" value={settings.chromaticAberration} min={0} max={20} step={0.1} onChange={v => handleChange('chromaticAberration', v)} />
        <Slider label="Fluid Distortion" value={settings.fluidDistortion} min={0} max={0.3} step={0.001} onChange={v => handleChange('fluidDistortion', v)} />
        <Slider label="Edge Distortion" value={settings.edgeDistortion} min={0} max={0.5} step={0.001} onChange={v => handleChange('edgeDistortion', v)} />
        <Slider label="CRT Curvature" value={settings.crtCurvature} min={0} max={0.2} step={0.001} onChange={v => handleChange('crtCurvature', v)} />
        <div className="pt-2"><Toggle label="Kaleidoscope" checked={settings.kaleidoscope} onChange={v => handleChange('kaleidoscope', v)} /></div>
        <Slider label="Segments" value={settings.kaleidoscopeSegments} min={2} max={40} step={2} onChange={v => handleChange('kaleidoscopeSegments', v)} />
      </ControlSection>

       <ControlSection title="Feedback">
        <Toggle label="Feedback Loop" checked={settings.feedback} onChange={v => handleChange('feedback', v)} />
        <Slider label="Feedback Amount" value={settings.feedbackAmount} min={0.5} max={1} step={0.001} onChange={v => handleChange('feedbackAmount', v)} />
        <Slider label="Feedback Zoom" value={settings.feedbackZoom} min={-0.1} max={0.1} step={0.001} onChange={v => handleChange('feedbackZoom', v)} />
        <Slider label="Feedback Rotation" value={settings.feedbackRotation} min={-0.05} max={0.05} step={0.001} onChange={v => handleChange('feedbackRotation', v)} />
        <Slider label="Feedback Edge Fade" value={settings.feedbackEdgeFade} min={0} max={5} step={0.1} onChange={v => handleChange('feedbackEdgeFade', v)} />
      </ControlSection>

      <ControlSection title="Modulation">
        <Select label="LFO Target" options={lfoTargetOptions} value={settings.lfoTarget} onChange={v => handleChange('lfoTarget', v as EffectSettings['lfoTarget'])} />
        <ButtonGroup label="LFO Waveform" options={['sine', 'triangle', 'square', 'sawtooth']} value={settings.lfoWaveform} onChange={v => handleChange('lfoWaveform', v as EffectSettings['lfoWaveform'])} />
        <Slider label="LFO Speed" value={settings.lfoSpeed} min={0} max={2} step={0.01} onChange={v => handleChange('lfoSpeed', v)} />
        <Slider label="LFO Amount" value={settings.lfoAmount} min={0} max={1} step={0.01} onChange={v => handleChange('lfoAmount', v)} />
      </ControlSection>
      
       <ControlSection title="Audio Reactivity">
        <Toggle label="Enable Microphone" checked={settings.audioEnabled} onChange={handleAudioToggle} />
        {audioError && <p className="text-xs text-red-400">{audioError}</p>}
        <Slider label="Audio Gain" value={settings.audioGain} min={0} max={5} step={0.1} onChange={v => handleChange('audioGain', v)} />
        <Select label="Bass Target" options={audioTargetOptions} value={settings.bassTarget} onChange={v => handleChange('bassTarget', v as EffectSettings['bassTarget'])} />
        <Select label="Mids Target" options={audioTargetOptions} value={settings.midsTarget} onChange={v => handleChange('midsTarget', v as EffectSettings['midsTarget'])} />
        <Select label="Treble Target" options={audioTargetOptions} value={settings.trebleTarget} onChange={v => handleChange('trebleTarget', v as EffectSettings['trebleTarget'])} />
       </ControlSection>
      
      <ControlSection title="Overlays">
        <div className='flex flex-col space-y-3 pt-2'>
            <Toggle label="Scanlines" checked={settings.scanlines} onChange={v => handleChange('scanlines', v)} />
            <Toggle label="Vignette" checked={settings.vignette} onChange={v => handleChange('vignette', v)} />
        </div>
      </ControlSection>

      <ControlSection title="Output">
        <ButtonGroup label="Aspect Ratio Fit" options={['contain', 'cover', 'fill']} value={settings.fitMode} onChange={v => handleChange('fitMode', v as 'contain'|'cover'|'fill')}/>
      </ControlSection>
    </div>
  );
};

export default ControlPanel;
