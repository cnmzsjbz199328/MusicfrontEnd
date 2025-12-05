# Gequbao Music Crawler (Cloudflare Workers)

A serverless music crawler and personal library manager built on Cloudflare Workers. It allows users to search for music, resolve playback links from dynamic pages, and save their favorite tracks (MP3 + Lyrics) to persistent cloud storage (R2 + D1).

## Features

-   **Music Search**: Search for tracks by name or artist.
-   **Smart Resolution**: Uses a headless browser (Puppeteer) to extract MP3 links and lyrics from dynamic web pages.
-   **Cloud Favorites**: Save tracks to your personal library.
    -   **MP3 Storage**: Automatically downloads and saves MP3s to Cloudflare R2.
    -   **Lyrics Support**: Captures and saves synchronized lyrics (.lrc).
    -   **Metadata**: Stores track info in Cloudflare D1 database.
-   **Streaming**: Stream your saved tracks directly from R2 with high speed and reliability.

## Tech Stack

-   **Runtime**: Cloudflare Workers
-   **Language**: TypeScript
-   **Database**: Cloudflare D1 (SQLite)
-   **Storage**: Cloudflare R2
-   **Browser Automation**: Cloudflare Browser Rendering (Puppeteer) & Durable Objects
-   **Framework**: Itty Router (for API routing)

## Prerequisites

-   Node.js (v16+)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
-   A Cloudflare account with Workers Paid plan (required for Browser Rendering API).

## Setup & Configuration

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Cloudflare Login**
    ```bash
    npx wrangler login
    ```

4.  **Create D1 Database**
    ```bash
    npx wrangler d1 create gequbao-db
    ```
    *Copy the `database_id` from the output and update `wrangler.toml`.*

5.  **Create R2 Bucket**
    ```bash
    npx wrangler r2 bucket create gequbao-audio
    ```
    *Ensure `bucket_name` in `wrangler.toml` matches.*

6.  **Initialize Database Schema**
    ```bash
    npx wrangler d1 execute gequbao-db --remote --file=schema.sql
    ```

## Development

### Local Development
> **Note**: The Browser Rendering API (Puppeteer) does **not** work in local `wrangler dev` mode. You must deploy to test scraping features.

For non-browser features (like basic API routing), you can run:
```bash
npm run dev
```

### Deployment
To deploy the worker to your Cloudflare account:
```bash
npm run deploy
```

## API Documentation

### Search
-   **GET** `/api/search?q=keyword`
    -   Returns a list of tracks matching the keyword.

### Track Resolution
-   **GET** `/api/track/:id`
    -   Resolves the real MP3 URL and lyrics for a specific track ID.

### Favorites
-   **GET** `/api/favorites`
    -   List all saved favorites.
-   **POST** `/api/favorites`
    -   Add a track to favorites. Requires JSON body with track details.
-   **DELETE** `/api/favorites/:id`
    -   Remove a favorite.
-   **GET** `/api/favorites/:id/stream`
    -   Stream the MP3 file for a favorite.

## Testing

A simple frontend test page is included at `test/test.html`.
1.  Open `test/test.html` in your browser.
2.  It connects to the deployed worker URL by default.
3.  You can search, play, favorite, and manage your library directly from this page.
