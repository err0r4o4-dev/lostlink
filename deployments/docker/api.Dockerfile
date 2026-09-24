FROM golang:1.25-alpine AS development

WORKDIR /app
RUN go install github.com/air-verse/air@v1.66.1
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api/ ./
EXPOSE 8081
CMD ["air", "--build.cmd", "go build -o /tmp/lostlink-api ./cmd/api", "--build.entrypoint", "/tmp/lostlink-api", "--build.poll", "true", "--build.poll_interval", "500"]

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
EXPOSE 8081
ENTRYPOINT ["/usr/local/bin/lostlink-api"]
