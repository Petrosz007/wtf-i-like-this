export type GenreResponse = {
  genres: string[];
};

export type PlaylistGenreResponse = {
  genres: string[];
  genreCounts: {
    genre: string;
    count: number;
  }[];
};
