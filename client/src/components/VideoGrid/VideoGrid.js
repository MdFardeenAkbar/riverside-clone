import React from 'react';
import './VideoGrid.css';

const VideoGrid = ({ participants }) => {
  return (
    <div className="video-grid">
      {participants.map((participant, index) => (
        <div key={index} className="video-container">
          <video
            ref={participant.ref}
            autoPlay
            muted={participant.isLocal}
            playsInline
            className="video"
          />
          <div className="participant-name">{participant.name}</div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
