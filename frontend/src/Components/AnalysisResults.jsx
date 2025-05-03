import React from 'react';
import './AnalysisResults.css';

const AnalysisResults = ({ results, onSegmentClick }) => {
  // Format time from seconds to MM:SS format
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format time range
  const formatTimeRange = (start, end) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };
  
  return (
    <div className="analysis-results">
      <h2>Video Analysis Results</h2>
      
      {results && results.length > 0 ? (
        <div className="segments-list">
          {results.map((segment, index) => (
            <div 
              key={index} 
              className="segment-item"
              onClick={() => onSegmentClick(segment.start_time)}
            >
              <div className="segment-time">
                {formatTimeRange(segment.start_time, segment.end_time)}
              </div>
              <div className="segment-description">
                {segment.description}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-results">No segments detected in the video.</p>
      )}
      
      <div className="export-options">
        <button 
          onClick={() => {
            if (!results || !results.length) return;
            
            // Format the results as text
            const textContent = results.map(segment => 
              `${formatTimeRange(segment.start_time, segment.end_time)}: ${segment.description}`
            ).join('\n');
            
            // Create a blob and download link
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'video-analysis-results.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="export-button"
          disabled={!results || !results.length}
        >
          Export Results
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults;