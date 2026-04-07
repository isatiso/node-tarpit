#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

npm install -g @tarpit/tpkit

# [1] Configure shell environment
cat >> /root/.zshrc <<EOF

# node-tarpit devcontainer
source "$SCRIPT_DIR/shell.sh"
EOF

# [2] Start SSH server
mkdir -p /run/sshd
/usr/sbin/sshd

# [3] Sync AI agent config and .env
mkdir -p /root/.ssh
cat >> /root/.ssh/config <<EOF
Host github.com
    Hostname ssh.github.com
    Port 443
EOF
chmod 600 /root/.ssh/config
ssh-keyscan -p 443 ssh.github.com >> /root/.ssh/known_hosts 2>/dev/null
tpkit init
tpkit agent sync --gitignore

# [4] Install dependencies and build
pnpm install
