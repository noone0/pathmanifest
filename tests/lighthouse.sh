#!/bin/bash
# ============================================================
# Lighthouse Performance & SEO Audit
# Software Manifesto Landing Page
#
# Requirements:
#   npm install -g lighthouse
#   npx serve . (start local server first)
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="./tests/lighthouse-reports"

mkdir -p "$OUTPUT_DIR"

echo "Running Lighthouse audit against: $BASE_URL"
echo ""

lighthouse "$BASE_URL" \
  --output=json \
  --output=html \
  --output-path="$OUTPUT_DIR/report" \
  --only-categories=performance,seo,accessibility,best-practices \
  --chrome-flags="--headless --no-sandbox" \
  --quiet

# Parse scores
REPORT_JSON="$OUTPUT_DIR/report.report.json"

if [ -f "$REPORT_JSON" ]; then
  PERF=$(cat "$REPORT_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['performance']['score']*100))")
  SEO=$(cat "$REPORT_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['seo']['score']*100))")
  A11Y=$(cat "$REPORT_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['accessibility']['score']*100))")
  BP=$(cat "$REPORT_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['best-practices']['score']*100))")

  echo "=== LIGHTHOUSE SCORES ==="
  echo "Performance:    $PERF / 100"
  echo "SEO:            $SEO / 100"
  echo "Accessibility:  $A11Y / 100"
  echo "Best Practices: $BP / 100"
  echo ""

  # Assert thresholds
  FAIL=0
  [ "$PERF" -lt 90 ] && echo "FAIL: Performance score $PERF < 90" && FAIL=1
  [ "$SEO" -lt 95 ] && echo "FAIL: SEO score $SEO < 95" && FAIL=1
  [ "$A11Y" -lt 90 ] && echo "FAIL: Accessibility score $A11Y < 90" && FAIL=1

  if [ "$FAIL" -eq 0 ]; then
    echo "ALL THRESHOLDS PASSED!"
    exit 0
  else
    exit 1
  fi
else
  echo "ERROR: Lighthouse report not generated."
  exit 1
fi
