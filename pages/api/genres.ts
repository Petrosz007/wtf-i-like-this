import type { NextApiRequest, NextApiResponse } from 'next';
import { GenreResponse } from '../../models/apiResponses';
import { genresFromTrackId } from '../../util/api/spotify';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const url = req.query.url as string;

  const genres = await genresFromTrackId(url);
  const responseData: GenreResponse = { genres };

  res.status(200).json(responseData);
};
