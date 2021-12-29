import type { NextApiRequest, NextApiResponse } from 'next';
import { GenreResponse } from '../../models/apiResponses';
import Config from '../../util/api/config';
import Spotify, { SpotifyError } from '../../util/api/spotify';
import { getTrackIdFromURL } from '../../util/parser';

const spotify = new Spotify(new Config());

async function getGenres(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;

  const trackId = getTrackIdFromURL(url);

  if (trackId === null) {
    res
      .status(400)
      .json({ message: "Bad URL format, can't parse track id from this url!" });
    return;
  }

  try {
    const genres = await spotify.genresFromTrackId(trackId);
    const responseData: GenreResponse = { genres };

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

export default getGenres;
