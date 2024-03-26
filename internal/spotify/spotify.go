package spotify

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
)

type SpotifyClientDeps struct {
	ctx               context.Context
	spotifyClient     *spotify.Client
	urlResolverClient *http.Client
}

func newSpotifyClient(ctx context.Context, clientId string, clientSecret string) *spotify.Client {
	config := &clientcredentials.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		TokenURL:     spotifyauth.TokenURL,
	}
	token, err := config.Token(ctx)
	if err != nil {
		log.Fatal("Couldn't get Spotify Auth Token: &v", err)
	}

	httpClient := spotifyauth.New().Client(ctx, token)
	client := spotify.New(httpClient)

	return client
}

func New(ctx context.Context, clientId string, clientSecret string) *SpotifyClientDeps {
	return &SpotifyClientDeps{
		ctx:               ctx,
		spotifyClient:     newSpotifyClient(ctx, clientId, clientSecret),
		urlResolverClient: http.DefaultClient,
	}
}

func (deps *SpotifyClientDeps) ResolveShortlink(id string) (string, error) {
	url := "https://spotify.link/" + id
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return "", err
	}
	// Without the curl user agent the final redirect to the actual spotify url happens with a javascript call in the returned HTML
	req.Header.Add("User-Agent", "curl/8.4.0")

	res, err := deps.urlResolverClient.Do(req)
	if err != nil {
		return "", err
	}

	resolvedUrl := res.Request.URL.String()
	if resolvedUrl == "" {
		return "", fmt.Errorf("failed to resolve spotify shortlink %q, the resolution didn't respond with a Location header", url)
	}

	return resolvedUrl, nil
}

func (deps *SpotifyClientDeps) GenresFromArtistId(artistId string) ([]string, error) {
	artist, err := deps.spotifyClient.GetArtist(deps.ctx, spotify.ID(artistId))
	if err != nil {
		return []string{}, err
	}

	return artist.Genres, nil
}

func (deps *SpotifyClientDeps) GenresFromTrackId(trackId string) ([]string, error) {
	track, err := deps.spotifyClient.GetTrack(deps.ctx, spotify.ID(trackId))
	if err != nil {
		return []string{}, err
	}

	return deps.GenresFromArtistId(string(track.Artists[0].ID))
}

func (deps *SpotifyClientDeps) GenresFromPlaylistId(playlistId string) (map[string]int, error) {
	playlist, err := deps.spotifyClient.GetPlaylistItems(deps.ctx, spotify.ID(playlistId))
	if err != nil {
		return map[string]int{}, nil
	}

	ch := make(chan []string)
	var wg sync.WaitGroup
	for _, track := range playlist.Items {
		wg.Add(1)
		go (func() {
			defer wg.Done()

			genres, err := deps.GenresFromTrackId(track.Track.Track.ID.String())
			if err != nil {
				// ?: How do we handle errors in gorutines correctly?
				log.Printf("Error in playlist goroutine %v", err)
				return
			}
			ch <- genres
		})()
	}

	go (func() {
		wg.Wait()
		close(ch)
	})()

	genreCounts := make(map[string]int)
	for genres := range ch {
		for _, genre := range genres {
			genreCounts[genre]++
		}
	}

	return genreCounts, nil
}
