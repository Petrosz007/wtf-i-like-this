mod spotify;
mod url_parser;

use std::sync::Arc;

use axum::{
    debug_handler,
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use config::Config;
use serde::{Deserialize, Serialize};
use spotify::{MySpotifyError, SpotifyClient};
use tower_http::trace::{self, TraceLayer};
use tracing::Level;
use url_parser::{parse_url, UrlParseResult};

struct AppState {
    spotify_client: SpotifyClient,
}

#[derive(Deserialize)]
struct GenresParams {
    url: String,
}

#[derive(Serialize)]
struct GenresResponse {
    genres: Vec<String>,
}

async fn genres(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GenresParams>,
) -> Result<Json<GenresResponse>, MySpotifyError> {
    let parsed_url = parse_url(&params.url);

    match parsed_url {
        UrlParseResult::SpotifyTrackId(track_id) => {
            let genres = state.spotify_client.genres_from_track_id(track_id).await?;

            Ok(Json(GenresResponse { genres }))
        }
        _ => Err(MySpotifyError::Unknown),
    }
}

#[derive(Deserialize)]
struct PlaylistGenresParams {
    url: String,
}

#[derive(Serialize)]
pub struct GenreCount {
    genre: String,
    count: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaylistGenresResponse {
    genres: Vec<String>,
    genre_counts: Vec<GenreCount>,
}

#[debug_handler]
async fn playlist_genres(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PlaylistGenresParams>,
) -> Result<Json<PlaylistGenresResponse>, MySpotifyError> {
    let parsed_url = parse_url(&params.url);

    match parsed_url {
        UrlParseResult::SpotifyPlaylistId(playlist_id) => {
            let genre_counts = state
                .spotify_client
                .genres_from_playlist_id(playlist_id)
                .await?;

            Ok(Json(PlaylistGenresResponse {
                genres: genre_counts.iter().map(|x| x.genre.clone()).collect(),
                genre_counts,
            }))
        }
        _ => Err(MySpotifyError::Unknown), // TODO: This should be a good error
    }
}

#[tokio::main]
async fn main() {
    let config = Config::builder()
        // Add in `./Settings.toml`
        .add_source(config::File::with_name("Config.toml"))
        // Add in settings from the environment (with a prefix of APP)
        // Eg.. `APP_DEBUG=1 ./target/app` would set the `debug` key
        .add_source(config::Environment::with_prefix("APP"))
        .build()
        .unwrap();

    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .compact()
        .init();

    let spotify_client = SpotifyClient::new(
        &config.get_string("spotify.client_id").unwrap(),
        &config.get_string("spotify.client_secret").unwrap(),
    )
    .await;

    let shared_state = Arc::new(AppState { spotify_client });

    // build our application with a single route
    let app = Router::new()
        .route("/api/genres", get(genres))
        .route("/api/playlistGenres", get(playlist_genres))
        .with_state(shared_state)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        );

    // run it with hyper on localhost:3000
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

impl IntoResponse for MySpotifyError {
    fn into_response(self) -> axum::response::Response {
        match self {
            MySpotifyError::IdError(id_err) => {
                (StatusCode::BAD_REQUEST, format!("Invalid Id: {}", id_err)).into_response()
            }
            MySpotifyError::ClientError(err) => {
                tracing::error!("Client error happened: {}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_owned(),
                )
                    .into_response()
            }
            MySpotifyError::Unknown => {
                tracing::error!("Ran unto an unknown error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_owned(),
                )
                    .into_response()
            }
        }
    }
}
