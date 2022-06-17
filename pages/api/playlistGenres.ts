import type { NextApiRequest, NextApiResponse } from 'next';
import { PlaylistGenreResponse } from '../../models/apiResponses';
import Config from '../../util/api/config';
import Spotify, { SpotifyError } from '../../util/api/spotify';
import { getPlaylistIdFromURL } from '../../util/parser';

const spotify = new Spotify(new Config());

async function getPlaylistGenres(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;

  const playlistId = getPlaylistIdFromURL(url);

  if (playlistId === null) {
    res.status(400).json({
      message: "Bad URL format, can't parse playlist id from this url!",
    });
    return;
  }

  try {
    const genres = await spotify.genresFromPlaylistId(playlistId);
    const responseData: PlaylistGenreResponse = {
      genres: [...genres].map((x) => x.genre),
      genreCounts: genres,
    };

    res.status(200).json(responseData);
    return;
  } catch (err) {
    if (err instanceof SpotifyError) {
      res.status(400).json({ message: err.message });
      return;
    }
    throw err;
  }
}

export default getPlaylistGenres;
