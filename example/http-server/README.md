# HTTP Server Examples

This directory contains comprehensive examples demonstrating all features of Tarpit's HTTP module.

## Available Examples

### Core Features

1. **[basic-routing.ts](./basic-routing.ts)** - Basic HTTP routing and methods
   - HTTP method decorators (GET, POST, PUT, DELETE)
   - Route registration and dependency injection
   - Multiple routers and versioning
   - **Port: 4200** | **Test URL:** http://localhost:4200/api/resources/list

2. **[path-parameters.ts](./path-parameters.ts)** - Dynamic path parameters
   - Single and multiple path parameters
   - Parameter validation and conversion
   - Optional parameters and nested routes
   - **Port: 4201** | **Test URL:** http://localhost:4201/api/users/123

3. **[request-parsing.ts](./request-parsing.ts)** - Request body parsing
   - JSON body parsing and validation
   - Query parameter handling
   - Request headers and metadata
   - **Port: 4202** | **Test URL:** http://localhost:4202/api/info/request

4. **[form-handling.ts](./form-handling.ts)** - Form data processing
   - HTML form handling with FormBody
   - File upload processing
   - Both web interface and API endpoints
   - **Port: 4203** | **Test URL:** http://localhost:4203/forms/contact

### Advanced Features

5. **[response-handling.ts](./response-handling.ts)** - Response management
   - Different response types (JSON, HTML, Stream)
   - Error handling with TpHttpFinish
   - Custom headers and status codes
   - Server-sent events
   - **Port: 4204** | **Test URL:** http://localhost:4204/api/responses/json

6. **[static-files.ts](./static-files.ts)** - Static file serving
   - Multiple static directories with scopes
   - Cache control and performance optimization
   - Custom static file routers
   - Conditional serving based on user agent
   - **Port: 4205** | **Test URL:** http://localhost:4205/

7. **[file-manager.ts](./file-manager.ts)** - File operations
   - File CRUD operations (create, read, update, delete)
   - File upload and download
   - Directory operations and archiving
   - File metadata management
   - **Port: 4206** | **Test URL:** http://localhost:4206/api/files/list

## Running Examples

### Individual Examples

Run any example directly:

```bash
# Basic routing example
npx ts-node basic-routing.ts

# Path parameters example  
npx ts-node path-parameters.ts

# Request parsing example
npx ts-node request-parsing.ts

# Form handling example
npx ts-node form-handling.ts

# Response handling example
npx ts-node response-handling.ts

# Static files example
npx ts-node static-files.ts

# File manager example
npx ts-node file-manager.ts
```

### Automated Testing

Test all examples automatically:

```bash
# Run the test script
./test-examples.sh
```

This script will:
- Start each example server
- Test basic connectivity
- Stop the server
- Report results

## Example Ports

Each example runs on a different port to avoid conflicts:

- **basic-routing.ts**: http://localhost:4200
- **path-parameters.ts**: http://localhost:4201  
- **request-parsing.ts**: http://localhost:4202
- **form-handling.ts**: http://localhost:4203
- **response-handling.ts**: http://localhost:4204
- **static-files.ts**: http://localhost:4205
- **file-manager.ts**: http://localhost:4206

## Testing Examples

### Using curl

```bash
# Test basic routing
curl http://localhost:4200/api/resources/list

# Test path parameters
curl http://localhost:4201/api/users/123

# Test JSON response
curl http://localhost:4202/api/info/request

# Test form submission
curl -X POST http://localhost:4203/api/forms/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John&email=john@example.com&message=Hello"

# Test static files
curl http://localhost:4205/assets/styles.css

# Test file operations
curl http://localhost:4206/api/files/list
```

### Using Browser

Open the following URLs in your browser:

- **Form Demo**: http://localhost:4203/forms/contact
- **Static Files Demo**: http://localhost:4205/
- **Response Demo**: http://localhost:4204/pages/home

## Features Demonstrated

### HTTP Methods
- `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- Method name-based routing
- Custom path patterns

### Request Handling
- Path parameters with validation
- Query parameter processing
- JSON body parsing
- Form data handling
- File upload processing
- Request headers and metadata

### Response Types
- JSON responses
- HTML pages
- Streaming responses
- File downloads
- Error responses
- Custom headers

### Static Files
- Multiple static directories
- Cache control
- File watching
- Security (dot-file handling)
- Conditional serving

### File Management
- File CRUD operations
- Directory operations
- File streaming
- Archive creation
- Metadata tracking

### Error Handling
- `TpHttpFinish` exceptions
- Validation errors
- Custom error codes
- Structured error responses

## Dependencies

All examples use:
- `@tarpit/core` - Core dependency injection
- `@tarpit/http` - HTTP server module
- `@tarpit/config` - Configuration management
- `@tarpit/judge` - Input validation

## Notes

### TypeScript Compatibility
Some examples may show TypeScript decorator errors during compilation due to compatibility issues between different TypeScript versions and decorator implementations. However, the examples should run correctly at runtime.

### File Permissions
The file manager example creates a `./data` directory for file operations. Ensure your environment has appropriate file system permissions.

### Static Files
The static files example creates directories (`./public`, `./assets`, `./docs`) with sample files. These will be created automatically when the example runs.

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
1. Stop any running examples: `pkill -f "ts-node"`
2. Or change the port number in the example file

### TypeScript Errors
If you encounter TypeScript compilation errors:
1. The examples should still run with `npx ts-node`
2. Runtime functionality is not affected
3. Errors are typically related to decorator type definitions

### Missing Dependencies
If dependencies are missing:
```bash
# From the project root
yarn install
```

## Documentation

For detailed documentation on each feature, see:
- [Core Documentation](../../docs-temp/en/1-core/)
- [HTTP Server Documentation](../../docs-temp/en/2-http-server/)

Each example file includes extensive comments explaining the code and usage patterns. 