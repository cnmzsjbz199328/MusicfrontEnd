import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { api } from '@/lib/api';

export function PlayerOverlay() {
    const { currentTrack, isPlaying, togglePlay, setPlaying, nextTrack, prevTrack, isExpanded, setExpanded, playMode, togglePlayMode, handleTrackEnd } = usePlayerStore();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Progress State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    // Lyrics State
    const [lyrics, setLyrics] = useState<string | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);

    useEffect(() => {
         if (!currentTrack) return;

         const resolve = async () => {
            setResolvedUrl(null);
            setLyrics(null);
            setLoading(true);
            setCurrentTime(0); // Reset progress when changing tracks

            try {
                if ('track_id' in currentTrack) {
                    // It's a favorite (has track_id and id is the DB ID). Use the stream endpoint.
                    setResolvedUrl(api.getStreamUrl(currentTrack.id));
                    if (currentTrack.lyrics) {
                        setLyrics(currentTrack.lyrics);
                    } else if (currentTrack.lyrics_url) {
                        try {
                            // Fetch directly from R2 (publicly accessible)
                            const res = await fetch(currentTrack.lyrics_url);
                            if (res.ok) {
                                const text = await res.text();
                                setLyrics(text);
                            }
                        } catch (e) {
                            // Silently fail - continue without lyrics
                        }
                    }
                } else {
                    // It's a search result (id is the track ID). Resolve it.
                    const data = await api.getTrack(currentTrack.id);
                    if (data.url) {
                        setResolvedUrl(data.url);
                        if (data.lyrics) setLyrics(data.lyrics);
                    }
                }
            } finally {
                setLoading(false);
                usePlayerStore.getState().setLoadingTrackId(null);
            }
        };

        resolve();
    }, [currentTrack]);

    // Auto-show lyrics if available
    useEffect(() => {
        if (lyrics) {
            setShowLyrics(true);
        } else {
            setShowLyrics(false);
        }
    }, [lyrics]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(() => {});
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, resolvedUrl]);

    const handleTimeUpdate = () => {
        if (audioRef.current && !isSeeking) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeekStart = () => {
        setIsSeeking(true);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setCurrentTime(time);
    };

    const handleSeekEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
        setIsSeeking(false);
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
        audioRef.current = el;
        if (el) {
            const currentEl = usePlayerStore.getState().audioElement;
            if (currentEl !== el) {
                usePlayerStore.getState().setAudioElement(el);
            }
        }
    }, []);

    if (!currentTrack) return null;

    return (
        <>
            <div className={`fixed inset-0 z-50 flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-transform duration-300 ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header */}
                <header className="flex items-center justify-between p-4 pt-8">
                    <button className="flex size-10 items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/10" onClick={() => setExpanded(false)}>
                        <span className="material-symbols-outlined text-2xl">expand_more</span>
                    </button>
                    <p className="text-lg font-bold">Now Playing</p>
                    <button
                        className={`flex size-10 items-center justify-center rounded-full transition-colors ${showLyrics ? 'bg-primary text-white' : 'bg-slate-200/50 dark:bg-white/10'}`}
                        onClick={() => setShowLyrics(!showLyrics)}
                        aria-label="Toggle lyrics"
                    >
                        <span className="material-symbols-outlined text-2xl">lyrics</span>
                    </button>
                </header>

                {/* Main Content */}
                <div className="flex flex-1 flex-col items-stretch justify-center gap-6 pb-4 px-8 relative overflow-hidden">

                    {showLyrics ? (
                        <div className="flex-1 overflow-y-auto text-center p-4 space-y-4">
                            {lyrics ? (
                                <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                    {lyrics}
                                </pre>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    暂无歌词
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Album Art */}
                            <div className="flex items-center justify-center py-7">
                                <div className="w-full max-w-xs aspect-square rounded-xl bg-cover bg-center bg-no-repeat shadow-2xl shadow-primary/20 bg-slate-200 dark:bg-slate-700"
                                    style={{ backgroundImage: currentTrack.cover_url ? `url("${currentTrack.cover_url}")` : undefined }}>
                                    {!currentTrack.cover_url && <span className="material-symbols-outlined text-6xl text-slate-400 flex items-center justify-center h-full">music_note</span>}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-center">
                                <p className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em]">{currentTrack.title}</p>
                                <p className="truncate text-base font-normal leading-normal text-slate-500 dark:text-slate-400">{currentTrack.artist}</p>
                            </div>
                        </>
                    )}

                    {/* Progress */}
                    <div>
                        <div className="group relative flex h-4 items-center">
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onMouseDown={handleSeekStart}
                                onTouchStart={handleSeekStart}
                                onInput={handleSeekChange}
                                onChange={handleSeekEnd}
                                className="absolute w-full h-1.5 opacity-0 z-10 cursor-pointer"
                            />
                            <div className="absolute h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20"></div>
                            <div
                                className="absolute h-1.5 rounded-full bg-primary"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            ></div>
                            {/* Thumb (visual only, follows progress) */}
                            <div
                                className="absolute size-4 rounded-full bg-primary ring-4 ring-primary/30 pointer-events-none"
                                style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
                            ></div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs font-medium tracking-[0.015em] text-slate-500 dark:text-slate-400">{formatTime(currentTime)}</p>
                            <p className="text-xs font-medium tracking-[0.015em] text-slate-500 dark:text-slate-400">{formatTime(duration)}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-around gap-6 pt-1">

                        <button className="flex size-12 shrink-0 items-center justify-center rounded-full text-slate-800 dark:text-white" onClick={prevTrack} aria-label="Previous">
                            <span className="material-symbols-outlined text-4xl">skip_previous</span>
                        </button>

                        <button
                            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-background-dark"
                            onClick={togglePlay}
                            disabled={loading || !resolvedUrl}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {loading ? (
                                <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {isPlaying ? 'pause' : 'play_arrow'}
                                </span>
                            )}
                        </button>

                        <button className="flex size-12 shrink-0 items-center justify-center rounded-full text-slate-800 dark:text-white" onClick={nextTrack} aria-label="Next">
                            <span className="material-symbols-outlined text-4xl">skip_next</span>
                        </button>

                        {/* Play Mode Button (Combined Shuffle/Repeat) */}
                        <button
                            className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors relative ${playMode !== 'normal'
                                ? 'text-primary'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                            onClick={togglePlayMode}
                            aria-label="Play Mode"
                            title={`Play Mode: ${playMode}`}
                        >
                            {['shuffle', 'shuffle-one'].includes(playMode) ? (
                                <span className="material-symbols-outlined text-2xl">shuffle</span>
                            ) : (
                                <span className="material-symbols-outlined text-2xl">repeat</span>
                            )}
                            {['repeat-one', 'shuffle-one'].includes(playMode) && (
                                <span className="absolute text-xs font-bold text-primary leading-none">1</span>
                            )}
                        </button>

                    </div>
                </div>
            </div>

            {resolvedUrl && (
                <audio
                    ref={setAudioRef}
                    src={resolvedUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleTrackEnd}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                    autoPlay
                />
            )}
        </>
    );
}
