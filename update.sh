#!/bin/sh

./setup.sh
git submodule update --remote
corepack use pnpm@latest
corepack enable
pnpm up --latest
