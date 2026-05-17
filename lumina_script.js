/* Lumina Music Pure - Professional JavaScript */

// Sample Data
const SONGS = [
    { id: 1, title: 'Midnight City', artist: 'M83', art: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop' },
    { id: 2, title: 'Starboy', artist: 'The Weeknd', art: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', art: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300&auto=format&fit=crop' },
    { id: 4, title: 'Blinding Lights', artist: 'The Weeknd', art: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=300&auto=format&fit=crop' },
    { id: 5, title: 'After Hours', artist: 'The Weeknd', art: 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?q=80&w=300&auto=format&fit=crop' },
    { id: 6, title: 'Evermore', artist: 'Taylor Swift', art: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop' },
    { id: 7, title: 'Positions', artist: 'Ariana Grande', art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop' },
    { id: 8, title: 'Watermelon Sugar', artist: 'Harry Styles', art: 'https://images.unsplash.com/photo-1502773831757-b441f71df996?q=80&w=300&auto=format&fit=crop' },
];

document.addEventListener('DOMContentLoaded', () => {
    const musicGrid = document.getElementById('music-grid');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = playPauseBtn.querySelector('i');
    
    let isPlaying = false;

    // Render Songs
    function renderSongs() {
        musicGrid.innerHTML = SONGS.map(song => `
            <div class="music-card fade-in" onclick="playSong(${song.id})">
                <img src="${song.art}" class="card-img" alt="${song.title}">
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist}</div>
            </div>
        `).join('');
    }

    // Play Song Handler
    window.playSong = (id) => {
        const song = SONGS.find(s => s.id === id);
        if (!song) return;

        // Update UI
        document.getElementById('track-art').src = song.art;
        document.getElementById('track-name').textContent = song.title;
        document.getElementById('artist-name').textContent = song.artist;
        
        isPlaying = true;
        updatePlayIcon();
    };

    // Toggle Play/Pause
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        updatePlayIcon();
    });

    function updatePlayIcon() {
        if (isPlaying) {
            playIcon.classList.remove('bi-play-fill');
            playIcon.classList.add('bi-pause-fill');
        } else {
            playIcon.classList.remove('bi-pause-fill');
            playIcon.classList.add('bi-play-fill');
        }
    }

    // Navigation Active State
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    renderSongs();
});
