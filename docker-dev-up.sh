#!/bin/sh

if [ ! -f ".env" ]; then
   cp .env.example .env
fi
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
