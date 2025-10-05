#!/bin/bash
# Fix all test files to use the client fixture

for file in tests/test_api/*.py tests/test_integration/*.py; do
    if [ -f "$file" ]; then
        # Remove the httpx import line
        sed -i.bak '/^from httpx import AsyncClient$/d' "$file"
        # Remove the app import line  
        sed -i.bak '/^from app\.main import app$/d' "$file"
        # Remove empty lines that might have been created
        sed -i.bak '/^$/N;/^\n$/D' "$file"
        # Remove backup files
        rm -f "$file.bak"
        echo "Processed: $file"
    fi
done

echo "Phase 1 complete - removed imports"
echo "Now run fix_tests2.sh for remaining changes"
