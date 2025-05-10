import React, { useRef, useEffect, useState } from 'react';
import useMediaRecorder from './hooks/useMediaRecorder';
import { uploadBlob } from './utils/uploadBlob';

function App() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [ws, setWs] = useState(null);
  const peerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);


  const { recording, blobs, start, stop } = useMediaRecorder(localStream);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if(localVideo.current) {
        localVideo.current.srcObject = stream;
        setupWebSocket(stream);
        }
      }).catch(err => console.error('getUserMedia failed: ', err));
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
  
    peer.onicecandidate = e => {
      if (e.candidate) socket.send(JSON.stringify({ type: 'ice', candidate: e.candidate }));
    };

    const iceQueue = [];

    peer.onicecandidate = e => {
      if (e.candidate) {
        socket.send(JSON.stringify({ type: 'ice', candidate: e.candidate }));
      }
    };

    peer.ontrack = e => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
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
  
    // create and send offer if you’re the first in the room
    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(offer));
    });
  });
    peerRef.current = peer;
  }

  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <video ref={localVideo} autoPlay muted playsInline style={{ width: 300, background: '#000' }} />
        <video ref={remoteVideo} autoPlay playsInline style={{ width: 300, background: '#000' }} />
      </div>
      <div>
        {!recording ? (
          <button onClick={start}>Start Recording</button>
        ) : (
          <button onClick={stop}>Stop & Upload</button>
        )}
      </div>
    </div>
  );
}

export default App;