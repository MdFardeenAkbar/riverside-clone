import React from 'react';
import './RecordingControls.css';
const RecordingControls = ({ recording, onStart, onStop }) => {
  return (
    <div className="recording-controls">
      {!recording ? (
        <button onClick={onStart} className="start-btn">Start Recording</button>
      ) : (
        <button onClick={onStop} className="stop-btn">Stop Recording</button>
      )}
    </div>
  );
};

export default RecordingControls;
