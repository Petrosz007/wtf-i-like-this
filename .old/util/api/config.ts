export default class Config {
  public clientId: string;
  public clientSecret: string;

  constructor() {
    if (process.env.SPOTIFY_CLIENT_ID === undefined) {
      throw new Error(
        'SPOTIFY_CLIENT_ID is undefined! Make sure that you have included it in your .env.local file!',
      );
    }

    if (process.env.SPOTIFY_CLIENT_SECRET === undefined) {
      throw new Error(
        'SPOTIFY_CLIENT_SECRET is undefined! Make sure that you have included it in your .env.local file!',
      );
    }

    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  }
}
