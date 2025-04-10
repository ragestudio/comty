#!/bin/bash

# Output colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory path where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root directory path
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"

echo -e "${YELLOW}=== Starting installation of dependencies in submodules ===${NC}"
echo -e "${YELLOW}Project directory: ${GREEN}$PROJECT_ROOT${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install it first.${NC}"
    exit 1
fi

# Change to the project root directory
cd "$PROJECT_ROOT"

# Get the list of submodules
SUBMODULES=$(git submodule --quiet foreach 'echo $path')

# Check if there are submodules
if [ -z "$SUBMODULES" ]; then
    echo -e "${YELLOW}No submodules found in this repository.${NC}"
    exit 0
fi

# Initialize submodules if necessary
echo -e "${YELLOW}Initializing submodules...${NC}"
git submodule update --init --recursive

# For each submodule, install dependencies
for submodule in $SUBMODULES; do
    echo -e "${YELLOW}Installing dependencies in: ${GREEN}$submodule${NC}"
    SUBMODULE_PATH="$PROJECT_ROOT/$submodule"

    # Check if package.json exists in the submodule directory
    if [ -f "$SUBMODULE_PATH/package.json" ]; then
        # Change to the submodule directory and run npm install
        (cd "$SUBMODULE_PATH" && npm install) || {
            echo -e "${RED}Error installing dependencies in $submodule${NC}"
        }
        echo -e "${GREEN}✓ Dependencies installed in $submodule${NC}"
    else
        # Check if install-dependencies.sh exists in the submodule directory
        if [ -f "$SUBMODULE_PATH/install-dependencies.sh" ]; then
            echo -e "${YELLOW}Running custom installation script in $submodule${NC}"
            # Make sure the script has execution permissions
            chmod +x "$SUBMODULE_PATH/install-dependencies.sh"
            # Run the custom installation script
            (cd "$SUBMODULE_PATH" && ./install-dependencies.sh) || {
                echo -e "${RED}Error executing install-dependencies.sh in $submodule${NC}"
            }
            echo -e "${GREEN}✓ Custom installation script executed in $submodule${NC}"
        else
            echo -e "${YELLOW}⚠ Neither package.json nor install-dependencies.sh found in $submodule${NC}"
        fi
    fi
done

echo -e "${YELLOW}Dumping licenses...${NC}"
cd "$(pwd)/packages/app"
node "./scripts/dump-licenses.js"

echo -e "${GREEN}=== Installation of dependencies in submodules completed ===${NC}"
