# check if we are in sudo
if [ "$EUID" -ne 0 ]; then
    exec sudo bash "$0" "$@"
    exit 0
fi

# check if ultragateway is installed
if [ ! -f /usr/local/bin/ultragateway ]; then
    echo "Installing ultragateway"
    curl -fsSL https://git.ragestudio.net/RageStudio/linebridge-gateway/raw/branch/main/install.sh | sudo sh
    echo "ultragateway binary installed"
else
    echo "ultragateway binary ok"
fi
