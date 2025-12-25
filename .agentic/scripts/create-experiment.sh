#!/bin/bash
# create-experiment.sh
# Creates a new experiment from the template with proper initialization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/.agentic/templates/experiment_template"
EXPERIMENTS_DIR="$REPO_ROOT/agentic_dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "XPR Experiment Creator"
echo -e "==========================================${NC}"
echo ""

# Check if template exists
if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo -e "${RED}❌ Template directory not found: $TEMPLATE_DIR${NC}"
  exit 1
fi

# Get experiment number
if [[ -n "$1" ]]; then
  EXPERIMENT_NUM="$1"
else
  # Auto-detect next number
  LAST_NUM=0
  for dir in "$EXPERIMENTS_DIR"/experiment_*; do
    if [[ -d "$dir" ]]; then
      NUM=$(basename "$dir" | sed 's/experiment_//')
      if [[ "$NUM" =~ ^[0-9]+$ ]] && [[ $NUM -gt $LAST_NUM ]]; then
        LAST_NUM=$NUM
      fi
    fi
  done
  EXPERIMENT_NUM=$(printf "%02d" $((LAST_NUM + 1)))
  
  echo -e "${YELLOW}No experiment number provided.${NC}"
  echo -e "Next available: ${GREEN}$EXPERIMENT_NUM${NC}"
  read -p "Use this number? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter experiment number (e.g., 02): " EXPERIMENT_NUM
  fi
fi

# Ensure two-digit format
EXPERIMENT_NUM=$(printf "%02d" "$EXPERIMENT_NUM")

EXPERIMENT_DIR="$EXPERIMENTS_DIR/experiment_$EXPERIMENT_NUM"

# Check if already exists
if [[ -d "$EXPERIMENT_DIR" ]]; then
  echo -e "${RED}❌ Experiment directory already exists: $EXPERIMENT_DIR${NC}"
  exit 1
fi

# Get experiment name and description
echo ""
echo -e "${BLUE}Experiment Configuration${NC}"
echo "----------------------------------------"
read -p "Experiment name (e.g., 'enhanced-query-tools'): " EXPERIMENT_NAME
read -p "Brief description: " EXPERIMENT_DESC

# Create directory
echo ""
echo -e "${BLUE}Creating experiment...${NC}"
mkdir -p "$EXPERIMENT_DIR"

# Copy template
echo "📋 Copying template files..."
cp -r "$TEMPLATE_DIR"/* "$EXPERIMENT_DIR/"
cp "$TEMPLATE_DIR/.gitignore" "$EXPERIMENT_DIR/"

# Update package.json
echo "📦 Updating package.json..."
cd "$EXPERIMENT_DIR"

# Replace XX with actual number and update name/description
sed -i.bak "s/experiment-xx-name/experiment-$EXPERIMENT_NUM-$EXPERIMENT_NAME/g" package.json
sed -i.bak "s/Brief description of this experiment/$EXPERIMENT_DESC/g" package.json
rm package.json.bak

# Update README files with experiment number
echo "📝 Updating documentation..."
for file in README.md INDEX.md EXPERIMENT_SCOPE.md task.md ARCHITECTURE.md; do
  if [[ -f "$file" ]]; then
    sed -i.bak "s/XX/$EXPERIMENT_NUM/g" "$file"
    sed -i.bak "s/YYYY-MM-DD/$(date +%Y-%m-%d)/g" "$file"
    rm "$file.bak"
  fi
done

# Update INDEX.md with experiment name
sed -i.bak "s/Experiment XX/Experiment $EXPERIMENT_NUM/g" INDEX.md
rm INDEX.md.bak

# Initialize git tracking
echo "🔧 Initializing git..."
git add .

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Experiment Created Successfully!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}Location:${NC} $EXPERIMENT_DIR"
echo -e "${BLUE}Name:${NC} experiment-$EXPERIMENT_NUM-$EXPERIMENT_NAME"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Navigate to experiment:"
echo -e "   ${GREEN}cd $EXPERIMENT_DIR${NC}"
echo ""
echo "2. Install dependencies:"
echo -e "   ${GREEN}npm install${NC}"
echo ""
echo "3. Update documentation:"
echo "   - Edit README.md with specific details"
echo "   - Update EXPERIMENT_SCOPE.md with boundaries"
echo "   - Document architecture in ARCHITECTURE.md"
echo ""
echo "4. Start implementing:"
echo "   - Edit src/index.ts"
echo "   - Add tools in src/tools/"
echo "   - Add adapters in src/adapters/"
echo ""
echo "5. Build and test:"
echo -e "   ${GREEN}npm run build && npm start${NC}"
echo ""
echo "6. Validate experiment:"
echo -e "   ${GREEN}$SCRIPT_DIR/validate-experiment.sh${NC}"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
echo ""
