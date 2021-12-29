import { useState } from 'react';
import {
  fetchOwnApiAsJson,
  OwnApiRequestError,
  useEffectAsync,
} from '../util/utils';
import styles from './index.module.scss';
import { GenreResponse } from '../models/apiResponses';
import { getTrackIdFromURL } from '../util/parser';

export default function Home() {
  const [url, setUrl] = useState('');
  const [genres, setGenres] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffectAsync(async () => {
    setGenres(undefined);
    setError(undefined);
    const canBeParsed = getTrackIdFromURL(url);

    if (canBeParsed !== null) {
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
        placeholder="Paste the Spotify URL of the track here..."
      />
      <br />
      <div className={styles.genres}>
        {error !== undefined && <i>{error}</i>}
        {genres !== undefined &&
          (genres.length === 0 ? (
            <i>No genres found for this song :C</i>
          ) : (
            genres.map((genre) => (
              <a
                key={genre}
                href={`https://everynoise.com/engenremap-${genre.replaceAll(
                  ' ',
                  '',
                )}.html`}
                target="_blank"
                rel="noreferrer"
              >
                {genre}
              </a>
            ))
          ))}
      </div>
    </div>
  );
}
