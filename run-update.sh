#!/bin/sh

./run-setup.sh
git submodule update --remote
bun update
