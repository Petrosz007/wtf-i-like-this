mod spotify;
mod url_parser;

use std::{
    error::Error,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::Arc,
};

use axum::{
    extract::{Query, State},
    http::{Method, StatusCode},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use config::Config;
use serde::{Deserialize, Serialize};
use spotify::{MySpotifyError, SpotifyClient};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{self, TraceLayer},
};
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
) -> Result<impl IntoResponse, MySpotifyError> {
    let mut parsed_url = parse_url(&params.url);

    // Resolve spotify shortlinks, and them parse them as usual
    if let UrlParseResult::SpotifyShortLink(url) = parsed_url {
        parsed_url = state.spotify_client.resolve_spotify_shortlink(url).await?;
    }

    match parsed_url {
        UrlParseResult::SpotifyTrackId(track_id) => {
            let genres = state.spotify_client.genres_from_track_id(track_id).await?;

            Ok(Json(GenresResponse { genres }).into_response())
        }
        UrlParseResult::SpotifyPlaylistId(playlist_id) => {
            let genre_counts = state
                .spotify_client
                .genres_from_playlist_id(playlist_id)
                .await?;

            Ok(Json(PlaylistGenresResponse {
                genres: genre_counts.iter().map(|x| x.genre.clone()).collect(),
                genre_counts,
            })
            .into_response())
        }
        _ => Err(MySpotifyError::Unknown),
    }
}

async fn live() -> impl IntoResponse {
    StatusCode::OK
}

/// The app can't function without a connection to the Spotify API. Therefore, if there is something wrong with the connection
/// we intentionally fail the readiness check.
async fn ready(State(state): State<Arc<AppState>>) -> Result<impl IntoResponse, MySpotifyError> {
    state.spotify_client.check_readiness().await?;

    Ok(StatusCode::OK)
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::builder()
        // Add in `./Config.toml`
        .add_source(config::File::with_name("Config.toml").required(false))
        // Add in settings from the environment (with a prefix of APP)
        // Eg.. `APP__app__port=3101 cargo run` would set the `app.port` key
        .add_source(config::Environment::with_prefix("APP").separator("__"))
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
        .route("/live", get(live))
        .route("/ready", get(ready))
        .with_state(shared_state)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(
            CorsLayer::new()
                .allow_methods([Method::GET, Method::POST])
                .allow_origin(Any),
        );

    let socket_addr = SocketAddr::new(
        IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)),
        config.get_int("app.port")? as u16,
    );
    tracing::info!("Starting the server on {socket_addr}");

    Ok(axum::Server::bind(&socket_addr)
        .serve(app.into_make_service())
        .await?)
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
            MySpotifyError::HttpError(err) => {
                tracing::error!("Http error happened: {}", err);
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
