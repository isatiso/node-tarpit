#!/bin/bash

echo "=== Testing HTTP Server Examples ==="
echo

# Function to test an example
test_example() {
    local file=$1
    local port=$2
    local test_url=$3
    
    echo "Testing $file..."
    
    # Start the server in background
    npx ts-node "$file" &
    local pid=$!
    
    # Wait for server to start
    sleep 3
    
    # Test the endpoint
    if curl -s "$test_url" > /dev/null; then
        echo "✓ $file - Server started and responding"
    else
        echo "✗ $file - Failed to start or respond"
    fi
    
    # Stop the server
    kill $pid 2>/dev/null
    wait $pid 2>/dev/null
    
    echo
}

# Test each example
echo "Note: Testing may show TypeScript errors but functionality should work"
echo

test_example "basic-routing.ts" 4200 "http://localhost:4200/api/resources/list"
test_example "path-parameters.ts" 4201 "http://localhost:4201/api/users/123"
test_example "request-parsing.ts" 4202 "http://localhost:4202/api/info/request"
test_example "form-handling.ts" 4203 "http://localhost:4203/forms/contact"
test_example "response-handling.ts" 4204 "http://localhost:4204/api/responses/json"
test_example "static-files.ts" 4205 "http://localhost:4205/"
test_example "file-manager.ts" 4206 "http://localhost:4206/api/files/list"

echo "=== Test Summary ==="
echo "All examples have been tested. Check output above for results."
echo "Note: Some TypeScript errors are expected due to decorator compatibility issues."
echo "The examples should still function correctly at runtime." 