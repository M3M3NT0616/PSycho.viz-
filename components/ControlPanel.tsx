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
  <div className="space-y-1 group">
    <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-widest text-cyan-400 group-hover:text-cyan-300 transition-colors">{label}</label>
        <span className="text-[10px] font-mono bg-gray-900/80 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/30 min-w-[3rem] text-center">{value.toFixed(2)}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0"
    />
  </div>
);

const Toggle: React.FC<{label: string; checked: boolean; onChange: (checked: boolean) => void;}> = ({ label, checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer group py-1">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-fuchsia-600 peer-checked:to-purple-600 peer-checked:after:bg-white"></div>
        <span className="ml-3 text-xs font-bold uppercase tracking-widest text-gray-400 peer-checked:text-fuchsia-300 transition-colors group-hover:text-gray-200">{label}</span>
    </label>
);

const ButtonGroup: React.FC<{ label: string; options: string[]; value: string; onChange: (value: string) => void; }> = ({ label, options, value, onChange }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-purple-400">{label}</label>
      <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded focus:outline-none transition-all duration-200 ${
              value === option
                ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(192,38,211,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

const Select: React.FC<{ label: string; options: {value: string; label: string}[]; value: string; onChange: (value: string) => void; }> = ({ label, options, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-widest text-cyan-400">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 appearance-none"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);

const ControlSection: React.FC<{title: string; children: React.ReactNode; isOpen?: boolean}> = ({ title, children, isOpen=false }) => (
    <details className="group bg-black/20 backdrop-blur-sm rounded border border-white/5 overflow-hidden transition-all duration-300" open={isOpen}>
        <summary className="px-4 py-3 cursor-pointer list-none flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="text-sm font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 shadow-sm">{title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </summary>
        <div className="p-4 space-y-4 border-t border-white/5">
            {children}
        </div>
    </details>
);

const lfoTargetOptions: {value: EffectSettings['lfoTarget'], label: string}[] = [
    { value: 'none', label: 'None' }, { value: 'rgbShift', label: 'RGB Shift' }, { value: 'feedbackZoom', label: 'Feedback Zoom' },
    { value: 'feedbackRotation', label: 'Feedback Rot' }, { value: 'fluidDistortion', label: 'Fluid Dist' },
    { value: 'edgeDistortion', label: 'Edge Dist' }, { value: 'colorAbyss', label: 'Color Abyss' },
    { value: 'hueRotate', label: 'Hue Rotate' }, { value: 'glitchStrength', label: 'Glitch' },
    { value: 'pixelation', label: 'Pixelation' }
];

const audioTargetOptions: {value: EffectSettings['bassTarget'], label: string}[] = [
    { value: 'none', label: 'None' }, { value: 'rgbShift', label: 'RGB Shift' }, { value: 'feedbackZoom', label: 'Fbk Zoom' },
    { value: 'fluidDistortion', label: 'Fluid Dist' }, { value: 'edgeDistortion', label: 'Edge Dist' },
    { value: 'chromaticAberration', label: 'Chrom Ab' }, { value: 'glitchStrength', label: 'Glitch' },
    { value: 'pixelation', label: 'Pixelation' }, { value: 'hueRotate', label: 'Hue' }, { value: 'sobelStrength', label: 'Sobel' }
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
    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="sticky top-0 bg-black/80 backdrop-blur-xl z-10 p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300">Effect Control</h2>
        <button onClick={randomize} className="group relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full overflow-hidden bg-transparent border border-fuchsia-500 text-fuchsia-400 hover:text-white transition-colors duration-300">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                Randomize
            </span>
        </button>
      </div>

      <div className="p-4 space-y-3">
        <ControlSection title="Colors & Vibes" isOpen>
            <Slider label="Hue Shift" value={settings.hueRotate} min={0} max={1} step={0.01} onChange={v => handleChange('hueRotate', v)} />
            <Slider label="Color Abyss" value={settings.colorAbyss} min={0} max={1} step={0.01} onChange={v => handleChange('colorAbyss', v)} />
            <Slider label="Saturation" value={settings.saturation} min={0} max={3} step={0.01} onChange={v => handleChange('saturation', v)} />
            <Slider label="Contrast" value={settings.contrast} min={0} max={3} step={0.01} onChange={v => handleChange('contrast', v)} />
            <Slider label="Brightness" value={settings.brightness} min={0} max={2} step={0.01} onChange={v => handleChange('brightness', v)} />
            <div className="pt-2 border-t border-gray-800">
                 <Toggle label="Invert Reality" checked={settings.invert} onChange={v => handleChange('invert', v)} />
            </div>
        </ControlSection>
        
        <ControlSection title="Glitch & Digital">
            <Slider label="Glitch Strength" value={settings.glitchStrength} min={0} max={1} step={0.01} onChange={v => handleChange('glitchStrength', v)} />
            <Slider label="Pixelation" value={settings.pixelation} min={0} max={40} step={0.5} onChange={v => handleChange('pixelation', v)} />
            <Slider label="Halftone Dots" value={settings.halftone} min={0} max={1} step={0.01} onChange={v => handleChange('halftone', v)} />
            <Slider label="CRT Curvature" value={settings.crtCurvature} min={0} max={0.2} step={0.001} onChange={v => handleChange('crtCurvature', v)} />
            <div className="flex flex-col space-y-1 pt-2 border-t border-gray-800">
                <Toggle label="Scanlines" checked={settings.scanlines} onChange={v => handleChange('scanlines', v)} />
                <Toggle label="Vignette" checked={settings.vignette} onChange={v => handleChange('vignette', v)} />
            </div>
        </ControlSection>

        <ControlSection title="Geometry Warp">
            <Slider label="RGB Shift" value={settings.rgbShift} min={0} max={50} step={1} onChange={v => handleChange('rgbShift', v)} />
            <Slider label="Fluid Distortion" value={settings.fluidDistortion} min={0} max={0.3} step={0.001} onChange={v => handleChange('fluidDistortion', v)} />
            <Slider label="Edge Distortion" value={settings.edgeDistortion} min={0} max={0.5} step={0.001} onChange={v => handleChange('edgeDistortion', v)} />
            <Slider label="Neon Edges (Sobel)" value={settings.sobelStrength} min={0} max={1} step={0.01} onChange={v => handleChange('sobelStrength', v)} />
            <Slider label="Chrom. Aberration" value={settings.chromaticAberration} min={0} max={20} step={0.1} onChange={v => handleChange('chromaticAberration', v)} />
            
            <div className="pt-2 border-t border-gray-800 mt-2">
                <Toggle label="Kaleidoscope" checked={settings.kaleidoscope} onChange={v => handleChange('kaleidoscope', v)} />
                {settings.kaleidoscope && <div className="mt-2 pl-4 border-l-2 border-fuchsia-500/30"><Slider label="Segments" value={settings.kaleidoscopeSegments} min={2} max={40} step={2} onChange={v => handleChange('kaleidoscopeSegments', v)} /></div>}
            </div>
        </ControlSection>

        <ControlSection title="Feedback Loop">
            <Toggle label="Enable Loop" checked={settings.feedback} onChange={v => handleChange('feedback', v)} />
            {settings.feedback && (
                <div className="space-y-3 mt-2 pl-4 border-l-2 border-cyan-500/30 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Slider label="Decay" value={settings.feedbackAmount} min={0.5} max={0.99} step={0.001} onChange={v => handleChange('feedbackAmount', v)} />
                    <Slider label="Zoom Tunnel" value={settings.feedbackZoom} min={-0.1} max={0.1} step={0.001} onChange={v => handleChange('feedbackZoom', v)} />
                    <Slider label="Rotation" value={settings.feedbackRotation} min={-0.1} max={0.1} step={0.001} onChange={v => handleChange('feedbackRotation', v)} />
                    <Slider label="Edge Fade" value={settings.feedbackEdgeFade} min={0} max={5} step={0.1} onChange={v => handleChange('feedbackEdgeFade', v)} />
                </div>
            )}
        </ControlSection>

        <ControlSection title="LFO Modulation">
            <Select label="Target" options={lfoTargetOptions} value={settings.lfoTarget} onChange={v => handleChange('lfoTarget', v as EffectSettings['lfoTarget'])} />
            {settings.lfoTarget !== 'none' && (
                <div className="space-y-3 mt-2 animate-in fade-in slide-in-from-top-2">
                    <ButtonGroup label="Waveform" options={['sine', 'triangle', 'square', 'sawtooth']} value={settings.lfoWaveform} onChange={v => handleChange('lfoWaveform', v as EffectSettings['lfoWaveform'])} />
                    <Slider label="Speed" value={settings.lfoSpeed} min={0} max={2} step={0.01} onChange={v => handleChange('lfoSpeed', v)} />
                    <Slider label="Depth" value={settings.lfoAmount} min={0} max={1} step={0.01} onChange={v => handleChange('lfoAmount', v)} />
                </div>
            )}
        </ControlSection>
        
        <ControlSection title="Audio Reactor">
            <Toggle label="Microphone Input" checked={settings.audioEnabled} onChange={handleAudioToggle} />
            {audioError && <p className="text-[10px] text-red-400 bg-red-900/20 p-1 rounded">{audioError}</p>}
            {settings.audioEnabled && (
                 <div className="space-y-3 mt-2 animate-in fade-in slide-in-from-top-2">
                    <Slider label="Input Gain" value={settings.audioGain} min={0} max={5} step={0.1} onChange={v => handleChange('audioGain', v)} />
                    <Select label="Bass Controls" options={audioTargetOptions} value={settings.bassTarget} onChange={v => handleChange('bassTarget', v as EffectSettings['bassTarget'])} />
                    <Select label="Mids Controls" options={audioTargetOptions} value={settings.midsTarget} onChange={v => handleChange('midsTarget', v as EffectSettings['midsTarget'])} />
                    <Select label="Treble Controls" options={audioTargetOptions} value={settings.trebleTarget} onChange={v => handleChange('trebleTarget', v as EffectSettings['trebleTarget'])} />
                </div>
            )}
        </ControlSection>
        
        <ControlSection title="Canvas Settings">
            <ButtonGroup label="Fit Mode" options={['contain', 'cover', 'fill']} value={settings.fitMode} onChange={v => handleChange('fitMode', v as 'contain'|'cover'|'fill')}/>
        </ControlSection>
      </div>
    </div>
  );
};

export default ControlPanel;