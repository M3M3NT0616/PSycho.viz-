import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoSource, VideoSourceType } from '../types';

interface AILabProps {
  onClose: () => void;
  onApplyResult: (source: VideoSource) => void;
  getFrame: () => string | null;
}

type Tab = 'dream' | 'hallucinate' | 'oracle' | 'timewarp';

const AILab: React.FC<AILabProps> = ({ onClose, onApplyResult, getFrame }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dream');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'video' | 'text' | null>(null);
  
  // Image Generation State
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Video Generation State
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');

  const checkApiKey = async (): Promise<boolean> => {
    const win = window as any;
    if (!win.aistudio) return true; // Fallback for local dev without extension environment
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
      // Assume success after dialog closes or retry
      return true;
    }
    return true;
  };

  const getAI = async () => {
    await checkApiKey();
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  };

  const handleDream = async () => {
    if (!prompt) return;
    setLoading(true);
    setStatus('Synthesizing Reality from Void...');
    setResult(null);
    setResultType(null);

    try {
      const ai = await getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            const url = `data:image/png;base64,${base64}`;
            setResult(url);
            setResultType('image');
            foundImage = true;
            break;
          }
        }
      }
      if (!foundImage) throw new Error("No visual data received from the ether.");
      setStatus('Manifestation Complete.');
    } catch (e: any) {
      console.error(e);
      setStatus(`Generation Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHallucinate = async () => {
    if (!prompt) return;
    const frame = getFrame();
    if (!frame) {
      setStatus("Error: No visual feed to distort.");
      return;
    }

    setLoading(true);
    setStatus('Injecting Thoughts into Feed...');
    setResult(null);
    setResultType(null);

    try {
      const ai = await getAI();
      // Gemini 2.5 Flash Image for editing/generation
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: frame, mimeType: 'image/png' } },
            { text: prompt },
          ],
        },
      });

       let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            const url = `data:image/png;base64,${base64}`;
            setResult(url);
            setResultType('image');
            foundImage = true;
            break;
          }
        }
      }
      if (!foundImage) throw new Error("The machine refused to visualize.");
      setStatus('Reality Altered.');
    } catch (e: any) {
      console.error(e);
      setStatus(`Hallucination Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOracle = async () => {
    const frame = getFrame();
    if (!frame) {
      setStatus("Error: The eye is blind.");
      return;
    }
    setLoading(true);
    setStatus('Consulting the Machine Spirits...');
    setResult(null);
    setResultType(null);

    try {
      const ai = await getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
             { inlineData: { data: frame, mimeType: 'image/png' } },
             { text: "Analyze this image. Describe the colors, patterns, objects, and the overall 'vibe'. Is it trippy? Be descriptive and artistic." }
          ]
        },
      });

      const text = response.text || "The Oracle is silent.";
      setResult(text);
      setResultType('text');
      setStatus('Wisdom Received.');
    } catch (e: any) {
      console.error(e);
      setStatus(`Communion Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeWarp = async () => {
    setLoading(true);
    setStatus('Bending Spacetime (This may take a while)...');
    setResult(null);
    setResultType(null);

    try {
      const ai = await getAI();
      const frame = getFrame(); // Optional start frame

      let operation;
      
      // If we have a prompt and a frame, animate the frame.
      // If just prompt, text-to-video.
      
      if (frame && prompt) {
          // Image-to-Video
           operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: frame,
                mimeType: 'image/png'
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: videoAspectRatio as any,
            }
          });
      } else if (prompt) {
          // Text-to-Video
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: videoAspectRatio as any,
            }
          });
      } else {
          throw new Error("Prompt required to bend time.");
      }
      
      // Polling
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Provide visual feedback during long wait
          setStatus(prev => prev.includes('...') ? 'Weaving Timeline.' : prev + '.');
          operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch with key
        const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoRes.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        setResult(videoUrl);
        setResultType('video');
        setStatus('Timeline Converged.');
      } else {
        throw new Error("Video timeline collapsed.");
      }

    } catch (e: any) {
      console.error(e);
      setStatus(`Time Warp Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyToFeed = () => {
    if (!result) return;
    if (resultType === 'image' || resultType === 'video') {
        // If it's a blob URL (video) or data URL (image), source selector can handle string URLs for FILE type
        onApplyResult({ type: VideoSourceType.FILE, data: result });
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-gray-900/90 border border-fuchsia-500/50 rounded-2xl shadow-[0_0_50px_rgba(192,38,211,0.3)] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
             <h2 className="text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400">AI REALITY LAB</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
           {[
               { id: 'dream', label: 'DREAM', icon: '☁️' },
               { id: 'hallucinate', label: 'HALLUCINATE', icon: '👁️' },
               { id: 'oracle', label: 'ORACLE', icon: '🔮' },
               { id: 'timewarp', label: 'TIME WARP', icon: '⏳' }
           ].map(tab => (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-fuchsia-600/20 text-fuchsia-300 border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
               >
                   <span className="mr-2">{tab.icon}</span>{tab.label}
               </button>
           ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-4">
            
            {/* Controls */}
            <div className="space-y-4">
                {activeTab === 'dream' && (
                    <div className="text-center space-y-2">
                        <p className="text-cyan-400 text-xs uppercase tracking-widest">Generate images from pure thought</p>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Describe a new reality..."
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 h-24"
                        />
                         <div className="flex gap-2 justify-center">
                            {['1:1', '3:4', '4:3', '16:9', '9:16'].map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-2 py-1 text-[10px] border rounded ${aspectRatio === ratio ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-500'}`}>{ratio}</button>
                            ))}
                        </div>
                        <button 
                            onClick={handleDream} 
                            disabled={loading || !prompt}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Synthesizing...' : 'Generate Reality'}
                        </button>
                    </div>
                )}

                {activeTab === 'hallucinate' && (
                    <div className="text-center space-y-2">
                        <p className="text-fuchsia-400 text-xs uppercase tracking-widest">Edit the current visual feed</p>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="E.g., 'Make it look like a cyberpunk glitch', 'Add a retro filter'"
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-sm text-white focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 h-24"
                        />
                        <button 
                            onClick={handleHallucinate} 
                            disabled={loading || !prompt}
                            className="w-full py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg font-bold uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Distorting...' : 'Apply Hallucination'}
                        </button>
                    </div>
                )}

                {activeTab === 'oracle' && (
                    <div className="text-center space-y-4">
                        <p className="text-purple-400 text-xs uppercase tracking-widest">Ask the machine what it sees</p>
                        <div className="p-4 border border-white/10 rounded bg-black/30">
                            <p className="text-gray-400 text-sm italic">"The Oracle analyzes the current frame and describes the unseen patterns."</p>
                        </div>
                        <button 
                            onClick={handleOracle} 
                            disabled={loading}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-bold uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Communing...' : 'Consult Oracle'}
                        </button>
                    </div>
                )}

                {activeTab === 'timewarp' && (
                    <div className="text-center space-y-2">
                        <p className="text-yellow-400 text-xs uppercase tracking-widest">Generate or Animate Video (Veo)</p>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Describe the motion..."
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-sm text-white focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 h-24"
                        />
                        <div className="flex gap-2 justify-center">
                            {['16:9', '9:16'].map(ratio => (
                                <button key={ratio} onClick={() => setVideoAspectRatio(ratio)} className={`px-2 py-1 text-[10px] border rounded ${videoAspectRatio === ratio ? 'border-yellow-500 text-yellow-400 bg-yellow-900/20' : 'border-gray-700 text-gray-500'}`}>{ratio}</button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500">Note: Uses current frame as reference if available.</p>
                        <button 
                            onClick={handleTimeWarp} 
                            disabled={loading || !prompt}
                            className="w-full py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Warping Time...' : 'Generate Video'}
                        </button>
                    </div>
                )}
            </div>

            {/* Status & Results */}
            <div className="flex-grow flex flex-col items-center justify-center min-h-[200px] border border-dashed border-white/10 rounded-lg bg-black/20 relative">
                 {loading && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                         <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="text-fuchsia-300 font-mono text-xs animate-pulse">{status}</p>
                     </div>
                 )}
                 
                 {!result && !loading && (
                     <p className="text-gray-600 font-mono text-xs uppercase">{status || 'Awaiting Input...'}</p>
                 )}

                 {result && !loading && (
                     <div className="w-full h-full p-2 flex flex-col items-center">
                         {resultType === 'image' && <img src={result} alt="Result" className="max-h-[300px] object-contain rounded border border-white/20" />}
                         {resultType === 'video' && <video src={result} controls className="max-h-[300px] object-contain rounded border border-white/20" />}
                         {resultType === 'text' && (
                             <div className="w-full h-full p-4 overflow-y-auto bg-black/40 rounded border border-purple-500/30">
                                 <p className="font-mono text-sm text-purple-200 whitespace-pre-wrap leading-relaxed">{result}</p>
                             </div>
                         )}
                         
                         {(resultType === 'image' || resultType === 'video') && (
                             <button 
                                onClick={applyToFeed}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all"
                             >
                                 Load into Visual Feed
                             </button>
                         )}
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AILab;
