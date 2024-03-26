package internal

import (
	"fmt"
	"log"
	"sort"

	internalSpotify "wtf.andipeter.me/internal/spotify"
	"wtf.andipeter.me/internal/url_parser"
)

type CoreDeps struct {
	*internalSpotify.SpotifyClientDeps
}

func (deps *CoreDeps) handleGenreGetting(urlType url_parser.UrlType, id string) ([]string, map[string]int, error) {
	switch urlType {
	case url_parser.SpotifyTrackId:
		genres, err := deps.GenresFromTrackId(id)
		return genres, map[string]int{}, err

	case url_parser.SpotifyShortlink:
		url, err := deps.ResolveShortlink(id)
		if err != nil {
			return []string{}, map[string]int{}, err
		}
		log.Printf("Resolved spotify shortlink to %q", url)
		return deps.GetGenres(url)

	case url_parser.SpotifyPlaylistId:
		genreCounts, err := deps.GenresFromPlaylistId(id)
		if err != nil {
			return []string{}, map[string]int{}, err
		}

		genres := make([]string, len(genreCounts))
		i := 0
		for key := range genreCounts {
			genres[i] = key
			i++
		}
		sort.Slice(genres, func(i, j int) bool { return genreCounts[genres[i]] > genreCounts[genres[j]] })

		return genres, genreCounts, nil

	default:
		return []string{}, map[string]int{}, fmt.Errorf("genre getting not implemented for type %q yet", urlType)
	}
}

func (deps *CoreDeps) GetGenres(url string) ([]string, map[string]int, error) {
	log.Printf("In core for %q", url)
	urlType, id, err := url_parser.Parse(url)
	if err != nil {
		return []string{}, map[string]int{}, fmt.Errorf("can't parse url. It is either not supported, or it is mistyped")
	}

	return deps.handleGenreGetting(urlType, id)
}
