import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Favorite } from '@/lib/api';
import { usePlayerStore } from '@/store/usePlayerStore';

interface FavoritesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FavoritesDrawer({ isOpen, onClose }: FavoritesDrawerProps) {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const { setQueue, currentTrack } = usePlayerStore();
    const [loading, setLoading] = useState(false);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const data = await api.getFavorites();
            setFavorites(data);
        } catch (err) {
            console.error('Failed to load favorites', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadFavorites();
        }
    }, [isOpen]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除吗？')) return;
        try {
            await api.removeFavorite(id);
            setFavorites(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error('Failed to delete favorite', err);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
            <div className="relative flex h-full w-10/12 max-w-sm flex-col bg-background-light p-4 shadow-2xl dark:bg-background-dark">
                <div className="flex items-center justify-between pb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">收藏列表</h2>
                    <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-gray-600 dark:text-gray-400">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                    {loading && <div className="p-4 text-center text-gray-500">加载中...</div>}
                    {!loading && favorites.length === 0 && <div className="p-4 text-center text-gray-500">暂无收藏</div>}

                    {favorites.map(fav => (
                        <div
                            key={fav.id}
                            className={`flex items-center justify-between gap-4 rounded-lg p-2 cursor-pointer transition-colors ${currentTrack?.id === fav.id
                                ? 'bg-primary/20'
                                : 'hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                            onClick={() => {
                                const index = favorites.findIndex(f => f.id === fav.id);
                                setQueue(favorites, index);
                                onClose();
                            }}
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                <div
                                    className="size-12 shrink-0 rounded-md bg-cover bg-center bg-slate-200 dark:bg-slate-700"
                                    style={{ backgroundImage: fav.cover_url ? `url("${fav.cover_url}")` : undefined }}
                                >
                                    {!fav.cover_url && <span className="material-symbols-outlined text-slate-400 flex items-center justify-center h-full">music_note</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-medium text-gray-900 dark:text-white">{fav.title}</p>
                                    <p className="truncate text-sm font-normal text-gray-500 dark:text-gray-400">{fav.artist}</p>
                                </div>
                            </div>
                            <button className="shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full" onClick={(e) => handleDelete(fav.id, e)}>
                                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400 hover:text-red-500">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
