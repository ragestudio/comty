#!/bin/bash
set -euo pipefail

BINARY_NAME="ultragateway"
GIT_REPO="https://github.com/ragestudio/linebridge"

# release tag, override with ULTRAGATEWAY_VERSION
GATEWAY_VERSION="${ULTRAGATEWAY_VERSION:-gateway-v0.19.0}"

DL_URL="$GIT_REPO/releases/download/$GATEWAY_VERSION"

BIN_LINUX_AMD64="${BINARY_NAME}-linux-x64"
BIN_LINUX_AMD64v3="${BINARY_NAME}-linux-x64v3"
BIN_LINUX_ARM64="${BINARY_NAME}-linux-arm64"

# use the target architecture reported by docker build when available
TARGET_ARCH="${TARGETARCH:-$(uname -m)}"

if [ "$TARGET_ARCH" = "aarch64" ] || [ "$TARGET_ARCH" = "arm64" ]; then
    BIN_NAME="$BIN_LINUX_ARM64"
elif grep -qw avx2 /proc/cpuinfo; then
    BIN_NAME="$BIN_LINUX_AMD64v3"
else
    BIN_NAME="$BIN_LINUX_AMD64"
fi

cd /tmp

echo "Downloading from $DL_URL/$BIN_NAME"
curl --fail-with-body --retry 3 -L "$DL_URL/$BIN_NAME" -o "$BINARY_NAME"

chmod +x "./$BINARY_NAME"
mv "./${BINARY_NAME}" /usr/local/bin/
