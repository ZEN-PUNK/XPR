#!/bin/bash
# validate-experiment.sh
# Validates that an experiment meets all agentic development requirements

set -e

EXPERIMENT_DIR="${1:-.}"
ERRORS=0
WARNINGS=0

echo "=========================================="
echo "Validating Experiment: $EXPERIMENT_DIR"
echo "=========================================="
echo ""

# Check if we're in an experiment directory
if [[ ! -f "$EXPERIMENT_DIR/package.json" ]]; then
  echo "❌ ERROR: Not a valid experiment directory (no package.json found)"
  exit 1
fi

cd "$EXPERIMENT_DIR"

echo "📋 Checking Required Files..."
echo "----------------------------------------"

# Required files
REQUIRED_FILES=(
  "README.md"
  "INDEX.md"
  "ARCHITECTURE.md"
  "EXPERIMENT_SCOPE.md"
  "task.md"
  "package.json"
  ".gitignore"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file MISSING"
    ((ERRORS++))
  fi
done

echo ""
echo "📦 Checking Dependencies..."
echo "----------------------------------------"

# Check if node_modules exists
if [[ -d "node_modules" ]]; then
  echo "  ✅ node_modules directory exists"
else
  echo "  ⚠️  node_modules not found - run 'npm install'"
  ((WARNINGS++))
fi

# Check package.json structure
if command -v jq &> /dev/null; then
  # Check for required package.json fields
  NAME=$(jq -r '.name // empty' package.json)
  VERSION=$(jq -r '.version // empty' package.json)
  DESCRIPTION=$(jq -r '.description // empty' package.json)
  
  if [[ -n "$NAME" ]]; then
    echo "  ✅ package.json has name: $NAME"
  else
    echo "  ❌ package.json missing 'name' field"
    ((ERRORS++))
  fi
  
  if [[ -n "$VERSION" ]]; then
    echo "  ✅ package.json has version: $VERSION"
  else
    echo "  ❌ package.json missing 'version' field"
    ((ERRORS++))
  fi
  
  # Check for scripts
  BUILD_SCRIPT=$(jq -r '.scripts.build // empty' package.json)
  START_SCRIPT=$(jq -r '.scripts.start // empty' package.json)
  
  if [[ -n "$BUILD_SCRIPT" ]]; then
    echo "  ✅ build script defined"
  else
    echo "  ⚠️  No build script defined"
    ((WARNINGS++))
  fi
  
  if [[ -n "$START_SCRIPT" ]]; then
    echo "  ✅ start script defined"
  else
    echo "  ❌ No start script defined"
    ((ERRORS++))
  fi
else
  echo "  ⚠️  jq not installed - skipping package.json validation"
  ((WARNINGS++))
fi

echo ""
echo "🏗️  Checking Build Capability..."
echo "----------------------------------------"

# Check if TypeScript config exists (if using TypeScript)
if [[ -f "tsconfig.json" ]]; then
  echo "  ✅ TypeScript configuration found"
  
  # Try to build
  if [[ -f "node_modules/.bin/tsc" ]]; then
    echo "  🔨 Attempting build..."
    if npm run build > /tmp/build.log 2>&1; then
      echo "  ✅ Build successful"
    else
      echo "  ❌ Build failed - check /tmp/build.log"
      ((ERRORS++))
    fi
  else
    echo "  ⚠️  TypeScript not installed - run 'npm install'"
    ((WARNINGS++))
  fi
fi

# Check for dist directory
if [[ -d "dist" ]]; then
  FILE_COUNT=$(find dist -type f | wc -l)
  echo "  ✅ dist/ directory exists with $FILE_COUNT files"
else
  echo "  ⚠️  dist/ directory not found - run 'npm run build'"
  ((WARNINGS++))
fi

echo ""
echo "📄 Checking Documentation Quality..."
echo "----------------------------------------"

# Check README.md content
if [[ -f "README.md" ]]; then
  README_SIZE=$(wc -l < README.md)
  if [[ $README_SIZE -gt 50 ]]; then
    echo "  ✅ README.md is comprehensive ($README_SIZE lines)"
  else
    echo "  ⚠️  README.md seems short ($README_SIZE lines) - add more details"
    ((WARNINGS++))
  fi
  
  # Check for key sections
  if grep -q "Quick Start" README.md; then
    echo "  ✅ README has Quick Start section"
  else
    echo "  ⚠️  README missing Quick Start section"
    ((WARNINGS++))
  fi
  
  if grep -q "Usage" README.md || grep -q "Examples" README.md; then
    echo "  ✅ README has Usage/Examples section"
  else
    echo "  ⚠️  README missing Usage/Examples section"
    ((WARNINGS++))
  fi
fi

# Check ARCHITECTURE.md content
if [[ -f "ARCHITECTURE.md" ]]; then
  ARCH_SIZE=$(wc -l < ARCHITECTURE.md)
  if [[ $ARCH_SIZE -gt 50 ]]; then
    echo "  ✅ ARCHITECTURE.md is comprehensive ($ARCH_SIZE lines)"
  else
    echo "  ⚠️  ARCHITECTURE.md seems short ($ARCH_SIZE lines)"
    ((WARNINGS++))
  fi
fi

echo ""
echo "🔍 Checking Independence..."
echo "----------------------------------------"

# Check for imports from parent directory
if [[ -d "src" ]]; then
  PARENT_IMPORTS=$(grep -r "from '\.\./\.\." src/ 2>/dev/null || true)
  if [[ -z "$PARENT_IMPORTS" ]]; then
    echo "  ✅ No imports from parent directory found"
  else
    echo "  ❌ Found imports from parent directory:"
    echo "$PARENT_IMPORTS"
    echo "  Experiments should be self-contained!"
    ((ERRORS++))
  fi
fi

# Check .gitignore
if [[ -f ".gitignore" ]]; then
  if grep -q "node_modules" .gitignore; then
    echo "  ✅ .gitignore excludes node_modules"
  else
    echo "  ⚠️  .gitignore should exclude node_modules"
    ((WARNINGS++))
  fi
  
  if grep -q "dist" .gitignore || grep -q "*.js" .gitignore; then
    echo "  ✅ .gitignore excludes build artifacts"
  else
    echo "  ⚠️  .gitignore should exclude build artifacts (dist/)"
    ((WARNINGS++))
  fi
fi

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo ""

if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
  echo "🎉 EXCELLENT! All checks passed!"
  echo ""
  echo "This experiment meets all agentic development requirements."
  exit 0
elif [[ $ERRORS -eq 0 ]]; then
  echo "✅ GOOD! No errors found."
  echo "⚠️  But there are $WARNINGS warnings to address."
  echo ""
  echo "The experiment is functional but could be improved."
  exit 0
else
  echo "❌ FAILED! Found $ERRORS errors and $WARNINGS warnings."
  echo ""
  echo "Please fix the errors before marking this experiment complete."
  exit 1
fi
