#!/bin/bash

echo "Starting Jekyll server for docs-i18n..."
echo "Server will be available at: http://localhost:4001"
echo "Press Ctrl+C to stop the server"
echo ""

bundle exec jekyll serve --host 0.0.0.0 --port 4001 