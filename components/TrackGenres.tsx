import styles from './TrackGenres.module.scss';

const TrackGenres = ({ genres }: { genres: string[] }) => {
  if (genres.length === 0) {
    return <i>No genres found for this song :C</i>;
  }
  return (
    <>
      {genres.map((genre) => (
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
      ))}
    </>
  );
};

export default TrackGenres;
