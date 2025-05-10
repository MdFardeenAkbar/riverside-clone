import React from 'react';
import './ParticipantIndicator.css';
const ParticipantIndicator = ({ isSpeaking }) => {
  return (
    <div className={`participant-indicator ${isSpeaking ? 'speaking' : ''}`}>
      {isSpeaking ? 'Speaking' : 'Listening'}
    </div>
  );
};

export default ParticipantIndicator;
