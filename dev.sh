#!/usr/bin/env bash

function startServer(){
  bun --bun run dev &
  bun --bun run api-dev &
  xdg-open http://localhost:3000
}

function main(){
  if [[ $(cat /etc/os-release | grep ^NAME | cut -d"=" -f2) == "NixOS" && $IS_NIX_SHELL != "true" ]]; then
    echo "Starting nix-shell..."
    nix-shell --run $0 
  else
    startServer
  fi
}

main
