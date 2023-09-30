use once_cell::sync::Lazy;
use regex::Regex;
use reqwest::Url;
use rspotify::model::{PlaylistId, TrackId};

#[derive(Debug, PartialEq)]
pub enum UrlParseResult<'a> {
    SpotifyTrackId(TrackId<'a>),
    SpotifyPlaylistId(PlaylistId<'a>),
    SpotifyShortLink(Url),
    ParseError,
}

use UrlParseResult::*;

static SPOTIFY_TRACK_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new("/track/([a-zA-Z0-9]*)").unwrap());
static SPOTIFY_PLAYLIST_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new("/playlist/([a-zA-Z0-9]*)").unwrap());
static SPOTIFY_SHORT_LINK_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new("https://spotify.link/([a-zA-Z0-9]*)").unwrap());

#[tracing::instrument]
pub fn parse_url<'a, 'b>(url: &'a str) -> UrlParseResult<'b> {
    if let Some(captures) = SPOTIFY_TRACK_REGEX.captures(url) {
        let track_id = captures.get(1).unwrap().as_str().to_owned();
        match TrackId::from_id(track_id) {
            Ok(track_id) => SpotifyTrackId(track_id),
            Err(_) => ParseError,
        }
    } else if let Some(captures) = SPOTIFY_PLAYLIST_REGEX.captures(url) {
        let playlist_id = captures.get(1).unwrap().as_str().to_owned();
        match PlaylistId::from_id(playlist_id) {
            Ok(playlist_id) => SpotifyPlaylistId(playlist_id),
            Err(_) => ParseError,
        }
    } else if SPOTIFY_SHORT_LINK_REGEX.is_match(url) {
        match Url::parse(url) {
            Ok(url) => SpotifyShortLink(url),
            Err(_) => ParseError,
        }
    } else {
        UrlParseResult::ParseError
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case("https://open.spotify.com/playlist/3aH6s3vn4NKq3Hi3kUSz68?si=dd3bdff1b2ba4bd9", SpotifyPlaylistId(PlaylistId::from_id("3aH6s3vn4NKq3Hi3kUSz68").unwrap()))]
    #[case("https://open.spotify.com/track/2tzt6biW79znRmQCLBSWhG?si=0388bad880ec4a60", SpotifyTrackId(TrackId::from_id("2tzt6biW79znRmQCLBSWhG").unwrap()))]
    #[case("https://spotify.link/N2zPz9qjoDb", SpotifyShortLink(Url::parse("https://spotify.link/N2zPz9qjoDb").unwrap()))]
    #[case(
        "https://open.spotify.com/something_garbage/2tzt6biW79znRmQCLBSWhG?si=0388bad880ec4a60",
        ParseError
    )]
    fn test_parse_url(#[case] input: &str, #[case] expected: UrlParseResult) {
        assert_eq!(expected, parse_url(input))
    }
}
