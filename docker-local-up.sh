#!/bin/sh

if [ ! -f ".env" ]; then
   cp .env.example .env
fi
docker compose -f docker-compose.yml -f docker-compose-local.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose-local.yml logs -f
