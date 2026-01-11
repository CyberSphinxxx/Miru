# Miru 見る

A personal anime streaming site built with React and Express.

![Miru](https://img.shields.io/badge/Miru-Anime%20Streaming-8b5cf6?style=for-the-badge)

## Features

- Browse top-rated anime from MyAnimeList
- Search for any anime
- Stream episodes with quality selection
- Clean, modern UI with glassmorphism effects
- HLS video player with embed fallback

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- TailwindCSS
- HLS.js

**Backend:**
- Express.js
- Puppeteer (for scraping)
- Jikan API (MAL data)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

### Running the Application

1. **Start the backend server:**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3001`

2. **Start the frontend development server:**
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

## API Endpoints

### Jikan API (Anime Metadata)
- `GET /api/jikan/top` - Get top anime
- `GET /api/jikan/search?q=query` - Search anime
- `GET /api/jikan/anime/:id` - Get anime details

### Scraper API (Streaming)
- `GET /api/scraper/search?q=query` - Search for anime on source
- `GET /api/scraper/episodes?session=id` - Get episode list
- `GET /api/scraper/streams?anime_session=id&ep_session=id` - Get stream links

## Note

The scraper may take ~10 seconds on first request due to DDoS protection handling.

## License

Personal use only.
