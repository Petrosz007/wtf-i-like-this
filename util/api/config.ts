const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (clientId === undefined) {
  throw new Error(
    'SPOTIFY_CLIENT_ID is undefined! Make sure that you have included it in your .env.local file!',
  );
}

if (clientSecret === undefined) {
  throw new Error(
    'SPOTIFY_CLIENT_SECRET is undefined! Make sure that you have included it in your .env.local file!',
  );
}
export default {
  clientId,
  clientSecret,
};
