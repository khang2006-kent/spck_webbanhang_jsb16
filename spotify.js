// Minimal Spotify OAuth PKCE integration for client-side apps.
// NOTE: Replace SPOTIFY_CLIENT_ID with your app's client ID and ensure
// the redirect URI is registered in your Spotify app settings.

const SPOTIFY_CLIENT_ID = 'b11a2bac345744b38b36d09111a5e9ac'; // <-- set this
const REDIRECT_URI = 'http://127.0.0.1:5500/index.html'; // redirect back to this page (fixed to match your dev URL)
const SCOPES = 'user-read-private user-read-email';

function base64UrlEncode(str) {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(buffer) {
  return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(buffer));
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

function qs(params) {
  return Object.entries(params).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
}

async function redirectToSpotify() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
    alert('Please set SPOTIFY_CLIENT_ID in spotify.js');
    return;
  }
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem('spotify_code_verifier', verifier);

  const params = {
    client_id: b11a2bac345744b38b36d09111a5e9ac,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
    show_dialog: true
  };
  window.location = 'https://accounts.spotify.com/authorize?' + qs(params);
}

async function exchangeCodeForToken(code, verifier) {
  // Prefer server-side exchange to avoid CORS issues. Ensure server is running.
  try {
    const exchangeUrl = 'http://localhost:3002/exchange';
    const res = await fetch(exchangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: REDIRECT_URI })
    });
    if (!res.ok) throw new Error('Server exchange failed: ' + res.status);
    return await res.json();
  } catch (err) {
    // Fallback: attempt direct client-side exchange (may be blocked by CORS)
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: verifier
    };
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: qs(body)
    });
    if (!r.ok) throw new Error('Token exchange failed: ' + r.status);
    return await r.json();
  }
}

async function fetchProfile(accessToken) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  if (!res.ok) throw new Error('API request failed: ' + res.status);
  return await res.json();
}

function updateStatus(text) {
  const el = document.getElementById('spotify-status');
  if (el) el.textContent = text;
}

async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code) return;
  updateStatus('Đang trao đổi mã...');
  const verifier = localStorage.getItem('spotify_code_verifier');
  try {
    const tokenResp = await exchangeCodeForToken(code, verifier);
    const accessToken = tokenResp.access_token;
    localStorage.setItem('spotify_access_token', accessToken);
    updateStatus('Đã kết nối với Spotify');
    const profile = await fetchProfile(accessToken);
    updateStatus('Hello, ' + (profile.display_name || profile.id));
    // clean URL
    window.history.replaceState({}, document.title, REDIRECT_URI);
  } catch (err) {
    console.error(err);
    updateStatus('Không thể trao đổi token — cần server-side nếu bị chặn CORS.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('spotify-connect-btn');
  if (btn) btn.addEventListener('click', redirectToSpotify);
  const token = localStorage.getItem('spotify_access_token');
  if (token) {
    fetchProfile(token).then(p => updateStatus('Hello, ' + (p.display_name || p.id))).catch(()=>updateStatus('Kết nối (token) có vẻ hết hạn'));
  }
  handleRedirect();
});
