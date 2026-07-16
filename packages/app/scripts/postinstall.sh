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

echo -e "${YELLOW}=== Starting installation of module dependencies ===${NC}"
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

# Initialize submodules if necessary
echo -e "${YELLOW}Initializing submodules...${NC}"
git submodule update --init --recursive

# Check if pnpm is available
HAS_PNPM=false
if command -v pnpm &> /dev/null; then
    HAS_PNPM=true
fi

MODULES_DIR="$PROJECT_ROOT/modules"

if [[ ! -d "$MODULES_DIR" ]]; then
    echo -e "${YELLOW}No modules directory found.${NC}"
else
    # For each module in the modules directory
    for module_dir in "$MODULES_DIR"/*/; do
        module_name=$(basename "$module_dir")

        # Skip if it's not actually a directory (empty glob case)
        [[ ! -d "$module_dir" ]] && continue

        echo -e "${YELLOW}Installing dependencies in: ${GREEN}modules/$module_name${NC}"

        # Handle linebridge with its own install script
        if [[ "$module_name" == "linebridge" ]] && [[ -f "$module_dir/install-dependencies.sh" ]]; then
            (cd "$module_dir" && bash "./install-dependencies.sh") || {
                echo -e "${RED}Error installing dependencies in $module_name${NC}"
            }
            echo -e "${GREEN}✓ Dependencies installed in $module_name${NC}"
            continue
        fi

        # Check if package.json exists in the module directory
        if [[ -f "$module_dir/package.json" ]]; then
            # Detect package manager from lock files
            cd "$module_dir"
            if [[ -f "pnpm-lock.yaml" ]] && $HAS_PNPM; then
                echo -e "  using pnpm"
                pnpm install || {
                    echo -e "${RED}Error installing dependencies in $module_name${NC}"
                }
            elif [[ -f "package-lock.json" ]]; then
                echo -e "  using npm"
                npm install || {
                    echo -e "${RED}Error installing dependencies in $module_name${NC}"
                }
            elif [[ -f "pnpm-lock.yaml" ]]; then
                echo -e "  using npm (pnpm not available, but pnpm-lock found)"
                npm install || {
                    echo -e "${RED}Error installing dependencies in $module_name${NC}"
                }
            else
                echo -e "  using npm (default)"
                npm install || {
                    echo -e "${RED}Error installing dependencies in $module_name${NC}"
                }
            fi
            cd "$PROJECT_ROOT"
            echo -e "${GREEN}✓ Dependencies installed in $module_name${NC}"
        else
            echo -e "${YELLOW}⚠ No package.json found in $module_name, skipping${NC}"
        fi
    done
fi

echo -e "${YELLOW}Dumping licenses...${NC}"
cd "$PROJECT_ROOT/packages/app"
node "./scripts/dump-licenses.js"

echo -e "${GREEN}=== Installation of module dependencies completed ===${NC}"
