#!/bin/sh

docker compose build --build-arg COMMIT_HASH=$(git log --pretty=format:'%h' -n1)
