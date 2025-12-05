import React, { useState, useCallback, useRef } from 'react';
import type { EffectSettings, VideoSource, AudioAnalysisData } from './types';
import { VideoSourceType } from './types';
import ControlPanel from './components/ControlPanel';
import VideoProcessor, { VideoProcessorHandle } from './components/VideoProcessor';
import SourceSelector from './components/SourceSelector';
import Icon from './components/Icon';
import PresetManager, { createInitialPresets } from './components/PresetManager';
import useAudioAnalysis from './hooks/useAudioAnalysis';

const initialPresets = createInitialPresets();
const DEFAULT_SETTINGS = initialPresets[0].settings;

const App: React.FC = () => {
  const [videoSource, setVideoSource] = useState<VideoSource>({ type: VideoSourceType.NONE, data: null });
  const [effectSettings, setEffectSettings] = useState<EffectSettings>(DEFAULT_SETTINGS);
  const videoProcessorRef = useRef<VideoProcessorHandle>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const audioStream = videoSource.type === VideoSourceType.WEBCAM && videoSource.data instanceof MediaStream ? videoSource.data : undefined;
  const { audioData, error: audioError, analyserNode, startAudio, stopAudio } = useAudioAnalysis(audioStream, effectSettings.audioEnabled);

  const handleSettingsChange = useCallback((newSettings: Partial<EffectSettings>) => {
    setEffectSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleRecordingToggle = () => {
      if (videoProcessorRef.current) {
          if (isRecording) {
              videoProcessorRef.current.stopRecording();
              setIsRecording(false);
          } else {
              videoProcessorRef.current.startRecording();
              setIsRecording(true);
          }
      }
  };

  const randomizeSettings = () => {
    const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
    const randomInt = (min: number, max: number) => Math.floor(randomFloat(min, max));
    const randomBool = (chance = 0.5) => Math.random() < chance;
  
    setEffectSettings(prev => ({
      ...prev,
      saturation: randomFloat(0, 3),
      brightness: randomFloat(0.5, 1.5),
      contrast: randomFloat(0.5, 2.0),
      hueRotate: randomFloat(0, 1),
      invert: randomBool(0.1),
      grain: randomFloat(0, 0.5),
      colorAbyss: randomFloat(0, 1),
      
      pixelation: randomBool(0.3) ? randomFloat(0, 40) : 0,
      glitchStrength: randomBool(0.4) ? randomFloat(0, 1.0) : 0,
      halftone: randomBool(0.2) ? randomFloat(0, 1) : 0,
      sobelStrength: randomBool(0.3) ? randomFloat(0, 1) : 0,

      rgbShift: randomFloat(0, 30),
      chromaticAberration: randomFloat(0, 10),
      fluidDistortion: randomFloat(0, 0.3),
      edgeDistortion: randomFloat(0, 0.3),
      crtCurvature: randomFloat(0, 0.15),
      
      kaleidoscope: randomBool(0.4),
      kaleidoscopeSegments: randomInt(2, 12) * 2,
      
      feedback: randomBool(0.7),
      feedbackAmount: randomFloat(0.8, 0.99),
      feedbackZoom: randomFloat(-0.05, 0.05),
      feedbackRotation: randomFloat(-0.05, 0.05),
      feedbackEdgeFade: randomFloat(0.5, 2.0),
      lfoTarget: 'none',
    }));
  };
  
  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black animate-gradient-x">
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,27,0)_2px,transparent_2px),linear-gradient(90deg,rgba(18,16,27,0)_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>

      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <div className="flex items-center space-x-3 group cursor-default">
          <Icon />
          <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-500 group-hover:animate-pulse hidden sm:block">
            JUANS<span className="font-light opacity-80">VISION</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
            <button
                onClick={handleRecordingToggle}
                className={`flex items-center space-x-2 px-5 py-2 rounded-full font-bold tracking-wider transition-all duration-300 ${isRecording ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)] border border-red-400' : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
            >
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                <span>{isRecording ? 'REC' : 'REC'}</span>
            </button>
            <SourceSelector onSourceSelect={setVideoSource} currentSourceType={videoSource.type}/>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-6 gap-6 overflow-hidden h-[calc(100vh-80px)] z-10">
        <div className="flex-grow flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm overflow-hidden border border-white/10 shadow-2xl relative group">
           {/* Subtle glowing corners for the frame */}
           <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-2xl pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-fuchsia-500/30 rounded-tr-2xl pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-purple-500/30 rounded-bl-2xl pointer-events-none"></div>
           <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-pink-500/30 rounded-br-2xl pointer-events-none"></div>

          <VideoProcessor 
            ref={videoProcessorRef} 
            source={videoSource} 
            settings={effectSettings} 
            audioData={audioData} 
          />
        </div>
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-4 overflow-hidden h-full">
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