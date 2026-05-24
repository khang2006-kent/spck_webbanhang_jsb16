<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ca6bd70d-82ff-4f8a-bbf2-49a89be693de

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root (copy from `.env.example`) and set:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
PORT=3002
APP_URL=http://localhost:3001/callback
GEMINI_API_KEY=your_gemini_key
```

3. Start servers in two terminals:

Terminal A — auth backend (runs on port 3002):
```bash
npm run start-auth
```

Terminal B — frontend (Vite, runs on port 3001):
```bash
npm run dev
```

4. Test Spotify search from browser console:
```js
searchSpotifyTracks('Daft Punk').then(r => console.log(r));
```

Notes:
- The dev server proxies `/token` to the auth server so frontend can call `fetch('/token')`.
- Keep `SPOTIFY_CLIENT_SECRET` private and do not commit `.env` to git.
