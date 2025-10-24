import React, { useState, useCallback } from 'react';
import type { EffectSettings, VideoSource, AudioAnalysisData } from './types';
import { VideoSourceType } from './types';
import ControlPanel from './components/ControlPanel';
import VideoProcessor from './components/VideoProcessor';
import SourceSelector from './components/SourceSelector';
import Icon from './components/Icon';
import PresetManager, { createInitialPresets } from './components/PresetManager';
import useAudioAnalysis from './hooks/useAudioAnalysis';

const initialPresets = createInitialPresets();
const DEFAULT_SETTINGS = initialPresets[0].settings;

const App: React.FC = () => {
  const [videoSource, setVideoSource] = useState<VideoSource>({ type: VideoSourceType.NONE, data: null });
  const [effectSettings, setEffectSettings] = useState<EffectSettings>(DEFAULT_SETTINGS);
  
  const audioStream = videoSource.type === VideoSourceType.WEBCAM && videoSource.data instanceof MediaStream ? videoSource.data : undefined;
  const { audioData, error: audioError, analyserNode, startAudio, stopAudio } = useAudioAnalysis(audioStream, effectSettings.audioEnabled);

  const handleSettingsChange = useCallback((newSettings: Partial<EffectSettings>) => {
    setEffectSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const randomizeSettings = () => {
    const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
    const randomInt = (min: number, max: number) => Math.floor(randomFloat(min, max));
    const randomBool = (chance = 0.5) => Math.random() < chance;
  
    setEffectSettings(prev => ({
      ...prev,
      saturation: randomFloat(0, 2),
      brightness: randomFloat(0.5, 1.5),
      contrast: randomFloat(0.5, 1.5),
      grain: randomFloat(0, 0.3),
      colorAbyss: randomFloat(0, 1),
      rgbShift: randomFloat(0, 20),
      chromaticAberration: randomFloat(0, 5),
      fluidDistortion: randomFloat(0, 0.2),
      edgeDistortion: randomFloat(0, 0.2),
      crtCurvature: randomFloat(0, 0.1),
      kaleidoscope: randomBool(),
      kaleidoscopeSegments: randomInt(2, 12) * 2,
      feedback: randomBool(0.7),
      feedbackAmount: randomFloat(0.8, 0.98),
      feedbackZoom: randomFloat(-0.05, 0.05),
      feedbackRotation: randomFloat(-0.03, 0.03),
      feedbackEdgeFade: randomFloat(0.5, 2.0),
      lfoTarget: 'none',
    }));
  };
  
  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col font-sans">
      <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg p-4 flex items-center justify-between z-10 border-b border-purple-500/30 shrink-0">
        <div className="flex items-center space-x-3">
          <Icon />
          <h1 className="text-xl font-bold tracking-wider text-purple-300">Psychedelic Video Mangler</h1>
        </div>
        <SourceSelector onSourceSelect={setVideoSource} currentSourceType={videoSource.type}/>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="flex-grow flex items-center justify-center bg-black rounded-lg shadow-2xl shadow-purple-900/50 overflow-hidden border border-gray-700 relative">
          <VideoProcessor source={videoSource} settings={effectSettings} audioData={audioData} />
        </div>
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-4">
          <PresetManager onSelectPreset={setEffectSettings} currentSettings={effectSettings}/>
          <ControlPanel 
            settings={effectSettings} 
            onSettingsChange={handleSettingsChange}
            randomize={randomizeSettings}
            audioError={audioError}
            startAudio={startAudio}
            stopAudio={stopAudio}
          />
        </aside>
      </main>
    </div>
  );
};

export default App;
