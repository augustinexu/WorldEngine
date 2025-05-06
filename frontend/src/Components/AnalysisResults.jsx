import React, { useState, useEffect } from 'react';
import './AnalysisResults.css';

const AnalysisResults = ({ results, onSegmentClick }) => {
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('time'); // 'time' or 'duration'
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  
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
  
  // Calculate segment duration
  const getSegmentDuration = (start, end) => {
    return end - start;
  };
  
  // Format duration as seconds
  const formatDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Apply filtering and sorting whenever results, searchTerm, or sortOrder changes
  useEffect(() => {
    if (!results) {
      setFilteredResults([]);
      return;
    }
    
    // Clone the results array
    let filtered = [...results];
    
    // Apply search filter if there's a search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(segment => 
        segment.description.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (sortOrder === 'time') {
      filtered.sort((a, b) => a.start_time - b.start_time);
    } else if (sortOrder === 'duration') {
      filtered.sort((a, b) => {
        const durationA = getSegmentDuration(a.start_time, a.end_time);
        const durationB = getSegmentDuration(b.start_time, b.end_time);
        return durationB - durationA; // Descending order for duration
      });
    }
    
    setFilteredResults(filtered);
  }, [results, searchTerm, sortOrder]);
  
  // Handle segment click
  const handleSegmentClick = (segmentIndex, startTime) => {
    // Toggle expanded state
    setExpandedSegment(expandedSegment === segmentIndex ? null : segmentIndex);
    
    // Jump to this segment in video
    onSegmentClick(startTime);
  };
  
  // Copy a single segment to clipboard
  const copySegmentToClipboard = (segment, e) => {
    e.stopPropagation(); // Prevent triggering segment click
    
    const textToCopy = `${formatTimeRange(segment.start_time, segment.end_time)}: ${segment.description}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setCopySuccess('Failed to copy');
      });
  };
  
  // Export all results to clipboard
  const copyAllToClipboard = () => {
    if (!filteredResults || !filteredResults.length) return;
    
    const textContent = filteredResults.map(segment => 
      `${formatTimeRange(segment.start_time, segment.end_time)}: ${segment.description}`
    ).join('\n');
    
    navigator.clipboard.writeText(textContent)
      .then(() => {
        setCopySuccess('All copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy all: ', err);
        setCopySuccess('Failed to copy');
      });
  };
  
  // Export results as a file
  const exportResults = (format = 'txt') => {
    if (!filteredResults || !filteredResults.length) return;
    
    let content = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';
    
    if (format === 'txt') {
      content = filteredResults.map(segment => 
        `${formatTimeRange(segment.start_time, segment.end_time)}: ${segment.description}`
      ).join('\n');
    } else if (format === 'csv') {
      content = 'Start Time,End Time,Duration,Description\n';
      content += filteredResults.map(segment => {
        const duration = getSegmentDuration(segment.start_time, segment.end_time);
        return `${segment.start_time},${segment.end_time},${duration},"${segment.description}"`;
      }).join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else if (format === 'json') {
      content = JSON.stringify({ segments: filteredResults }, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }
    
    // Create a blob and download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-analysis-results.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>Video Analysis Results</h2>
        <div className="segments-count">
          {filteredResults.length} {filteredResults.length === 1 ? 'segment' : 'segments'} found
        </div>
      </div>
      
      <div className="results-controls">
        <div className="search-container">
          <div className="search-input-wrap">
            <span className="material-icons search-icon">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search in segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="sort-container">
          <label className="sort-label">Sort by:</label>
          <div className="sort-options">
            <button
              className={`sort-button ${sortOrder === 'time' ? 'active' : ''}`}
              onClick={() => setSortOrder('time')}
            >
              <span className="material-icons">schedule</span>
              Time
            </button>
            <button
              className={`sort-button ${sortOrder === 'duration' ? 'active' : ''}`}
              onClick={() => setSortOrder('duration')}
            >
              <span className="material-icons">timelapse</span>
              Duration
            </button>
          </div>
        </div>
      </div>
      
      {filteredResults && filteredResults.length > 0 ? (
        <div className="segments-list">
          {filteredResults.map((segment, index) => {
            const duration = getSegmentDuration(segment.start_time, segment.end_time);
            const isExpanded = expandedSegment === index;
            
            return (
              <div 
                key={index} 
                className={`segment-item ${isExpanded ? 'expanded' : ''}`}
                onClick={() => handleSegmentClick(index, segment.start_time)}
              >
                <div className="segment-content">
                  <div className="segment-time">
                    {formatTimeRange(segment.start_time, segment.end_time)}
                    <span className="segment-duration">
                      {formatDuration(duration)}
                    </span>
                  </div>
                  <div className="segment-description">
                    {segment.description}
                  </div>
                  <div className="segment-actions">
                    <button 
                      className="segment-action-button"
                      onClick={(e) => copySegmentToClipboard(segment, e)}
                      title="Copy segment"
                    >
                      <span className="material-icons">content_copy</span>
                    </button>
                    <button 
                      className="segment-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSegmentClick(segment.start_time);
                      }}
                      title="Jump to segment"
                    >
                      <span className="material-icons">play_circle_outline</span>
                    </button>
                    <button 
                      className="segment-action-button expand-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSegment(isExpanded ? null : index);
                      }}
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      <span className="material-icons">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="segment-details">
                    <div className="detail-item">
                      <span className="detail-label">Start time:</span>
                      <span className="detail-value">{formatTime(segment.start_time)} ({segment.start_time.toFixed(2)}s)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End time:</span>
                      <span className="detail-value">{formatTime(segment.end_time)} ({segment.end_time.toFixed(2)}s)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{formatDuration(duration)} ({duration.toFixed(2)}s)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-results">
          {searchTerm ? 'No matching segments found. Try a different search term.' : 'No segments detected in the video.'}
        </p>
      )}
      
      <div className="export-options">
        <div className="copy-status">
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        
        <div className="export-buttons">
          <button 
            onClick={copyAllToClipboard}
            className="export-button"
            disabled={!filteredResults || !filteredResults.length}
            title="Copy all segments to clipboard"
          >
            <span className="material-icons">content_copy</span>
            Copy All
          </button>
          
          <div className="export-dropdown">
            <button 
              className="export-button"
              disabled={!filteredResults || !filteredResults.length}
            >
              <span className="material-icons">download</span>
              Export
            </button>
            
            <div className="export-menu">
              <button onClick={() => exportResults('txt')}>Text (.txt)</button>
              <button onClick={() => exportResults('csv')}>Spreadsheet (.csv)</button>
              <button onClick={() => exportResults('json')}>JSON</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;