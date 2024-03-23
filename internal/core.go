package internal

import (
	"fmt"
	"log"

	internalSpotify "wtf.andipeter.me/internal/spotify"
	"wtf.andipeter.me/internal/url_parser"
)

type CoreDeps struct {
	*internalSpotify.SpotifyClientDeps
}

func (deps *CoreDeps) handleGenreGetting(urlType url_parser.UrlType, id string) ([]string, error) {
	switch urlType {
	case url_parser.SpotifyTrackId:
		return deps.GenresFromTrackId(id)
	case url_parser.SpotifyShortlink:
		url, err := deps.ResolveShortlink(id)
		if err != nil {
			return []string{}, err
		}
		log.Printf("Resolved spotify shortlink to %q", url)
		return deps.GetGenres(url)
	default:
		return []string{}, fmt.Errorf("genre getting not implemented for type %q yet", urlType)
	}
}

func (deps *CoreDeps) GetGenres(url string) ([]string, error) {
	log.Printf("In core for %q", url)
	urlType, id, err := url_parser.Parse(url)
	if err != nil {
		return []string{}, fmt.Errorf("can't parse url. It is either not supported, or it is mistyped")
	}

	return deps.handleGenreGetting(urlType, id)
}
