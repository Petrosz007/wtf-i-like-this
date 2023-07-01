export type GenreResponse = {
    genres: string[];
    genreCounts?: {
        genre: string;
        count: number;
    }[];
};
