FROM node-tarpit-base

# [8] Node.js 22 via nvm + make binaries available globally
RUN . "$NVM_DIR/nvm.sh" \
    && nvm install 22 \
    && nvm alias default 22 \
    && nvm cache clear
RUN ln -s "$NVM_DIR/versions/node/$(. $NVM_DIR/nvm.sh && nvm current)/bin/node" /usr/local/bin/node \
    && ln -s "$NVM_DIR/versions/node/$(. $NVM_DIR/nvm.sh && nvm current)/bin/npm" /usr/local/bin/npm \
    && ln -s "$NVM_DIR/versions/node/$(. $NVM_DIR/nvm.sh && nvm current)/bin/npx" /usr/local/bin/npx

# [9] pnpm + AI CLI tools: Claude Code, OpenAI Codex, Factory Droid
RUN npm install -g pnpm @anthropic-ai/claude-code @openai/codex droid

WORKDIR /workspace/node-tarpit
