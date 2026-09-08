FROM golang:1.25-alpine AS build

WORKDIR /src
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/lostlink-api ./cmd/api

FROM alpine:3.22
RUN addgroup -S lostlink && adduser -S -G lostlink lostlink
COPY --from=build /out/lostlink-api /usr/local/bin/lostlink-api
USER lostlink
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/lostlink-api"]
