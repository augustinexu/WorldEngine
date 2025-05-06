import React from 'react';
import './AnalysisProgress.css';

const AnalysisProgress = ({ isLoading, progressStage, onCancel }) => {
  if (!isLoading) return null;
  
  // Define stages of analysis with percentages
  const stages = [
    { name: 'Preparing video', percent: 10 },
    { name: 'Extracting frames', percent: 30 },
    { name: 'Analyzing with Gemini AI', percent: 70 },
    { name: 'Processing results', percent: 90 }
  ];
  
  // Get current stage info
  const currentStageIndex = Math.min(progressStage || 0, stages.length - 1);
  const currentStage = stages[currentStageIndex];
  const percent = currentStage.percent;
  
  return (
    <div className="analysis-progress">
      <h3>Analyzing Video</h3>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percent}%` }}></div>
      </div>
      <p className="progress-stage">
        <span className="material-icons progress-icon">hourglass_top</span>
        {currentStage.name}
      </p>
      <p className="progress-tip">
        This may take several minutes depending on video length
      </p>
      <button className="cancel-button" onClick={onCancel}>
        <span className="material-icons">cancel</span>
        Cancel Analysis
      </button>
    </div>
  );
};

export default AnalysisProgress;