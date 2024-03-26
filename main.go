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

		genres, genreCounts, err := deps.GetGenres(url)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		res := gin.H{
			"genres": genres,
		}
		if len(genreCounts) > 0 {
			res["genreCounts"] = genreCounts
		}

		if c.Request.Header.Get("Accept") == "text/html" {
			c.HTML(http.StatusOK, "genres.html", res)
		} else {
			c.JSON(http.StatusOK, res)
		}
	})

	// TODO: Embed the files: https://pkg.go.dev/embed
	r.Static("/static", "web/static")
	r.LoadHTMLGlob("web/templates/*")
	r.GET("/index.html", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{})
	})
	r.Run()
}
