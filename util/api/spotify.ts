import SpotifyWebApi from 'spotify-web-api-node';
import Config from './config';

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: params,
    headers: {
      Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret),
    },
  });

  if (!response.ok)
    throw new Error(
      `Cannot get access token from the spotify api! ${response.statusText}`,
    );
  var data = (await response.json()) as { access_token: string };

  return data.access_token;
}

export async function initSpotifyApi() {
  const clientId = Config.clientId;
  const clientSecret = Config.clientSecret;

  const spotifyApi = new SpotifyWebApi({
    clientId,
    clientSecret,
    redirectUri: 'https://andipeter.me',
  });

  const token = await getAccessToken(clientId, clientSecret);
  spotifyApi.setAccessToken(token);

  // TODO: Structured logging
  // https://nextjs.org/docs/going-to-production#logging
  console.log('Spotify API initialized!');

  return spotifyApi;
}

const SpotifyApi = await initSpotifyApi();

export async function genresFromTrackId(trackId: string) {
  const track = await SpotifyApi.getTrack(trackId);
  const artistId = track.body.artists[0].id;
  const genres = (await SpotifyApi.getArtist(artistId)).body.genres;

  return genres;
}
