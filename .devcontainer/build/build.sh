#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_IMAGE="node-tarpit-base"
IMAGE_NAME="node-tarpit-dev"

FORCE=false
BASE_ONLY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force) FORCE=true; shift ;;
        --base-only) BASE_ONLY=true; shift ;;
        *) echo "Usage: $0 [-f|--force] [--base-only]"; exit 1 ;;
    esac
done

BUILD_ARGS=""
if [ "$FORCE" = true ]; then
    echo ">>> Force rebuild (no cache)"
    BUILD_ARGS="--no-cache"
fi

echo ">>> Building base image: $BASE_IMAGE"
docker build $BUILD_ARGS -t "$BASE_IMAGE" -f "$SCRIPT_DIR/Dockerfile.base" "$SCRIPT_DIR"

if [ "$BASE_ONLY" = true ]; then
    echo ">>> Done: $BASE_IMAGE"
    exit 0
fi

echo ">>> Building image: $IMAGE_NAME"
docker build $BUILD_ARGS -t "$IMAGE_NAME" -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR"
echo ">>> Done: $IMAGE_NAME"
