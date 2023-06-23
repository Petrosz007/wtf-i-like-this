import SpotifyWebApi from 'spotify-web-api-node';
import { fetchAsJson } from '../utils';
import Config from './config';

interface SpotifyRefreshAccessTokenResult {
  access_token: string;
  expires_in: number;
}

interface SpotifyInitialAccessTokenResult
  extends SpotifyRefreshAccessTokenResult {
  refresh_token: string;
}

const bearerHeaders = (clientId: string, clientSecret: string) =>
  'Basic ' +
  Buffer.from(clientId + ':' + clientSecret, 'utf8').toString('base64');

export class SpotifyError extends Error {
  constructor(message: string) {
    super(message);
  }
}

interface SpotifyWebApiError {
  body: {
    error: {
      status: number;
      message: string;
    };
  };
}

function isSpotifyWebApiError(obj: any): obj is SpotifyWebApiError {
  return (
    'body' in obj && 'error' in obj['body'] && 'status' in obj['body']['error']
  );
}

export default class Spotify {
  private config: Config;
  private spotifyApi: SpotifyWebApi;
  private expiresAt: number = Date.now();
  private refreshToken: string | undefined;

  constructor(config: Config) {
    this.config = config;

    this.spotifyApi = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: 'https://andipeter.me',
    });
  }

  private spotifyPost = async <T>(params: string[][]): Promise<T> =>
    await fetchAsJson<T>('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: new URLSearchParams(params),
      headers: {
        Authorization: bearerHeaders(
          this.config.clientId,
          this.config.clientSecret,
        ),
      },
    });

  private async getInitialAccessToken(): Promise<string> {
    const data = await this.spotifyPost<SpotifyInitialAccessTokenResult>([
      ['grant_type', 'client_credentials'],
    ]);

    this.expiresAt = Date.now() + data.expires_in * 1000; // Date.now() is in milliseconds, expires_in is in seconds
    this.refreshToken = data.refresh_token;

    return data.access_token;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshToken === undefined) {
      throw new Error(
        'Cannot refresh spotify access token, you have to request an access token first!',
      );
    }

    const data = await this.spotifyPost<SpotifyRefreshAccessTokenResult>([
      ['grant_type', 'refresh_token'],
      ['refresh_token', this.refreshToken],
    ]);

    this.expiresAt = Date.now() + data.expires_in * 1000; // Date.now() is in milliseconds, expires_in is in seconds

    return data.access_token;
  }

  private async ensureSpotifyAccessToken() {
    if (this.expiresAt > Date.now()) return;

    const token =
      this.refreshToken === undefined
        ? await this.getInitialAccessToken()
        : await this.refreshAccessToken();

    this.spotifyApi.setAccessToken(token);

    // TODO: Structured logging
    // https://nextjs.org/docs/going-to-production#logging
    console.log(
      `Spotify API initialized! Expires at ${new Date(
        this.expiresAt,
      ).toUTCString()}`,
    );
  }

  async genresFromArtistId(artistId: string): Promise<string[]> {
    await this.ensureSpotifyAccessToken();

    try {
      const genres = (await this.spotifyApi.getArtist(artistId)).body.genres;

      return genres;
    } catch (err) {
      if (isSpotifyWebApiError(err)) {
        if (err.body.error.status === 400) {
          throw new SpotifyError(err.body.error.message);
        }
      }

      throw err;
    }
  }

  async genresFromTrackId(trackId: string): Promise<string[]> {
    await this.ensureSpotifyAccessToken();

    try {
      const track = await this.spotifyApi.getTrack(trackId);
      const artistId = track.body.artists[0].id;
      const genres = await this.genresFromArtistId(artistId);

      return genres;
    } catch (err) {
      if (isSpotifyWebApiError(err)) {
        if (err.body.error.status === 400) {
          throw new SpotifyError(err.body.error.message);
        }
      }

      throw err;
    }
  }

  async genresFromPlaylistId(
    playlistId: string,
  ): Promise<{ genre: string; count: number }[]> {
    await this.ensureSpotifyAccessToken();

    try {
      const playlist = await this.spotifyApi.getPlaylist(playlistId);

      const tracks = playlist.body.tracks.items;
      const artistUniqueIds = [
        ...new Set(tracks.flatMap((track) => track.track.artists[0].id)),
      ];

      const genres = (
        await Promise.all(
          artistUniqueIds.map((artistId) =>
            this.genresFromArtistId(artistId).then((x) =>
              x.length === 0 ? ['no genres found'] : x,
            ),
          ),
        )
      ).flat();

      const genreCounts = new Map<string, number>();
      genres.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      });
      return [...genreCounts]
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      if (isSpotifyWebApiError(err)) {
        if (err.body.error.status === 400) {
          throw new SpotifyError(err.body.error.message);
        }
      }

      throw err;
    }
  }
}
