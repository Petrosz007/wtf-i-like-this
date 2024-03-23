dev:
    go run .

build:
    go build ./...

test *args:
    go test ./... {{ args }}
