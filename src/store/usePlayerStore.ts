import { create } from 'zustand';
import type { Track, Favorite } from '@/lib/api';

interface PlayerState {
    currentTrack: Track | Favorite | null;
    isPlaying: boolean;
    queue: (Track | Favorite)[];
    audioElement: HTMLAudioElement | null;

    // UI State
    isFavoritesOpen: boolean;
    isExpanded: boolean;

    // Actions
    setAudioElement: (el: HTMLAudioElement) => void;
    playTrack: (track: Track | Favorite) => void;
    togglePlay: () => void;
    setPlaying: (playing: boolean) => void;
    addToQueue: (track: Track | Favorite) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    toggleFavorites: () => void;
    setExpanded: (expanded: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    audioElement: null,
    isFavoritesOpen: false,
    isExpanded: false, // Default to minimized (Preview)

    setAudioElement: (el) => set({ audioElement: el }),

    playTrack: (track) => {
        const { audioElement } = get();
        set({ currentTrack: track, isPlaying: true, isExpanded: false });
        if (audioElement) {
            // Logic handled in component for now
        }
    },

    togglePlay: () => {
        const { isPlaying, audioElement } = get();
        if (audioElement) {
            if (isPlaying) audioElement.pause();
            else audioElement.play();
        }
        set({ isPlaying: !isPlaying });
    },

    setPlaying: (playing) => set({ isPlaying: playing }),

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    nextTrack: () => {
        // Implement queue logic later
    },

    prevTrack: () => {
        // Implement queue logic later
    },

    toggleFavorites: () => set((state) => ({ isFavoritesOpen: !state.isFavoritesOpen })),
    setExpanded: (expanded) => set({ isExpanded: expanded }),
}));
