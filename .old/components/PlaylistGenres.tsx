import { PlaylistGenreResponse } from '../models/apiResponses';

const PlaylistGenres = ({
  playlistGenres,
}: {
  playlistGenres: PlaylistGenreResponse;
}) => {
  return (
    <>
      {playlistGenres.genreCounts.map(({ genre, count }) => (
        <span key={genre}>
          <a
            href={`https://everynoise.com/engenremap-${genre.replaceAll(
              ' ',
              '',
            )}.html`}
            target="_blank"
            rel="noreferrer"
          >
            {genre}
          </a>
          &nbsp; {count}
        </span>
      ))}
    </>
  );
};

export default PlaylistGenres;
