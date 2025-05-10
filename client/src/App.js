// src/App.js
import React, { useRef, useEffect, useState } from 'react';
import VideoGrid from './components/VideoGrid/VideoGrid';
import RecordingControls from './components/RecordingControls/RecordingControls';
import AudioWaveform from './components/AudioWaveform/AudioWaveform';
import ParticipantIndicator from './components/ParticipantIndicator/ParticipantIndicator';
import useMediaRecorder from './hooks/useMediaRecorder';
import { uploadBlob } from './utils/uploadBlob';
import './App.css';

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [ws, setWs] = useState(null);
  const peerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [participants, setParticipants] = useState([]);

  const { recording, blobs, start, stop } = useMediaRecorder(localStream);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setupWebSocket(stream);
      })
      .catch(err => console.error('getUserMedia failed: ', err));
  }, []);

  useEffect(() => {
    if (!recording && blobs.length > 0) {
      blobs.forEach((blob, i) => {
        const filename = `recording-${Date.now()}-${i}.webm`;
        uploadBlob(blob, filename);
      });
    }
  }, [recording, blobs]);

  function setupWebSocket(localStream) {
    const socket = new WebSocket('ws://localhost:3001');
    setWs(socket);

    const peer = new RTCPeerConnection();
    peerRef.current = peer;
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

    const iceQueue = [];

    peer.onicecandidate = e => {
      if (e.candidate) {
        socket.send(JSON.stringify({ type: 'ice', candidate: e.candidate }));
      }
    };

    peer.ontrack = e => {
      const [stream] = e.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    socket.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'offer') {
        await peer.setRemoteDescription(msg);
        iceQueue.forEach(c => peer.addIceCandidate(c));
        iceQueue.length = 0;

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.send(JSON.stringify(peer.localDescription));
      }
      if (msg.type === 'answer') {
        await peer.setRemoteDescription(msg);
      }
      if (msg.type === 'ice') {
        if (peer.remoteDescription) {
          await peer.addIceCandidate(msg.candidate);
        } else {
          iceQueue.push(msg.candidate);
        }
      }
    };

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(offer));
      });
    });
  }

  useEffect(() => {
    const updatedParticipants = [];

    if (localStream) {
      updatedParticipants.push({
        name: 'You',
        ref: localVideoRef,
        isLocal: true,
      });
    }

    if (remoteStream) {
      updatedParticipants.push({
        name: 'Guest',
        ref: remoteVideoRef,
        isLocal: false,
      });
    }

    setParticipants(updatedParticipants);
  }, [localStream, remoteStream]);

  return (
    <div className="app-container">
      <VideoGrid participants={participants} />
      <RecordingControls
        recording={recording}
        onStart={start}
        onStop={stop}
      />
      <AudioWaveform stream={localStream} />
      <ParticipantIndicator isSpeaking={false} />
    </div>
  );
}

export default App;
