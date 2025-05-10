import { useState, useRef, useCallback, useEffect } from 'react';

export default function useMediaRecorder(stream, mimeType = 'video/webm') {
  const [recording, setRecording] = useState(false);
  const [blobs, setBlobs] = useState([]);
  const recorderRef = useRef(null);

  const start = useCallback(() => {
    if (!stream) return;
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => setBlobs(chunks);

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }, [stream, mimeType]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  return { recording, blobs, start, stop };
}
