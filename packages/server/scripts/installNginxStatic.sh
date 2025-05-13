#!/bin/bash
FORCE_OVERWRITE=false
for arg in "$@"; do
  if [ "$arg" == "-y" ]; then
    FORCE_OVERWRITE=true
    break
  fi
done

NGINX_VERSION="1.26.3"
ARCH="$(dpkg --print-architecture)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTBIN="${SCRIPT_DIR}/../nginx-bin"

if [ "$ARCH" = "arm64" ]; then
    NGINX_ARCH="aarch64";
elif [ "$ARCH" = "amd64" ]; then
    NGINX_ARCH="x86_64";
else
    echo "Unsupported architecture: $ARCH";
    exit 1;
fi

NGINX_BINARY_URL="https://jirutka.github.io/nginx-binaries/nginx-${NGINX_VERSION}-${NGINX_ARCH}-linux"

if [ -f "${OUTPUTBIN}" ]; then
    if [ "$FORCE_OVERWRITE" = true ]; then
        echo "'-y' flag detected. Overwriting '${OUTPUTBIN}'."
    else
        read -r -p "File '${OUTPUTBIN}' already exists. Overwrite? (y/N) " response
        if [[ ! "$response" =~ ^([yY])$ ]]; then
            echo "Skipping download."
            exit 0
        fi
    fi
fi

curl -L "${NGINX_BINARY_URL}" -o "${OUTPUTBIN}"

chmod +x "${OUTPUTBIN}"

"${OUTPUTBIN}" -v;
