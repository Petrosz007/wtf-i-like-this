package url_parser

import (
	"fmt"
	"regexp"
)

type UrlType int

const (
	SpotifyTrackId UrlType = iota
	SpotifyPlaylistId
	SpotifyShortlink
)

var (
	SpotifyTrackRegex     = regexp.MustCompile(`/track/([a-zA-Z0-9]*)`)
	SpotifyPlaylistRegex  = regexp.MustCompile(`/playlist/([a-zA-Z0-9]*)`)
	SpotifyShortlinkRegex = regexp.MustCompile(`https://spotify(.app)?.link/([a-zA-Z0-9]*)`)
)

func Parse(url string) (UrlType, string, error) {
	if match := SpotifyTrackRegex.FindStringSubmatch(url); match != nil {
		return SpotifyTrackId, match[1], nil
	}
	if match := SpotifyPlaylistRegex.FindStringSubmatch(url); match != nil {
		return SpotifyPlaylistId, match[1], nil
	}
	if match := SpotifyShortlinkRegex.FindStringSubmatch(url); match != nil {
		return SpotifyShortlink, match[2], nil
	}

	// ?: What is the idiomatic way to return alues here?
	return 0, "", fmt.Errorf("can't parse URL: %q", url)
}

func (u UrlType) String() string {
	switch u {
	case SpotifyTrackId:
		return "SpotifyTrackId"
	case SpotifyPlaylistId:
		return "SpotifyPlaylistId"
	case SpotifyShortlink:
		return "SpotifyShortlink"
	}
	return "unknown"
}
