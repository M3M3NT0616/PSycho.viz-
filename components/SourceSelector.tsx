import React, { useRef } from 'react';
import type { VideoSource } from '../types';
import { VideoSourceType } from '../types';

interface SourceSelectorProps {
  onSourceSelect: (source: VideoSource) => void;
  currentSourceType: VideoSourceType;
}

const SourceSelector: React.FC<SourceSelectorProps> = ({ onSourceSelect, currentSourceType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWebcamClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      onSourceSelect({ type: VideoSourceType.WEBCAM, data: stream });
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam. Please ensure permissions are granted.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onSourceSelect({ type: VideoSourceType.FILE, data: url });
    }
    if (event.target) {
        event.target.value = '';
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const baseButtonClass = "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 border relative overflow-hidden group";
  const activeButtonClass = "bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]";
  const inactiveButtonClass = "bg-gray-900/50 text-gray-400 border-gray-700 hover:border-cyan-700 hover:text-cyan-200";

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleWebcamClick}
        className={`${baseButtonClass} ${currentSourceType === VideoSourceType.WEBCAM ? activeButtonClass : inactiveButtonClass}`}
      >
        <span className="relative z-10">Live Feed</span>
        {currentSourceType === VideoSourceType.WEBCAM && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>}
      </button>
      <button
        onClick={handleUploadClick}
        className={`${baseButtonClass} ${currentSourceType === VideoSourceType.FILE ? activeButtonClass : inactiveButtonClass}`}
      >
        <span className="relative z-10">Upload</span>
        {currentSourceType === VideoSourceType.FILE && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </div>
  );
};

export default SourceSelector;