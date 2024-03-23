package main

import (
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"wtf.andipeter.me/internal"
	internalSpotify "wtf.andipeter.me/internal/spotify"
)

func main() {
	ctx := context.Background()
	deps := &internal.CoreDeps{
		SpotifyClientDeps: internalSpotify.New(ctx, os.Getenv("SPOTIFY_ID"), os.Getenv("SPOTIFY_SECRET")),
	}
	r := gin.Default()

	r.GET("/api/genres", func(c *gin.Context) {
		url := c.Query("url")
		if url == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "No 'url' query parameter",
			})
			return
		}

		genres, err := deps.GetGenres(url)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"genres": genres,
		})
	})
	r.Run()
}
