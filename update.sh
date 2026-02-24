#!/bin/sh

./setup.sh
git submodule update --remote
bun update --latest
