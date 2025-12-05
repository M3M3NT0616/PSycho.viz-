import React, { useRef, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import type { EffectSettings, VideoSource, AudioAnalysisData } from '../types';
import { VideoSourceType } from '../types';
import { vertexShader, fragmentShader } from '../shaders/effectShaders';

interface VideoProcessorProps {
  source: VideoSource;
  settings: EffectSettings;
  audioData: AudioAnalysisData;
}

export interface VideoProcessorHandle {
    startRecording: () => void;
    stopRecording: () => void;
    isRecording: boolean;
}

const VideoProcessor = forwardRef<VideoProcessorHandle, VideoProcessorProps>(({ source, settings, audioData }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const feedbackTargetA = useRef<THREE.WebGLRenderTarget | null>(null);
  const feedbackTargetB = useRef<THREE.WebGLRenderTarget | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uniforms = useMemo(() => ({
    tDiffuse: { value: null },
    tFeedback: { value: null },
    uResolution: { value: new THREE.Vector2() },
    uTime: { value: 0.0 },
    // Audio
    uBass: { value: 0.0 },
    uMids: { value: 0.0 },
    uTreble: { value: 0.0 },
    // Settings
    uSaturation: { value: 1.0 }, uBrightness: { value: 1.0 }, uContrast: { value: 1.0 },
    uGrain: { value: 0.0 }, uColorAbyss: { value: 0.0 }, uRgbShift: { value: 0.0 },
    uChromaticAberration: { value: 0.0 }, uFluidDistortion: { value: 0.0 },
    uEdgeDistortion: { value: 0.0 }, uCrtCurvature: { value: 0.0 },
    uKaleidoscope: { value: false }, uKaleidoscopeSegments: { value: 8 },
    uFeedback: { value: false }, uFeedbackAmount: { value: 0.0 },
    uFeedbackZoom: { value: 0.0 }, uFeedbackRotation: { value: 0.0 }, uFeedbackEdgeFade: { value: 0.0 },
    uScanlines: { value: false }, uVignette: { value: false },
    uHueRotate: { value: 0.0 }, uInvert: { value: false }, uPixelation: { value: 0.0 },
    uGlitchStrength: { value: 0.0 }, uHalftone: { value: 0.0 }, uSobelStrength: { value: 0.0 },
    uLfoTarget: { value: 0 }, uLfoWaveform: { value: 0 }, uLfoSpeed: { value: 0 }, uLfoAmount: { value: 0 },
    uAudioGain: { value: 1.0 }, uBassTarget: { value: 0 }, uMidsTarget: { value: 0 }, uTrebleTarget: { value: 0 }
  }), []);

  useImperativeHandle(ref, () => ({
    isRecording,
    startRecording: () => {
        if (!rendererRef.current) return;
        const canvas = rendererRef.current.domElement;
        const stream = canvas.captureStream(60);
        
        if (source.type === VideoSourceType.WEBCAM && source.data instanceof MediaStream) {
             const audioTracks = source.data.getAudioTracks();
             if (audioTracks.length > 0) {
                 stream.addTrack(audioTracks[0]);
             }
        }

        const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9") ? "video/webm; codecs=vp9" : "video/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `juans-vision-${new Date().getTime()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            setIsRecording(false);
        };
        
        mediaRecorder.start();
        setIsRecording(true);
    },
    stopRecording: () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }
  }));

  useEffect(() => {
    if (!materialRef.current) return;
    
    const lfoTargetMap: Record<string, number> = {
        'none': 0, 'rgbShift': 1, 'feedbackZoom': 2, 'feedbackRotation': 3, 
        'fluidDistortion': 4, 'edgeDistortion': 5, 'colorAbyss': 6, 
        'hueRotate': 7, 'glitchStrength': 8, 'pixelation': 9
    };
    
    const audioTargetMap: Record<string, number> = {
        'none': 0, 'rgbShift': 1, 'feedbackZoom': 2, 'fluidDistortion': 3, 
        'edgeDistortion': 4, 'chromaticAberration': 5, 'glitchStrength': 6,
        'pixelation': 7, 'hueRotate': 8, 'sobelStrength': 9 
    };
    
    const waveformMap: Record<string, number> = { 'sine': 0, 'triangle': 1, 'square': 2, 'sawtooth': 3 };

    for (const key in settings) {
      const uniformName = `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const k = key as keyof EffectSettings;
      
      if (key === 'lfoTarget') uniforms.uLfoTarget.value = lfoTargetMap[settings.lfoTarget];
      else if (key === 'bassTarget') uniforms.uBassTarget.value = audioTargetMap[settings.bassTarget];
      else if (key === 'midsTarget') uniforms.uMidsTarget.value = audioTargetMap[settings.midsTarget];
      else if (key === 'trebleTarget') uniforms.uTrebleTarget.value = audioTargetMap[settings.trebleTarget];
      else if (key === 'lfoWaveform') uniforms.uLfoWaveform.value = waveformMap[settings.lfoWaveform];
      else if (uniforms[uniformName as keyof typeof uniforms]) {
        // @ts-ignore
        uniforms[uniformName].value = settings[k];
      }
    }
    
    uniforms.uBass.value = audioData.bass;
    uniforms.uMids.value = audioData.mids;
    uniforms.uTreble.value = audioData.treble;

  }, [settings, audioData, uniforms]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    if (source.type === VideoSourceType.NONE) {
      video.srcObject = null;
      video.src = '';
      return;
    }

    const handleError = () => {
      setError("SIGNAL LOST");
    };
    video.addEventListener('error', handleError);

    let stream: MediaStream | null = null;
    if (source.type === VideoSourceType.WEBCAM && source.data instanceof MediaStream) {
      video.srcObject = source.data;
      stream = source.data;
      video.src = '';
    } else if (source.type === VideoSourceType.FILE && typeof source.data === 'string') {
      video.srcObject = null;
      video.src = source.data;
    }

    video.play().catch(e => {
      console.error("Video play failed:", e);
      setError(`PLAYBACK ERROR: ${e.message || 'UNKNOWN'}`);
    });

    return () => {
      video.removeEventListener('error', handleError);
      if (typeof source.data === 'string' && source.data.startsWith('blob:')) {
        URL.revokeObjectURL(source.data);
      }
    };
  }, [source]);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode || !videoRef.current) return;

    const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, alpha: false });
    rendererRef.current = renderer;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;
    
    const videoTexture = new THREE.VideoTexture(videoRef.current);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTextureRef.current = videoTexture;

    uniforms.tDiffuse.value = videoTexture;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    mountNode.appendChild(renderer.domElement);
    
    const handleResize = () => {
      const { clientWidth, clientHeight } = mountNode;
      renderer.setSize(clientWidth, clientHeight);
      
      if(materialRef.current) materialRef.current.uniforms.uResolution.value.set(clientWidth, clientHeight);
      
      const videoAspect = videoRef.current!.videoWidth / videoRef.current!.videoHeight;
      const screenAspect = clientWidth / clientHeight;

      if(videoAspect && !isNaN(videoAspect)) {
        mesh.scale.set(1,1,1);
        if (settings.fitMode === 'cover') {
            if (screenAspect > videoAspect) mesh.scale.set(screenAspect / videoAspect, 1, 1);
            else mesh.scale.set(1, videoAspect / screenAspect, 1);
        } else if (settings.fitMode === 'contain') {
            if (screenAspect > videoAspect) mesh.scale.set(1, videoAspect / screenAspect, 1);
            else mesh.scale.set(screenAspect / videoAspect, 1, 1);
        }
      }

      if (feedbackTargetA.current?.width !== clientWidth || feedbackTargetA.current?.height !== clientHeight) {
          feedbackTargetA.current?.dispose();
          feedbackTargetB.current?.dispose();
          feedbackTargetA.current = new THREE.WebGLRenderTarget(clientWidth, clientHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
          feedbackTargetB.current = new THREE.WebGLRenderTarget(clientWidth, clientHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
      }
    };
    
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountNode);
    
    let animationFrameId: number;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if(materialRef.current) materialRef.current.uniforms.uTime.value = time * 0.001;
      
      if (settings.feedback && feedbackTargetA.current && feedbackTargetB.current && videoTextureRef.current) {
        materialRef.current!.uniforms.tDiffuse.value = videoTextureRef.current;
        materialRef.current!.uniforms.tFeedback.value = feedbackTargetA.current.texture;
        renderer.setRenderTarget(feedbackTargetB.current);
        renderer.render(scene, camera);

        const temp = feedbackTargetA.current;
        feedbackTargetA.current = feedbackTargetB.current;
        feedbackTargetB.current = temp;
      }

      materialRef.current!.uniforms.tFeedback.value = feedbackTargetA.current?.texture ?? null;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mountNode.removeChild(renderer.domElement);
      renderer.dispose();
      feedbackTargetA.current?.dispose();
      feedbackTargetB.current?.dispose();
    };
  }, [settings.fitMode, uniforms]);

  return (
    <div className="w-full h-full relative group" ref={mountRef}>
      <video ref={videoRef} className="hidden" loop muted playsInline crossOrigin="anonymous"></video>
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 z-20 group-hover:border-fuchsia-500/20 transition-colors duration-500"></div>
      
      {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600/80 backdrop-blur-sm text-white px-4 py-1.5 rounded-full z-30 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-xs font-bold uppercase tracking-widest">Recording</span>
          </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/95 z-20">
             <h2 className="text-4xl font-bold text-red-500 mb-2 glitch-text" data-text="SYSTEM FAILURE">SYSTEM FAILURE</h2>
             <p className="text-red-400/80 font-mono uppercase tracking-widest text-sm">{error}</p>
        </div>
      )}

      {source.type === VideoSourceType.NONE && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/40 backdrop-blur-sm z-10">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-cyan-400 mb-4 glitch-text" data-text="INITIATE FEED">INITIATE FEED</h2>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em]">Select source to begin transmission</p>
        </div>
      )}
    </div>
  );
});

export default VideoProcessor;