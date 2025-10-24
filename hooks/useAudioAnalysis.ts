import { useState, useEffect, useRef, useCallback } from 'react';
import type { AudioAnalysisData } from '../types';

const useAudioAnalysis = (sourceStream?: MediaStream, enabled: boolean = false) => {
  const [audioData, setAudioData] = useState<AudioAnalysisData>({ bass: 0, mids: 0, treble: 0 });
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    analyserRef.current = null;
    // Don't close the context, as it might be shared or reused
  }, []);

  const startAudio = useCallback(async () => {
    stopAudio();
    setError(null);

    try {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const context = audioContextRef.current;

      let stream = sourceStream;
      if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const source = context.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const processAudio = () => {
        analyser.getByteFrequencyData(dataArray);

        const bassEnd = Math.floor(bufferLength * 0.2); // ~0-250Hz
        const midsEnd = Math.floor(bufferLength * 0.6); // ~250-2000Hz
        
        let bass = 0, mids = 0, treble = 0;
        for (let i = 0; i < bassEnd; i++) bass += dataArray[i];
        for (let i = bassEnd; i < midsEnd; i++) mids += dataArray[i];
        for (let i = midsEnd; i < bufferLength; i++) treble += dataArray[i];

        setAudioData({
          bass: bass / bassEnd / 255,
          mids: mids / (midsEnd - bassEnd) / 255,
          treble: treble / (bufferLength - midsEnd) / 255,
        });

        animationFrameId.current = requestAnimationFrame(processAudio);
      };
      processAudio();

    } catch (err) {
      console.error("Audio analysis error:", err);
      setError("Could not access microphone. Please grant permission.");
      stopAudio();
    }
  }, [sourceStream, stopAudio]);


  useEffect(() => {
    if (enabled) {
      startAudio();
    } else {
      stopAudio();
      setAudioData({ bass: 0, mids: 0, treble: 0 });
    }
    
    return () => {
      stopAudio();
    };
  }, [enabled, sourceStream, startAudio, stopAudio]);

  return { audioData, error, analyserNode: analyserRef.current, startAudio, stopAudio };
};

export default useAudioAnalysis;
