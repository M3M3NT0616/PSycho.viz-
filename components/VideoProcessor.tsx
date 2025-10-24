import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { EffectSettings, VideoSource, AudioAnalysisData } from '../types';
import { VideoSourceType } from '../types';
import { vertexShader, fragmentShader } from '../shaders/effectShaders';

interface VideoProcessorProps {
  source: VideoSource;
  settings: EffectSettings;
  audioData: AudioAnalysisData;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ source, settings, audioData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const feedbackTargetA = useRef<THREE.WebGLRenderTarget | null>(null);
  const feedbackTargetB = useRef<THREE.WebGLRenderTarget | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

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
    ...Object.fromEntries(Object.entries(settings).map(([key, value]) => [`u${key.charAt(0).toUpperCase() + key.slice(1)}`, { value }]))
  }), []);

  // Update uniforms without recreating the object
  useEffect(() => {
    if (!materialRef.current) return;
    
    for (const key in settings) {
      const uniformName = `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (uniforms[uniformName]) {
        uniforms[uniformName].value = settings[key as keyof EffectSettings];
      }
    }
    
    // Update audio uniforms
    uniforms.uBass.value = audioData.bass;
    uniforms.uMids.value = audioData.mids;
    uniforms.uTreble.value = audioData.treble;

  }, [settings, audioData, uniforms]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (source.type === VideoSourceType.NONE) {
      video.srcObject = null;
      video.src = '';
      return;
    }

    let stream: MediaStream | null = null;
    if (source.type === VideoSourceType.WEBCAM && source.data instanceof MediaStream) {
      video.srcObject = source.data;
      stream = source.data;
      video.src = '';
    } else if (source.type === VideoSourceType.FILE && typeof source.data === 'string') {
      video.srcObject = null;
      video.src = source.data;
    }

    video.play().catch(e => console.error("Video play failed:", e));

    return () => {
      if (typeof source.data === 'string' && source.data.startsWith('blob:')) {
        URL.revokeObjectURL(source.data);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [source]);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode || !videoRef.current) return;

    // --- Renderer, Scene, Camera ---
    const renderer = new THREE.WebGLRenderer();
    rendererRef.current = renderer;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;
    
    // --- Video Texture ---
    const videoTexture = new THREE.VideoTexture(videoRef.current);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTextureRef.current = videoTexture;

    // --- Shader Material ---
    uniforms.tDiffuse.value = videoTexture;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    materialRef.current = material;

    // --- Geometry ---
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    mountNode.appendChild(renderer.domElement);
    
    // --- Resize Handling ---
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

      // --- Feedback Buffers ---
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
    
    // --- Render Loop ---
    let animationFrameId: number;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if(materialRef.current) materialRef.current.uniforms.uTime.value = time * 0.001;
      
      if (settings.feedback && feedbackTargetA.current && feedbackTargetB.current && videoTextureRef.current) {
        materialRef.current!.uniforms.tDiffuse.value = videoTextureRef.current;
        materialRef.current!.uniforms.tFeedback.value = feedbackTargetA.current.texture;
        renderer.setRenderTarget(feedbackTargetB.current);
        renderer.render(scene, camera);

        // Ping-pong
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
  }, [settings.fitMode, uniforms]); // Only re-init on fitMode change or initial setup

  return (
    <div className="w-full h-full relative" ref={mountRef}>
      <video ref={videoRef} className="hidden" loop muted playsInline crossOrigin="anonymous"></video>
      {source.type === VideoSourceType.NONE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/70 z-10">
          <h2 className="text-2xl font-bold text-purple-300 mb-2">Welcome to the Video Mangler</h2>
          <p className="text-gray-400">Select a source to begin distorting reality.</p>
          <p className="text-gray-500 mt-4 text-sm">Use the buttons in the top-right to start.</p>
        </div>
      )}
    </div>
  );
};

export default VideoProcessor;
