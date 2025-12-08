import { create } from 'zustand';
import type { Track, Favorite } from '@/lib/api';

type PlayMode = 'normal' | 'repeat-all' | 'repeat-one' | 'shuffle' | 'shuffle-one';

// Utility: Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

interface PlayerState {
    currentTrack: Track | Favorite | null;
    isPlaying: boolean;
    queue: (Track | Favorite)[];
    queueIndex: number;
    audioElement: HTMLAudioElement | null;

    // Playback Mode System
    playMode: PlayMode;
    shuffledQueue: (Track | Favorite)[];

    // UI State
    isFavoritesOpen: boolean;
    isExpanded: boolean;

    // Actions
    setAudioElement: (el: HTMLAudioElement) => void;
    setQueue: (queue: (Track | Favorite)[], startIndex: number) => void;
    playTrack: (track: Track | Favorite) => void;
    togglePlay: () => void;
    setPlaying: (playing: boolean) => void;
    addToQueue: (track: Track | Favorite) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    togglePlayMode: () => void;
    handleTrackEnd: () => void;
    toggleFavorites: () => void;
    setExpanded: (expanded: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    queueIndex: -1,
    audioElement: null,
    playMode: 'normal',
    shuffledQueue: [],
    isFavoritesOpen: false,
    isExpanded: false,

    setAudioElement: (el) => set({ audioElement: el }),

    setQueue: (queue, startIndex) => {
        if (queue.length === 0) return;
        
        const newQueue = [...queue];
        const shuffled = shuffleArray(newQueue);
        
        set({
            queue: newQueue,
            shuffledQueue: shuffled,
            queueIndex: startIndex,
            currentTrack: newQueue[startIndex],
            isPlaying: true,
            isExpanded: false,
        });
    },

    playTrack: (track) => {
        const { queue } = get();
        const index = queue.findIndex(t => t.id === track.id);
        
        set({
            currentTrack: track,
            queueIndex: index !== -1 ? index : 0,
            isPlaying: true,
        });
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

    addToQueue: (track) => set((state) => ({
        queue: [...state.queue, track],
        shuffledQueue: [...state.shuffledQueue, track],
    })),

    nextTrack: () => {
        const { queue, queueIndex, playMode, shuffledQueue } = get();
        if (queue.length === 0) return;

        const currentQueue = ['shuffle', 'shuffle-one'].includes(playMode) ? shuffledQueue : queue;
        const nextIndex = (queueIndex + 1) % currentQueue.length;

        get().playTrack(currentQueue[nextIndex]);
    },

    prevTrack: () => {
        const { queue, queueIndex, playMode, shuffledQueue } = get();
        if (queue.length === 0) return;

        const currentQueue = ['shuffle', 'shuffle-one'].includes(playMode) ? shuffledQueue : queue;
        const prevIndex = (queueIndex - 1 + currentQueue.length) % currentQueue.length;

        get().playTrack(currentQueue[prevIndex]);
    },

    togglePlayMode: () => {
        const { playMode, queue } = get();
        const modes: PlayMode[] = ['normal', 'repeat-all', 'repeat-one', 'shuffle', 'shuffle-one'];
        const currentIndex = modes.indexOf(playMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        // Regenerate shuffled queue when entering shuffle mode
        if (['shuffle', 'shuffle-one'].includes(nextMode) && !['shuffle', 'shuffle-one'].includes(playMode)) {
            const newShuffled = shuffleArray(queue);
            set({ playMode: nextMode, shuffledQueue: newShuffled });
        } else {
            set({ playMode: nextMode });
        }
    },

    handleTrackEnd: () => {
        const { playMode, queue, queueIndex } = get();
        const isLastTrack = queueIndex === queue.length - 1;

        switch (playMode) {
            case 'normal':
                if (!isLastTrack) {
                    get().nextTrack();
                } else {
                    get().setPlaying(false);
                }
                break;

            case 'repeat-all':
                get().nextTrack();
                break;

            case 'repeat-one':
                get().playTrack(queue[queueIndex]);
                break;

            case 'shuffle':
                get().nextTrack();
                break;

            case 'shuffle-one':
                get().playTrack(queue[queueIndex]);
                break;

            default:
                get().setPlaying(false);
        }
    },

    toggleFavorites: () => set((state) => ({ isFavoritesOpen: !state.isFavoritesOpen })),
    setExpanded: (expanded) => set({ isExpanded: expanded }),
}));
