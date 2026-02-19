BINARY_NAME="ultragateway"

BIN_LINUX_AMD64v1="${BINARY_NAME}_linux_x86_64"
BIN_LINUX_AMD64v3="${BINARY_NAME}_linux_v3_x86_64"
BIN_LINUX_ARM64="${BINARY_NAME}_linux_aarch64"

GIT_REPO="https://git.ragestudio.net/RageStudio/linebridge-gateway"
DL_URL="$GIT_REPO/releases/download/latest"

TARGET_ARCH=$(uname -m)

if lscpu 2>/dev/null | grep -q -E "avx2"; then
    TARGET_ARCH_LEVEL="v3"
else
    TARGET_ARCH_LEVEL="v1"
fi

if [ "$TARGET_ARCH" = "aarch64" ]; then
    DL_URL="$DL_URL/$BIN_LINUX_ARM64"
elif [ "$TARGET_ARCH_LEVEL" = "v3" ]; then
    DL_URL="$DL_URL/$BIN_LINUX_AMD64v3"
else
    DL_URL="$DL_URL/$BIN_LINUX_AMD64v1"
fi

cd /tmp

echo "Downloading from $DL_URL"
curl --fail-with-body -L "$DL_URL" -o "$BINARY_NAME"

chmod +x "./$BINARY_NAME"
mv "./${BINARY_NAME}" /usr/local/bin/
