#!/bin/zsh

WORKSPACE="/workspace/node-tarpit"

# Load .env managed by tpkit
if [[ -f "$WORKSPACE/.env" ]]; then
    set -a
    source "$WORKSPACE/.env"
    set +a
fi

# Persistent zsh history
export HISTFILE=/root/.zsh_history_persist/.zsh_history

# Extend PATH
export PATH="$HOME/.local/bin:$WORKSPACE/node_modules/.bin:$PATH"

# Load aliases
source "$(dirname "$0")/aliases.sh"
