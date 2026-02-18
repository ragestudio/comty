#!/bin/bash

# check if we are in sudo
if [ "$EUID" -ne 0 ]; then
    exec sudo bash "$0" "$@"
    exit 0
fi

# check if ultragateway is installed
if [ ! -f /usr/local/bin/ultragateway ]; then
    echo "Installing ultragateway"
    if ! ./scripts/installUltragateway.sh; then
        echo "Failed to install ultragateway. Aborting."
        exit 1
    fi
    echo "Ultragateway binary installed"
else
    echo "Ultragateway binary ok"
fi

# check if ffmpeg is installed
if [ ! -f /usr/local/bin/ffmpeg ]; then
    echo "Installing FFMPEG"
    ./scripts/installLatestFfmpeg.sh
    echo "FFMPEG binary installed"
else
    echo "FFMPEG binary ok"
fi
