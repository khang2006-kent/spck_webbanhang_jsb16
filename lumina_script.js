/* Lumina Music Pure - Professional JavaScript */



const SPOTIFY_PLAYLIST_ID = '37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits (public playlist)

// Helper to call server token endpoint then Spotify Web API
async function fetchSpotify(path, params = {}) {
    const tokenResp = await fetch('http://localhost:3002/token').then(r => r.json());
    if (!tokenResp || !tokenResp.access_token) throw new Error('No access token returned from server');
    const token = tokenResp.access_token;
    const url = new URL(`https://api.spotify.com/v1/${path}`);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Spotify API error: ${res.status} ${text}`);
    }
    return res.json();
}

document.addEventListener('DOMContentLoaded', () => {
    const musicGrid = document.getElementById('music-grid');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = playPauseBtn.querySelector('i');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const progressBg = document.getElementById('progress-bg');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeFill = document.getElementById('volume-fill');

    let tracks = [...SONGS];
    let currentIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0 none, 1 one, 2 all

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';

    function secondsToTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    async function loadSpotifyTracks() {
        try {
            const resp = await fetch(`http://localhost:3002/api/playlist?id=${encodeURIComponent(SPOTIFY_PLAYLIST_ID)}&limit=20`);
            const data = await resp.json();
            const items = data.items || [];
            if (items.length) tracks = items;
        } catch (err) {
            console.warn('Server playlist fetch failed, falling back to local songs', err);
        }
        renderSongs();
        loadTrack(0);
    }

    function renderSongs() {
        musicGrid.innerHTML = tracks.map((song, i) => `
            <div class="music-card fade-in" data-index="${i}">
                <img src="${song.art}" class="card-img" alt="${song.title}">
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist}</div>
            </div>
        `).join('');

        // attach click handlers
        document.querySelectorAll('.music-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = Number(card.getAttribute('data-index'));
                playIndex(idx);
            });
        });
    }

    window.playSong = function(id) {
        const idx = tracks.findIndex(t => t.id == id || t.id === 's'+id);
        if (idx >= 0) playIndex(idx);
    }

    function loadTrack(index) {
        if (!tracks[index]) return;
        currentIndex = index;
        const track = tracks[index];
        document.getElementById('track-art').src = track.art || '';
        document.getElementById('track-name').textContent = track.title || '';
        document.getElementById('artist-name').textContent = track.artist || '';
        audio.src = track.preview || '';
        audio.load();
        audio.volume = 0.8;
        updateProgress(0, 0);
    }

    function playIndex(index) {
        loadTrack(index);
        audio.play().then(()=>{
            isPlaying = true; updatePlayIcon();
        }).catch(err=>{
            console.warn('Play failed', err);
        });
    }

    function togglePlayPause() {
        if (audio.paused) {
            audio.play();
            isPlaying = true;
        } else {
            audio.pause();
            isPlaying = false;
        }
        updatePlayIcon();
    }

    function updatePlayIcon() {
        if (isPlaying && !audio.paused) {
            playIcon.classList.remove('bi-play-fill');
            playIcon.classList.add('bi-pause-fill');
        } else {
            playIcon.classList.remove('bi-pause-fill');
            playIcon.classList.add('bi-play-fill');
        }
    }

    prevBtn.addEventListener('click', () => {
        if (isShuffle) {
            playIndex(Math.floor(Math.random()*tracks.length));
            return;
        }
        const idx = (currentIndex - 1 + tracks.length) % tracks.length;
        playIndex(idx);
    });

    nextBtn.addEventListener('click', () => {
        if (isShuffle) {
            playIndex(Math.floor(Math.random()*tracks.length));
            return;
        }
        const idx = (currentIndex + 1) % tracks.length;
        playIndex(idx);
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        repeatBtn.classList.toggle('active', repeatMode !== 0);
    });

    playPauseBtn.addEventListener('click', togglePlayPause);

    audio.addEventListener('timeupdate', () => {
        updateProgress(audio.currentTime, audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (repeatMode === 1) {
            // repeat one
            audio.currentTime = 0; audio.play();
            return;
        }
        if (isShuffle) {
            playIndex(Math.floor(Math.random()*tracks.length));
            return;
        }
        const nextIdx = currentIndex + 1;
        if (nextIdx < tracks.length) playIndex(nextIdx);
        else if (repeatMode === 2) playIndex(0);
        else { isPlaying = false; updatePlayIcon(); }
    });

    function updateProgress(current, duration) {
        const pct = duration ? (current / duration) * 100 : 0;
        progressFill.style.width = pct + '%';
        currentTimeEl.textContent = secondsToTime(current);
        durationEl.textContent = secondsToTime(duration);
    }

    progressBg.addEventListener('click', (e) => {
        const rect = progressBg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        if (audio.duration) audio.currentTime = pct * audio.duration;
    });

    // volume slider
    function setVolumeFromEvent(e) {
        const rect = volumeSlider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let pct = Math.max(0, Math.min(1, x / rect.width));
        audio.volume = pct;
        volumeFill.style.width = (pct*100) + '%';
        volumeIcon.classList.toggle('muted', audio.volume === 0);
    }
    volumeSlider.addEventListener('click', setVolumeFromEvent);

    // nav link behavior: show content per section
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const text = link.textContent.trim().toLowerCase();
            const main = document.querySelector('.main-content');
            if (text.includes('trang chủ') || text.includes('home')) {
                // reload grid view
                main.innerHTML = `...`;
                // re-rendering the page fully is expensive; instead reload location
                window.location.reload();
            } else if (text.includes('khám phá') || text.includes('explore')) {
                main.querySelector('section')?.scrollIntoView();
            } else if (text.includes('thư viện')) {
                main.innerHTML = `<div style="padding:24px;color:rgba(255,255,255,0.8);">Thư viện của bạn trống.</div>`;
            }
        });
    });

    // initialize
    loadSpotifyTracks();
});

