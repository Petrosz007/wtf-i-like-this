FROM rust:1.70.0 as builder

# Installing the dependencies
# cargo can't install dependencies only, we need a dummy project to build: https://github.com/rust-lang/cargo/issues/2644
WORKDIR /app-build

COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock

RUN mkdir src && touch src/lib.rs
RUN cargo build --release
RUN rm src/lib.rs

# Building the project
COPY . ./
RUN cargo build --release



FROM debian:12-slim

RUN apt update && \
    apt install -y --no-install-recommends \
        ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

EXPOSE 80
ENV APP__APP__PORT 80
ENV APP__SPOTIFY__CLIENT_ID ""
ENV APP__SPOTIFY__CLIENT_SECRET ""

COPY --from=builder /app-build/target/release/backend /app/backend

CMD ["./backend"]
