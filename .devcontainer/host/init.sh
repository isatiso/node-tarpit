#!/bin/bash
set -e

mkdir -p "$HOME/.node-tarpit/zsh_history"

if [ -z "$SSH_AUTH_SOCK" ]; then
    touch /tmp/ssh-agent-placeholder.sock
fi
