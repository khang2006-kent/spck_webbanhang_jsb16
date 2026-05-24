import express from "express";
import dotenv from "dotenv";
import SpotifyWebApi from 'spotify-web-api-node';

dotenv.config();

const app = express();

// Basic CORS and body parsing for token exchange
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/token", async (req, res) => {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Missing Spotify credentials on server" });
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const params = new URLSearchParams({ grant_type: "client_credentials" });

  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch token" });
  }
});

// Exchange authorization code (PKCE) for access token (called from client)
app.post('/exchange', async (req, res) => {
  const { code, code_verifier, redirect_uri } = req.body;
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  if (!code || !code_verifier) return res.status(400).json({ error: 'Missing code or code_verifier' });

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect_uri || (process.env.REDIRECT_URI || ''),
    code_verifier
  });

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  // If server has client secret, prefer Basic auth
  if (CLIENT_ID && CLIENT_SECRET) {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    headers['Authorization'] = `Basic ${basic}`;
  } else if (CLIENT_ID) {
    // include client_id in body when no client_secret
    params.append('client_id', CLIENT_ID);
  }

  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers,
      body: params
    });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Server-side playlist proxy: returns simplified tracks with preview URLs
app.get('/api/playlist', async (req, res) => {
  const playlistId = req.query.id || req.query.playlistId;
  const limit = Number(req.query.limit || 20);
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  if (!playlistId) return res.status(400).json({ error: 'Missing playlist id (id or playlistId query param)' });
  if (!CLIENT_ID || !CLIENT_SECRET) return res.status(500).json({ error: 'Server missing Spotify credentials' });

  try {
    const spotifyApi = new SpotifyWebApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
    const tokenResp = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenResp.body.access_token);
    const data = await spotifyApi.getPlaylistTracks(playlistId, { limit });
    const items = (data.body.items || []).map(it => {
      const t = it.track || it;
      return {
        id: 's' + (t.id || Math.random().toString(36).slice(2,8)),
        title: t.name,
        artist: (t.artists || []).map(a=>a.name).join(', '),
        art: (t.album && t.album.images && (t.album.images[1] || t.album.images[0]) && (t.album.images[1]||t.album.images[0]).url) || '',
        preview: t.preview_url || ''
      };
    }).filter(x=>x.preview);
    return res.json({ items });
  } catch (err) {
    console.error('Playlist fetch failed', err);
    return res.status(500).json({ error: 'Failed to fetch playlist', details: err.message || err });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Spotify auth server running on http://localhost:${PORT}`));
