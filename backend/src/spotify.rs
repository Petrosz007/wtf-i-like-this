use futures::future::try_join_all;
use itertools::Itertools;
use rspotify::{
    model::{ArtistId, IdError, PlaylistId, TrackId},
    prelude::BaseClient,
    ClientCredsSpotify, ClientError, Config, Credentials,
};
use thiserror::Error;

use crate::GenreCount;

#[derive(Error, Debug)]
pub enum MySpotifyError {
    #[error("invalid spotify id")]
    IdError(#[from] IdError),
    #[error("client error")]
    ClientError(#[from] ClientError),
    #[error("unknown error")]
    Unknown,
}

#[derive(Debug)]
pub struct SpotifyClient {
    spotify: ClientCredsSpotify,
}

impl SpotifyClient {
    pub async fn new(client_id: &str, client_secret: &str) -> SpotifyClient {
        let creds = Credentials::new(client_id, client_secret);
        let config = Config {
            token_refreshing: true,
            ..Default::default()
        };

        let spotify = ClientCredsSpotify::with_config(creds, config);

        spotify.request_token().await.unwrap();

        SpotifyClient { spotify }
    }

    /// Checks the readiness of the Spotify connection. If it returns Err there is an issue.
    pub async fn check_readiness(&self) -> Result<(), MySpotifyError> {
        self.spotify.refetch_token().await?;

        Ok(())
    }

    pub async fn genres_from_artist_id(
        &self,
        artist_id: ArtistId<'_>,
    ) -> Result<Vec<String>, MySpotifyError> {
        let artist = self.spotify.artist(artist_id).await?;

        Ok(artist.genres)
    }

    pub async fn genres_from_track_id(
        &self,
        track_id: TrackId<'_>,
    ) -> Result<Vec<String>, MySpotifyError> {
        let artist_id = self.spotify.track(track_id).await?.artists[0]
            .id
            .clone()
            .expect("Artist should have id");

        self.genres_from_artist_id(artist_id).await
    }

    pub async fn genres_from_playlist_id(
        &self,
        playlist_id: PlaylistId<'_>,
    ) -> Result<Vec<GenreCount>, MySpotifyError> {
        let playlist = self.spotify.playlist(playlist_id, None, None).await?;
        let tracks = playlist
            .tracks
            .items
            .iter()
            .flat_map(|x| {
                let playable_item = x.track.clone().expect("Track should be there");

                match playable_item {
                    rspotify::model::PlayableItem::Track(track) => {
                        Some(track.id.clone().expect("Artost should have an ID"))
                    }
                    rspotify::model::PlayableItem::Episode(_) => None,
                    // rspotify::prelude::PlayableId::Track(track_id) => Some(track_id.to_string()),
                    // rspotify::prelude::PlayableId::Episode(_) => None,
                }
            })
            .collect::<Vec<_>>();

        let genres = try_join_all(
            tracks
                .into_iter()
                .map(|track_id| async move { self.genres_from_track_id(track_id).await }),
        )
        .await?
        .into_iter()
        .flatten()
        .collect::<Vec<_>>();

        let genre_counts = genres
            .into_iter()
            .into_group_map_by(|x| x.clone())
            .into_iter()
            .map(|(k, v)| GenreCount {
                genre: k,
                count: v.len() as u32,
            })
            .sorted_by_key(|x| x.count)
            .rev()
            .collect::<Vec<_>>();

        Ok(genre_counts)
    }
}
