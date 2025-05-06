import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;
  
  // Map error types to more user-friendly messages
  const getErrorMessage = (error) => {
    // Extract just the message part if it's an Error object
    const errorMsg = error.message || error;
    
    if (errorMsg.includes('aborted') || errorMsg.includes('cancelled')) {
      return 'Analysis was cancelled.';
    }
    
    if (errorMsg.includes('timeout')) {
      return 'Analysis timed out. The video may be too long or complex for processing.';
    }
    
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (errorMsg.includes('413') || errorMsg.includes('too large')) {
      return 'The video file is too large. Please try a smaller file or use a URL instead.';
    }
    
    if (errorMsg.includes('Failed to download video')) {
      return 'Failed to access the video URL. Please check if the URL is correct and publicly accessible.';
    }
    
    if (errorMsg.includes('GEMINI_API_KEY') || errorMsg.includes('API key')) {
      return 'Server configuration error. The Gemini API key appears to be missing or invalid.';
    }
    
    // Default error message
    return errorMsg;
  };
  
  const friendlyMessage = getErrorMessage(error);
  
  return (
    <div className="error-message">
      <div className="error-icon">
        <span className="material-icons">error_outline</span>
      </div>
      
      <div className="error-content">
        <h3>Analysis Failed</h3>
        <p>{friendlyMessage}</p>
        
        <div className="error-troubleshooting">
          <h4>Troubleshooting Tips:</h4>
          <ul>
            <li>Try using a shorter video clip</li>
            <li>Check if your video format is supported (MP4, AVI, MOV, WEBM)</li>
            <li>If using a URL, check if the video is publicly accessible</li>
            <li>Try again later if it might be a temporary issue</li>
          </ul>
        </div>
        
        <div className="error-actions">
          {onRetry && (
            <button className="retry-button" onClick={onRetry}>
              <span className="material-icons">refresh</span>
              Try Again
            </button>
          )}
          
          {onDismiss && (
            <button className="dismiss-button" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;