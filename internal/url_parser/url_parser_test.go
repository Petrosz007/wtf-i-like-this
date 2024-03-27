package url_parser

import "testing"

func TestParse(t *testing.T) {
	var cases = []struct {
		url      string
		wantType UrlType
		wantId   string
		wantErr  bool
	}{
		{"https://open.spotify.com/playlist/3aH6s3vn4NKq3Hi3kUSz68?si=dd3bdff1b2ba4bd9", SpotifyPlaylistId, "3aH6s3vn4NKq3Hi3kUSz68", false},
		{"https://open.spotify.com/track/2tzt6biW79znRmQCLBSWhG?si=0388bad880ec4a60", SpotifyTrackId, "2tzt6biW79znRmQCLBSWhG", false},
		{"https://spotify.link/N2zPz9qjoDb", SpotifyShortlink, "N2zPz9qjoDb", false},
		{"https://spotify.app.link/N2zPz9qjoDb", SpotifyShortlink, "N2zPz9qjoDb", false},
		{"https://open.spotify.com/something_garbage/2tzt6biW79znRmQCLBSWhG?si=0388bad880ec4a60", 0, "", true},
	}

	for _, c := range cases {
		resType, resId, resErr := Parse(c.url)
		if resType != c.wantType || resId != c.wantId || (resErr != nil) != c.wantErr {
			t.Errorf("Parse(%q) == %q, %q, %v, want %q, %q, want error: %v", c.url, resType, resId, resErr, c.wantType, c.wantId, c.wantErr)
		}
	}
}
