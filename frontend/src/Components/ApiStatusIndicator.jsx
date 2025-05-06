import React from 'react';
import './ApiStatusIndicator.css';

const ApiStatusIndicator = ({ isAvailable, onCheckStatus }) => {
  return (
    <div className={`api-status-indicator ${isAvailable ? 'available' : 'unavailable'}`}>
      <span className="status-icon material-icons">
        {isAvailable ? 'cloud_done' : 'cloud_off'}
      </span>
      <div className="status-info">
        <span className="status-label">
          Backend API: {isAvailable ? 'Connected' : 'Disconnected'}
        </span>
        <span className="status-message">
          {isAvailable 
            ? 'The analysis service is ready to use.' 
            : 'The backend service appears to be offline.'}
        </span>
      </div>
      {!isAvailable && (
        <button 
          className="refresh-button" 
          onClick={onCheckStatus}
          aria-label="Check API connection"
        >
          <span className="material-icons">refresh</span>
          Retry
        </button>
      )}
    </div>
  );
};

export default ApiStatusIndicator;