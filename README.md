# <div align="center">Miru (見る)</div>

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express" alt="Express" />
</div>

<br />

<div align="center">
  <strong>The Ultimate Personal Anime Streaming & Manga Reading Experience.</strong>
</div>
<div align="center">
  Currently in active development.
</div>

<br />

## Overview

**Miru** allows you to watch anime and read manga in a unified, beautifully designed interface. Built with performance and aesthetics in mind, it utilizes a modern tech stack to serve content seamlessly without ads or interruptions. From tracking your progress to discovering new series, Miru aims to be your all-in-one otaku hub.

## Key Features

### Anime Streaming
-   **High-Quality Playback:** Stream episodes in various qualities with a robust HLS video player.
-   **Ad-Free Experience:** No interruptions, just your content.
-   **Multi-Server Support:** Fallback options to ensure availability.
-   **Smart Player:** Auto-play next episode, skip intro/outro (where supported), and theatre mode.

### Integrated Manga Reader
-   **Seamless Reading:** Read manga chapters directly within the app—no external redirects.
-   **Customizable Reader:** Adjust fit modes, direction, and quality.
-   **Chapter Tracking:** Automatically tracks your reading progress.

### Discovery & Organization
-   **Advanced Search:** Find any anime or manga instantly.
-   **Trending & Popular:** See what's hot right now on AniList and other sources.
-   **Seasonal Charts:** Browse anime by season and year.
-   **Detailed Info:** Rich metadata including synopsis, genres, characters, and related media.
-   **Schedules:** Keep up with airing schedules for your favorite ongoing shows.

### User Experience
-   **Glassmorphism UI:** A sleek, modern, and translucent design language.
-   **Watch History:** Resume right where you left off.
-   **Library Management:** Add series to your "Plan to Watch", "Completed", or "Dropped" lists.
-   **Responsive Design:** Optimized for Desktop, Tablet, and Mobile devices.
-   **Toast Notifications:** Real-time feedback for your actions.

## Tech Stack

### Frontend
-   **Framework:** [React 19](https://react.dev/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [TailwindCSS](https://tailwindcss.com/)
-   **Player:** [HLS.js](https://github.com/video-dev/hls.js)
-   **Navigation:** [React Router DOM](https://reactrouter.com/)
-   **State/Data:** Firebase SDK

### Backend
-   **Runtime:** [Node.js](https://nodejs.org/)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Scraping:** [Puppeteer](https://pptr.dev/) (with @sparticuz/chromium for serverless)
-   **Data Sources:** Integrations with AniList, HiAnime, and Manga sources.
-   **Database:** Firebase (Firestore/Auth)

## Getting Started

Follow these steps to set up Miru locally.

### Prerequisites
-   **Node.js** (v18 or higher)
-   **npm** or **yarn**
-   **Firebase Account** (for Auth and Database)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/miru.git
cd miru
```

### 2. Backend Setup
The backend handles scraping and API requests.

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (optional, defaults to port 3001):
```env
PORT=3001
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal terminal in the root `miru` directory.

```bash
npm install
```

Create a `.env` file in the root directory with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Start the frontend:
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Deployment

This project is optimized for deployment on **Vercel**.
-   **Frontend:** Deploys as a static site (SPA).
-   **Backend:** Configured to run as Serverless Functions (located in `backend/api` or configured via `vercel.json`).

## Disclaimer

**Miru** is a personal project for educational purposes. It does not host any content. All content is scraped from third-party sources. The developers are not responsible for how this application is used.

## License

This project is for my **Personal Use Only**.

---
