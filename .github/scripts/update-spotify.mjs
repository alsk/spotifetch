import { writeFileSync, mkdirSync } from 'fs';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

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

// Fetch top tracks
const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5', {
  headers: { Authorization: `Bearer ${access_token}` },
});
const { items } = await tracksRes.json();
const tracks = items.map((t) => ({
  id: t.id,
  name: t.name,
  artists: t.artists.map((a) => a.name).join(', '),
  image: t.album.images[1]?.url ?? t.album.images[0]?.url,
}));

mkdirSync('public', { recursive: true });
writeFileSync('public/spotify-top.json', JSON.stringify(tracks, null, 2));
console.log(`Updated ${tracks.length} top tracks.`);

// Test reco endpoint
try {
  const seedIds = tracks.map((t) => t.id).join(',');
  const recoRes = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${seedIds}&limit=20`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  console.log('Reco status:', recoRes.status);
  console.log('Reco headers:', Object.fromEntries(recoRes.headers.entries()));
  const recoText = await recoRes.text();
  console.log('Reco body length:', recoText.length);
  console.log('Reco body:', recoText.slice(0, 500));
} catch (err) {
  console.error('Reco fetch error:', err.message);
}
