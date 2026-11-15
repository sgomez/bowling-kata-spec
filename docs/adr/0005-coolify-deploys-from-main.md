# Coolify builds and deploys from main

The app runs as a single container on a VPS managed by Coolify, which receives a webhook on every push to `main`, builds the repo's Dockerfile and deploys it behind its own proxy and TLS. There is no deploy workflow and no image registry. Because any push to `main` goes to production, `main` is protected and merges require a green CI. The container exposes `GET /health` for Coolify's healthcheck, and the server shuts down gracefully on SIGTERM.
