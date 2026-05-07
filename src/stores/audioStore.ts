import { create } from 'zustand';

interface AudioState {
  currentlyPlayingId: string | null;
  isRecording: boolean;
  lastRecordingBlob: Blob | null;
  lastRecordingUrl: string | null;
  setPlaying: (id: string | null) => void;
  setRecording: (v: boolean) => void;
  setRecording_Result: (blob: Blob | null) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentlyPlayingId: null,
  isRecording: false,
  lastRecordingBlob: null,
  lastRecordingUrl: null,
  setPlaying: (id) => set({ currentlyPlayingId: id }),
  setRecording: (v) => set({ isRecording: v }),
  setRecording_Result: (blob) => {
    const prev = get().lastRecordingUrl;
    if (prev) URL.revokeObjectURL(prev);
    const url = blob ? URL.createObjectURL(blob) : null;
    set({ lastRecordingBlob: blob, lastRecordingUrl: url });
  },
}));
