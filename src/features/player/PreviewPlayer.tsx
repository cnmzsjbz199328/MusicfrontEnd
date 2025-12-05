import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function PreviewPlayer() {
    const { currentTrack, isPlaying, togglePlay, setExpanded, audioElement } = usePlayerStore();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!audioElement) return;

        const updateProgress = () => {
            if (audioElement.duration) {
                setProgress((audioElement.currentTime / audioElement.duration) * 100);
            }
        };

        audioElement.addEventListener('timeupdate', updateProgress);
        return () => audioElement.removeEventListener('timeupdate', updateProgress);
    }, [audioElement]);

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-2">
            <div
                className="flex flex-col w-full h-auto bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer"
                onClick={() => setExpanded(true)}
            >
                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-300 dark:bg-slate-600 relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center gap-3 p-2">
                    {/* Album Art */}
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-md size-12 bg-slate-200 dark:bg-slate-700"
                        style={{ backgroundImage: currentTrack.cover_url ? `url("${currentTrack.cover_url}")` : undefined }}
                    >
                        {!currentTrack.cover_url && <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">music_note</span>}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white text-sm font-medium leading-tight truncate">{currentTrack.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-tight truncate">{currentTrack.artist}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="text-slate-900 dark:text-white flex size-10 items-center justify-center rounded-full hover:bg-primary/20"
                            onClick={togglePlay}
                        >
                            <span className="material-symbols-outlined text-3xl">
                                {isPlaying ? 'pause_circle' : 'play_circle'}
                            </span>
                        </button>
                        <button
                            aria-label="Close player"
                            className="text-slate-500 dark:text-slate-400 flex size-10 items-center justify-center rounded-full hover:bg-primary/20"
                            onClick={() => usePlayerStore.setState({ currentTrack: null })}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
