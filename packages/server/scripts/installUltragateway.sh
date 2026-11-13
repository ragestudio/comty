#!/bin/bash
set -euo pipefail

BINARY_NAME="ultragateway"
GIT_REPO="https://github.com/ragestudio/linebridge"
API_URL="https://api.github.com/repos/ragestudio/linebridge"
TAG_PREFIX="gateway-v"

BIN_LINUX_AMD64="${BINARY_NAME}-linux-x64"
BIN_LINUX_AMD64v3="${BINARY_NAME}-linux-x64v3"
BIN_LINUX_ARM64="${BINARY_NAME}-linux-arm64"

# optional token, an anonymous build can hit the github api rate limit
CURL_AUTH=()

if [ -n "${GITHUB_TOKEN:-}" ]; then
    CURL_AUTH=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

# highest published release, prereleases are skipped by requiring x.y.z
latest_gateway_version() {
    local tags
    local version

    tags="$(curl -fsS --retry 3 \
        -H "Accept: application/vnd.github+json" \
        "${CURL_AUTH[@]}" \
        "$API_URL/git/matching-refs/tags/$TAG_PREFIX")" || return 1

    version="$(printf "%s\n" "$tags" |
        grep -o "\"ref\": *\"refs/tags/$TAG_PREFIX[0-9.]*\"" |
        sed "s|.*refs/tags/$TAG_PREFIX||; s|\"$||" |
        grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' |
        sort -V |
        tail -n 1)"

    [ -n "$version" ] || return 1

    printf "%s%s" "$TAG_PREFIX" "$version"
}

# pin with ULTRAGATEWAY_VERSION, otherwise always install the latest release
GATEWAY_VERSION="${ULTRAGATEWAY_VERSION:-}"

if [ -z "$GATEWAY_VERSION" ]; then
    GATEWAY_VERSION="$(latest_gateway_version)" || {
        echo "Failed to resolve the latest gateway release" >&2
        exit 1
    }
fi

DL_URL="$GIT_REPO/releases/download/$GATEWAY_VERSION"

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

echo "Using $GATEWAY_VERSION"
echo "Downloading from $DL_URL/$BIN_NAME"
curl --fail-with-body --retry 3 -L "$DL_URL/$BIN_NAME" -o "$BINARY_NAME"

chmod +x "./$BINARY_NAME"
mv "./${BINARY_NAME}" /usr/local/bin/
