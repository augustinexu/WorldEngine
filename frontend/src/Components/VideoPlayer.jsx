import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ url, segments }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(null);
  
  // Format time from seconds to MM:SS format
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update current time every 250ms when playing
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
      }, 250);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);
  
  // Find current segment based on video time
  useEffect(() => {
    if (!segments) return;
    
    const activeSegment = segments.find(seg => 
      currentTime >= seg.start_time && currentTime <= seg.end_time
    );
    
    if (activeSegment !== currentSegment) {
      setCurrentSegment(activeSegment);
    }
  }, [currentTime, segments, currentSegment]);
  
  // Handle video events
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };
  
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleSeek = (e) => {
    const seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={url}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          className="video-element"
        />
        
        {currentSegment && (
          <div className="current-segment-indicator">
            <span className="segment-label">Current activity:</span>
            <span className="segment-description">{currentSegment.description}</span>
          </div>
        )}
      </div>
      
      {segments && segments.length > 0 && (
        <div className="timeline-container">
          <div className="timeline" onClick={handleSeek}>
            <div className="timeline-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
            
            {segments.map((segment, index) => (
              <div 
                key={index}
                className={`segment-marker ${currentSegment === segment ? 'active' : ''}`}
                style={{
                  left: `${(segment.start_time / duration) * 100}%`,
                  width: `${((segment.end_time - segment.start_time) / duration) * 100}%`
                }}
                title={segment.description}
                onClick={(e) => {
                  e.stopPropagation();
                  videoRef.current.currentTime = segment.start_time;
                }}
              />
            ))}
          </div>
          
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;