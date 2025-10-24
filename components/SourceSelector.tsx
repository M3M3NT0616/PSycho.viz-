
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
    // Reset file input to allow selecting the same file again
    if (event.target) {
        event.target.value = '';
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const baseButtonClass = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200";
  const activeButtonClass = "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500";
  const inactiveButtonClass = "bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500";

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleWebcamClick}
        className={`${baseButtonClass} ${currentSourceType === VideoSourceType.WEBCAM ? activeButtonClass : inactiveButtonClass}`}
      >
        Use Webcam
      </button>
      <button
        onClick={handleUploadClick}
        className={`${baseButtonClass} ${currentSourceType === VideoSourceType.FILE ? activeButtonClass : inactiveButtonClass}`}
      >
        Upload Video
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
