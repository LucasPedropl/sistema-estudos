"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface CustomVideoPlayerProps {
  src: string;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export function CustomVideoPlayer({ src, onEnded, className, autoPlay = true }: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // reset logic for new video src
    setIsPlaying(autoPlay);
    setProgress(0);
    setCurrentTime(0);

    if (autoPlay) {
      video.play().catch(console.error);
    }
  }, [src, autoPlay]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      const newTime = (value / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        videoRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not typing in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" || 
        document.activeElement?.tagName === "TEXTAREA"
      ) return;

      if (!videoRef.current) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
        handleMouseMove(); // show controls
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        handleMouseMove(); // show controls
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
        handleMouseMove();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative flex items-center justify-center bg-black overflow-hidden group w-full h-full rounded-inherit", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
           setIsPlaying(false);
           if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        playsInline
      />
      
      {/* Play indicator when paused, placed in the center */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
        >
          <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm text-white">
            <Play className="w-10 h-10 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300",
          !isPlaying || showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar Container */}
        <div className="flex items-center gap-4 mb-3 w-full">
           <input 
             type="range"
             min="0"
             max="100"
             step="0.1"
             value={progress || 0}
             onChange={handleSeek}
             className="w-full h-1.5 focus:outline-none appearance-none bg-slate-600/50 rounded-full cursor-pointer overflow-hidden accent-blue-500 hover:h-2 transition-all"
             style={{ 
               background: `linear-gradient(to right, #3b82f6 ${progress}%, rgba(100, 116, 139, 0.5) ${progress}%)` 
             }}
           />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-5">
            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors cursor-pointer">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume relative cursor-pointer">
              <button onClick={toggleMute} className="hover:text-blue-400 transition-colors w-5">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-in-out flex items-center h-full">
                 <input 
                   type="range"
                   min="0"
                   max="1"
                   step="0.05"
                   value={volume}
                   onChange={handleVolumeChange}
                   className="w-full h-1.5 appearance-none bg-slate-600/50 rounded-full cursor-pointer accent-white"
                   style={{ 
                     background: `linear-gradient(to right, white ${volume * 100}%, rgba(100, 116, 139, 0.5) ${volume * 100}%)` 
                   }}
                 />
              </div>
            </div>

            <span className="text-xs font-semibold tabular-nums opacity-90 tracking-wide text-slate-200 hidden sm:block">
              {formatTime(currentTime)} <span className="opacity-50 mx-1">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
             {/* Small screen time fallback */}
             <span className="text-xs font-semibold tabular-nums opacity-90 tracking-wide text-slate-200 block sm:hidden mr-2">
              {formatTime(currentTime)}
            </span>
            <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors cursor-pointer">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Webkit specific styles for slider thumb */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0px;
          height: 0px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }
        input[type='range']:hover::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
          background: currentColor;
        }
      `}} />
    </div>
  );
}
