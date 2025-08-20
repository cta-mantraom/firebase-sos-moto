#!/bin/bash

# Fix all TypeScript imports to add .js extension for ESM compatibility

echo "Fixing imports in lib/ directory..."

# Find all .ts files in lib/ and api/ directories
find lib api -name "*.ts" -type f | while read file; do
    # Create a temporary file
    temp_file="${file}.tmp"
    
    # Process the file
    sed -E "s/(from ['\"])(\.\.[^'\"]+)(['\"])/\1\2.js\3/g; s/(from ['\"])(\.[^'\"]+)(['\"])/\1\2.js\3/g" "$file" | \
    sed -E "s/\.js\.js/\.js/g" > "$temp_file"
    
    # Check if changes were made
    if ! diff -q "$file" "$temp_file" > /dev/null; then
        echo "Fixed imports in: $file"
        mv "$temp_file" "$file"
    else
        rm "$temp_file"
    fi
done

echo "Import fixing complete!"