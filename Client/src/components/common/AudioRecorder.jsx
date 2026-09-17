import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, AlertCircle } from 'lucide-react';

const AudioRecorder = ({ onAudioReady, onAudioRemoved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    setMicError('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Convert blob to File object for Multer upload
        const audioFile = new File(
          [audioBlob],
          `voice_note_${Date.now()}.webm`,
          { type: 'audio/webm' }
        );

        if (onAudioReady) {
          onAudioReady(audioFile);
        }

        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // Collect in 200ms slices
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setMicError('Microphone permission denied or audio device not found.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setIsPlaying(false);
    setRecordingDuration(0);
    if (onAudioRemoved) {
      onAudioRemoved();
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
          <Volume2 className="w-4 h-4 text-brand-600" />
          <span>Voice Message / Audio Note (Optional)</span>
        </label>
        {isRecording && (
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-semibold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>Recording ({formatTime(recordingDuration)})</span>
          </div>
        )}
      </div>

      {micError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* When no recording is present and not currently recording */}
      {!isRecording && !audioURL && (
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4 text-brand-600" />
            <span>Record Voice Note</span>
          </button>
          <span className="text-xs text-slate-400">
            Explain your issue vocally for maintenance staff
          </span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop & Attach Recording</span>
          </button>
          <span className="text-xs text-slate-500 font-mono">
            Time elapsed: {formatTime(recordingDuration)}
          </span>
        </div>
      )}

      {/* Audio recorded and ready for playback or discard */}
      {audioURL && (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="p-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-full transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-semibold text-slate-800">Voice Note Attached</div>
              <div className="text-[11px] text-slate-400">
                Duration: {formatTime(recordingDuration)} • Ready to submit
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={deleteRecording}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Voice Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Hidden audio element */}
          <audio
            ref={audioPlayerRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
