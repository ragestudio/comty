#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unsupported"
    fi
}

detect_arch() {
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        echo "amd64"
    elif [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]]; then
        echo "arm64"
    else
        echo "unsupported"
    fi
}

OS=$(detect_os)
ARCH=$(detect_arch)

if [[ "$OS" == "unsupported" ]] || [[ "$ARCH" == "unsupported" ]]; then
    echo -e "${RED}Operating system or architecture not supported. This script only supports Linux on amd64, arm64, or armhf architectures.${NC}"
    exit 1
fi

INSTALL_DIR="/usr/local/bin"
TEMP_DIR="/tmp/ffmpegdl"

if [[ -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
fi

mkdir -p "$TEMP_DIR"

if [[ ! -d "$INSTALL_DIR" ]]; then
    echo -e "${RED}$INSTALL_DIR is not a directory.${NC}"
    exit 1
fi

download_ffmpeg() {
    echo -e "${YELLOW}Downloading the latest stable version of FFmpeg...${NC}"

    # Base URL for downloads from John van Sickle's FFmpeg builds
    BASE_URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n7.1-latest"

    # Map architecture to the expected format in the URL
    if [[ "$ARCH" == "amd64" ]]; then
        URL_ARCH="linux64"
    elif [[ "$ARCH" == "arm64" ]]; then
        URL_ARCH="linuxarm64"
    fi

    # Create the download URL for the latest release
    FFMPEG_URL="$BASE_URL-$URL_ARCH-gpl-7.1.tar.xz"

    if [[ -z "$FFMPEG_URL" ]]; then
        echo -e "${RED}Could not determine the download URL for your system.${NC}"
        exit 1
    fi

    # Download the file
    ARCHIVE_FILE="$TEMP_DIR/ffmpeg.tar.xz"
    echo -e "${YELLOW}Downloading from: $FFMPEG_URL${NC}"

    if command -v wget > /dev/null; then
        wget -q --show-progress -O "$ARCHIVE_FILE" "$FFMPEG_URL"
    elif command -v curl > /dev/null; then
        curl -L -o "$ARCHIVE_FILE" "$FFMPEG_URL"
    else
        echo -e "${RED}wget or curl is required to download FFmpeg.${NC}"
        exit 1
    fi

    if [[ $? -ne 0 ]]; then
        echo -e "${RED}Error downloading FFmpeg.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Download completed.${NC}"

    # Extract the file
    echo -e "${YELLOW}Extracting files...${NC}"
    cd "$TEMP_DIR"
    tar -xf "$ARCHIVE_FILE"

    if [[ $? -ne 0 ]]; then
        echo -e "${RED}Error extracting the file.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Extraction completed.${NC}"

    # Clean up downloaded file
    rm "$ARCHIVE_FILE"
}

install_binaries() {
    echo -e "${YELLOW}Installing binaries...${NC}"

    # Find the extracted directory
    EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "ffmpeg-*" | head -n 1)

    if [[ -z "$EXTRACTED_DIR" ]]; then
        echo -e "${RED}FFmpeg extracted directory not found.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Extracted directory: $EXTRACTED_DIR${NC}"

    # Find the binaries
    FFMPEG_BIN="$EXTRACTED_DIR/bin/ffmpeg"
    FFPROBE_BIN="$EXTRACTED_DIR/bin/ffprobe"

    # Verify binaries exist
    if [[ ! -f "$FFMPEG_BIN" ]] || [[ ! -f "$FFPROBE_BIN" ]]; then
        echo -e "${RED}FFmpeg and FFprobe binaries not found.${NC}"
        exit 1
    fi

    # Copy binaries to the bin folder
    mv "$FFMPEG_BIN" "$INSTALL_DIR/ffmpeg"
    mv "$FFPROBE_BIN" "$INSTALL_DIR/ffprobe"

    # Make binaries executable
    chmod +x "$INSTALL_DIR/ffmpeg"
    chmod +x "$INSTALL_DIR/ffprobe"

    echo -e "${GREEN}Binaries installed in $INSTALL_DIR${NC}"

    # Clean up extracted directory
    rm -rf "$EXTRACTED_DIR"
    rm -rf "$TEMP_DIR"
}

show_versions() {
    echo -e "${YELLOW}Verifying the installation...${NC}"

    FFMPEG_PATH="$INSTALL_DIR/ffmpeg"
    FFPROBE_PATH="$INSTALL_DIR/ffprobe"

    echo -e "${GREEN}FFmpeg installed at: $FFMPEG_PATH${NC}"
    if [[ -x "$FFMPEG_PATH" ]]; then
        "$FFMPEG_PATH" -version | head -n 1
    fi

    echo -e "${GREEN}FFprobe installed at: $FFPROBE_PATH${NC}"
    if [[ -x "$FFPROBE_PATH" ]]; then
        "$FFPROBE_PATH" -version | head -n 1
    fi
}

download_ffmpeg
install_binaries
show_versions
