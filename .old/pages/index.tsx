import { useState } from 'react';
import {
  fetchOwnApiAsJson,
  OwnApiRequestError,
  useEffectAsync,
} from '../util/utils';
import styles from './index.module.scss';
import { GenreResponse, PlaylistGenreResponse } from '../models/apiResponses';
import { getPlaylistIdFromURL, getTrackIdFromURL } from '../util/parser';
import TrackGenres from '../components/TrackGenres';
import PlaylistGenres from '../components/PlaylistGenres';

export default function Home() {
  const [url, setUrl] = useState('');
  const [genres, setGenres] = useState<string[] | undefined>(undefined);
  const [playlistGenres, setPlaylistGenres] = useState<
    PlaylistGenreResponse | undefined
  >(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffectAsync(async () => {
    setGenres(undefined);
    setPlaylistGenres(undefined);
    setError(undefined);
    const trackCanBeParsed = getTrackIdFromURL(url);

    if (trackCanBeParsed !== null) {
      try {
        const response = await fetchOwnApiAsJson<GenreResponse>(
          `/api/genres?url=${encodeURIComponent(url)}`,
        );

        setGenres(response.genres);
      } catch (err) {
        if (err instanceof OwnApiRequestError) {
          setError(`Error: ${err.message}`);
        }
      }

      return;
    }

    const playlistCanBeParsed = getPlaylistIdFromURL(url);

    if (playlistCanBeParsed !== null) {
      try {
        const response = await fetchOwnApiAsJson<PlaylistGenreResponse>(
          `/api/playlistGenres?url=${encodeURIComponent(url)}`,
        );

        setPlaylistGenres(response);
      } catch (err) {
        if (err instanceof OwnApiRequestError) {
          setError(`Error: ${err.message}`);
        }
      }

      return;
    }
  }, [url]);

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>
        <span className={styles.green}>WTF</span> I like this
      </h1>
      <h2 className={styles.subHeader}>
        ...what <span className={styles.pink}>genre</span> is this?
      </h2>
      <input
        type="text"
        className={styles.input}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="Paste the Spotify URL of the track or playlist here..."
      />
      <br />
      <div className={styles.genres}>
        {error !== undefined && <i>{error}</i>}
        {genres !== undefined && <TrackGenres genres={genres} />}
        {playlistGenres !== undefined && (
          <PlaylistGenres playlistGenres={playlistGenres} />
        )}
      </div>
    </div>
  );
}
