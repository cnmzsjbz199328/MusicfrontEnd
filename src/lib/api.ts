export const API_BASE = 'https://gequbao-worker.tj15982183241.workers.dev';

export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    cover_url?: string;
    duration?: string;
}

export interface Favorite {
    id: string; // DB ID
    track_id: string; // Original Track ID
    title: string;
    artist: string;
    cover_url?: string;
    original_page_url?: string;
    mp3_url?: string;
    lyrics_url?: string;
    lyrics?: string;
    created_at?: string;
}

export interface AddFavoritePayload {
    track_id: string;
    title: string;
    artist: string;
    cover_url: string;
    original_page_url: string;
    mp3_url: string;
    lyrics: string;
    duration_seconds: number;
}

export interface SearchResponse {
    results: Track[];
}

export interface TrackResolution {
    url: string;
    lyrics?: string;
    title?: string;
    artist?: string;
    cover?: string;
}

export const api = {
    async search(query: string): Promise<Track[]> {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        return data.results || [];
    },

    async getTrack(id: string): Promise<TrackResolution> {
        const res = await fetch(`${API_BASE}/api/track/${id}`);
        if (!res.ok) throw new Error(`Resolve failed: ${res.status}`);
        return await res.json();
    },

    async getFavorites(): Promise<Favorite[]> {
        const res = await fetch(`${API_BASE}/api/favorites`);
        if (!res.ok) throw new Error(`Fetch favorites failed: ${res.status}`);
        return await res.json();
    },

    async addFavorite(payload: AddFavoritePayload): Promise<void> {
        const res = await fetch(`${API_BASE}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `Add favorite failed: ${res.status}`);
        }
    },

    async removeFavorite(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/api/favorites/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Delete favorite failed: ${res.status}`);
    },

    getStreamUrl(id: string): string {
        return `${API_BASE}/api/favorites/${id}/stream`;
    }
};
