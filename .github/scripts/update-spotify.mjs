import { writeFileSync, mkdirSync } from 'fs';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

// Refresh access token
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: SPOTIFY_REFRESH_TOKEN,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET,
  }),
});
const { access_token } = await tokenRes.json();

const mapTrack = (t) => ({
  id: t.id,
  name: t.name,
  artists: t.artists.map((a) => a.name).join(', '),
  image: t.album.images[1]?.url ?? t.album.images[0]?.url,
});

// Top tracks long_term
const topRes = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5', {
  headers: { Authorization: `Bearer ${access_token}` },
});
const { items: topItems } = await topRes.json();
const tracks = topItems.map(mapTrack);

mkdirSync('public', { recursive: true });
writeFileSync('public/spotify-top.json', JSON.stringify(tracks, null, 2));
console.log(`Updated ${tracks.length} top tracks.`);

// Recently played
const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
  headers: { Authorization: `Bearer ${access_token}` },
});
const { items: recentItems } = await recentRes.json();

const seen = new Set();
const recent = [];
for (const { track } of recentItems) {
  if (!seen.has(track.id)) {
    seen.add(track.id);
    recent.push(mapTrack(track));
  }
}

writeFileSync('public/spotify-recent.json', JSON.stringify(recent, null, 2));
console.log(`Updated ${recent.length} recent tracks.`);
