#!/bin/sh

echo "Initializing git submodule ..."
git submodule update --init

if ! command -v lefthook >/dev/null 2>&1; then
  OS=$(uname -s)
  case "$OS" in
      Linux)
          echo "Detected Linux, installing lefthook from AUR..."
          paru --aur lefthook
          ;;
      Darwin)
          echo "Detected macOS, installing lefthook from Homebrew..."
          brew install lefthook
          ;;

      *)
          echo "Unknown OS: $OS"
          exit 1
          ;;
  esac
fi

lefthook install
