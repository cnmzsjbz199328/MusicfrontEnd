import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { Track } from '@/lib/api';
import { usePlayerStore } from '@/store/usePlayerStore';

export function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [favoriteLoadingIds, setFavoriteLoadingIds] = useState<Set<string>>(new Set());
    const [favoriteSuccessIds, setFavoriteSuccessIds] = useState<Set<string>>(new Set());
    const { setQueue, loadingTrackId } = usePlayerStore();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const tracks = await api.search(query);
            setResults(tracks);
        } catch (error) {
            // TODO: Show error toast
        } finally {
            setLoading(false);
        }
    };

    const handleFavorite = async (track: Track) => {
        // Add to loading state
        setFavoriteLoadingIds(prev => new Set(prev).add(track.id));

        try {
             // 1. Resolve track first to get MP3 URL and lyrics
            // Encode ID to handle special characters
            const trackData = await api.getTrack(encodeURIComponent(track.id));

            if (!trackData.url) throw new Error('No MP3 URL found');

            // 2. Add to favorites
            await api.addFavorite({
                track_id: track.id,
                title: track.title,
                artist: track.artist,
                cover_url: track.cover_url || '',
                original_page_url: `https://www.gequbao.com/music/${track.id}`,
                mp3_url: trackData.url,
                lyrics: trackData.lyrics || '',
                duration_seconds: 0 // We don't have exact seconds from search result string
            });

            // Show success state
            setFavoriteLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(track.id);
                return next;
            });
            setFavoriteSuccessIds(prev => new Set(prev).add(track.id));

            // Auto-clear success state after 1s
            setTimeout(() => {
                setFavoriteSuccessIds(prev => {
                    const next = new Set(prev);
                    next.delete(track.id);
                    return next;
                });
            }, 1000);
        } catch (err) {
            // Clear loading state on error
            setFavoriteLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(track.id);
                return next;
            });
        }
    };

    const handlePlayTrack = (track: Track) => {
        // Only allow playing if no track is currently loading
        if (!loadingTrackId) {
            setQueue(results, results.indexOf(track));
        }
    };

    return (
        <div className="flex flex-col">
            {/* Top App Bar */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
                <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">搜索</h2>
                <button
                    onClick={() => usePlayerStore.getState().toggleFavorites()}
                    className="absolute right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <span className="material-symbols-outlined text-slate-900 dark:text-white">bookmarks</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 sticky top-[68px] z-10 bg-background-light dark:bg-background-dark">
                <form onSubmit={handleSearch}>
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 flex border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-xl border-y border-l">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 focus:border-primary h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 pl-2 text-base font-normal leading-normal"
                                placeholder="搜索歌曲或艺术家"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </label>
                </form>
            </div>

            {/* Spacer */}
            <div className="h-2 bg-background-light dark:bg-background-dark"></div>

            {/* Content Area */}
            {results.length === 0 && !loading ? (
                // Show podcast embed when no search results
                <div className="flex-1 w-full overflow-y-auto flex flex-col items-center justify-center">
                    <div className="w-full max-w-2xl px-4 py-6">
                        <div className="text-center mb-6">
                            <p className="text-slate-600 dark:text-slate-300 text-sm">
                                没有想听的歌？<span className="text-primary font-medium">试试AI播客吧！</span>
                            </p>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                src="https://podcast.futurebutnow.xyz/"
                                className="w-full border-0"
                                style={{ height: '800px' }}
                                title="FutureButNow Podcast"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Show search results
                <div className="flex flex-col gap-1 px-2 overflow-y-auto flex-1">
                    {loading && <div className="p-4 text-center text-slate-500">搜索中...</div>}

                    {results.map((track) => {
                        const isTrackLoading = loadingTrackId === track.id;
                        
                        return (
                            <div key={track.id} className="flex items-center gap-4 bg-background-light dark:bg-background-dark px-2 py-2 justify-between rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <div className="flex items-center gap-4">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-md size-14 bg-slate-200 dark:bg-slate-700"
                                    style={{ backgroundImage: track.cover_url ? `url("${track.cover_url}")` : undefined }}
                                >
                                    {!track.cover_url && <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">music_note</span>}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-slate-900 dark:text-white text-base font-medium leading-normal line-clamp-1">{track.title}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-2">{track.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    aria-label={isTrackLoading ? "Loading" : "Play"}
                                    className={`text-slate-900 dark:text-white flex size-10 items-center justify-center rounded-full transition-all ${
                                        isTrackLoading 
                                            ? 'opacity-50 cursor-wait' 
                                            : 'hover:bg-primary/20'
                                    }`}
                                    onClick={() => handlePlayTrack(track)}
                                    disabled={isTrackLoading}
                                >
                                    <span 
                                        className={`material-symbols-outlined text-3xl ${isTrackLoading ? 'animate-spin' : ''}`}
                                    >
                                        {isTrackLoading ? 'refresh' : 'play_circle'}
                                    </span>
                                </button>
                                <button
                                    aria-label="Add to favorites"
                                    className={`flex size-10 items-center justify-center rounded-full transition-colors duration-300 ${
                                        favoriteLoadingIds.has(track.id)
                                            ? 'text-slate-400 dark:text-slate-500 cursor-wait'
                                            : favoriteSuccessIds.has(track.id)
                                                ? 'text-primary'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-primary/20'
                                    }`}
                                    onClick={() => handleFavorite(track)}
                                    disabled={favoriteLoadingIds.has(track.id)}
                                >
                                    <span 
                                        className={`material-symbols-outlined transition-all duration-300 ${
                                            favoriteLoadingIds.has(track.id) ? 'animate-spin' : ''
                                        }`}
                                        style={
                                            favoriteSuccessIds.has(track.id) 
                                                ? { fontVariationSettings: "'FILL' 1" }
                                                : {}
                                        }
                                    >
                                        {favoriteLoadingIds.has(track.id) ? 'refresh' : 'favorite'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
