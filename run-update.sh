#!/bin/sh

./run-setup.sh
git submodule update --remote
chmod +x nextjs-secure-config/*.sh
bun update
rm -f bun.lock
bun i
