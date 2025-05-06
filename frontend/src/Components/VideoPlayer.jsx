import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ url, segments }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Format time from seconds to MM:SS format
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update current time when playing
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
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Video event handlers
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
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    videoRef.current.muted = newMuteState;
  };
  
  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const videoContainer = document.querySelector('.video-player-container');
      
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  const captureScreenshot = () => {
    // Only proceed if video is loaded
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      alert('Video must be loaded to take a screenshot.');
      return;
    }
    
    // Create a canvas with the video dimensions
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Draw the current frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL and trigger download
    try {
      const dataURL = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `robot-frame-${formatTime(currentTime).replace(':', '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error creating screenshot:', e);
      alert('Failed to capture screenshot. The video may be from a different domain.');
    }
  };
  
  const jumpToSegment = (startTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      
      // Auto-play when jumping to a segment
      videoRef.current.play().catch(e => console.error('Error auto-playing video:', e));
    }
  };
  
  // Play/pause toggle
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error('Error playing video:', e));
      }
    }
  };
  
  // Jump forward/backward buttons
  const jumpTime = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  return (
    <div className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={url}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          className="video-element"
        />
        
        <div className="video-overlay" onClick={togglePlayPause}>
          {!isPlaying && (
            <button className="big-play-button">
              <span className="material-icons">play_arrow</span>
            </button>
          )}
        </div>
        
        {currentSegment && (
          <div className="current-segment-indicator">
            <span className="segment-label">Current activity:</span>
            <span className="segment-description">{currentSegment.description}</span>
          </div>
        )}
      </div>
      
      <div className="controls-container">
        <div className="timeline-container">
          <div className="timeline" onClick={handleSeek}>
            <div className="timeline-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
            
            {segments && segments.length > 0 && segments.map((segment, index) => (
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
                  jumpToSegment(segment.start_time);
                }}
              />
            ))}
          </div>
          
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="controls-panel">
          <div className="left-controls">
            <button className="control-button" onClick={() => jumpTime(-10)}>
              <span className="material-icons">replay_10</span>
            </button>
            
            <button className="control-button play-pause" onClick={togglePlayPause}>
              <span className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            
            <button className="control-button" onClick={() => jumpTime(10)}>
              <span className="material-icons">forward_10</span>
            </button>
          </div>
          
          <div className="center-controls">
            {segments && segments.length > 0 && (
              <div className="segment-selector">
                <select
                  onChange={(e) => jumpToSegment(parseFloat(e.target.value))}
                  value={currentSegment ? currentSegment.start_time : ''}
                >
                  <option value="" disabled>Jump to segment</option>
                  {segments.map((segment, index) => (
                    <option key={index} value={segment.start_time}>
                      {formatTime(segment.start_time)} - {segment.description.substring(0, 30)}
                      {segment.description.length > 30 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="right-controls">
            <div className="volume-control">
              <button className="control-button" onClick={toggleMute}>
                <span className="material-icons">
                  {isMuted ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
                </span>
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
            
            <div className="playback-control">
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="playback-selector"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
            
            <button className="control-button" onClick={captureScreenshot} title="Take Screenshot">
              <span className="material-icons">photo_camera</span>
            </button>
            
            <button className="control-button" onClick={toggleFullscreen} title="Toggle Fullscreen">
              <span className="material-icons">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;