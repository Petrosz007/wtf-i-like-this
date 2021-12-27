import type { NextApiRequest, NextApiResponse } from 'next';
import { GenreResponse } from '../../models/apiResponses';
import { genresFromTrackId } from '../../util/api/spotify';
import { getTrackIdFromURL } from '../../util/parser';

async function getGenres(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;

  const trackId = getTrackIdFromURL(url);
  const genres = await genresFromTrackId(trackId);
  const responseData: GenreResponse = { genres };

  res.status(200).json(responseData);
}

export default getGenres;
