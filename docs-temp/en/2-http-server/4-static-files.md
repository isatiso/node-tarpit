---
layout: default
title: Static File Service
parent: HTTP Server
nav_order: 4
---

# Static File Service
{:.no_toc}

Learn how to serve static files efficiently with Tarpit's built-in static file service, including caching, security, and performance optimization.

<details open markdown="block">
  <summary>Table of contents</summary>{: .text-delta }
- TOC
{:toc}
</details>

---

## Overview

The `HttpStatic` service provides high-performance static file serving with features like:

- **Smart Caching** - Automatic ETag and Last-Modified header generation
- **File Watching** - Efficient file system monitoring and caching
- **Security** - Directory traversal protection and dot-file handling
- **Flexibility** - Multiple static directories and scoping
- **Performance** - Built-in cache control and conditional requests

## Basic Setup

### Simple Static Files

Configure static file serving in your application:

```typescript
import { Platform } from '@tarpit/core'
import { HttpServerModule } from '@tarpit/http'

const platform = new Platform({
    http: {
        port: 3000,
        static: {
            root: './public',           // Serve files from ./public directory
            index: ['index.html'],      // Default files to serve for directories
            extensions: ['.html']       // Extensions to try when file not found
        }
    }
})
    .import(HttpServerModule)

await platform.start()

// Now files in ./public are accessible at:
// http://localhost:3000/style.css -> ./public/style.css
// http://localhost:3000/js/app.js -> ./public/js/app.js
// http://localhost:3000/ -> ./public/index.html
```

### Multiple Static Directories

Serve different directories with different scopes:

```typescript
const platform = new Platform({
    http: {
        port: 3000,
        static: [
            {
                scope: '',              // Root scope (default)
                root: './public',
                index: ['index.html']
            },
            {
                scope: 'assets',        // /assets/* scope
                root: './assets',
                cache_control: { public: true, 'max-age': 86400 }
            },
            {
                scope: 'docs',          // /docs/* scope
                root: './documentation',
                index: ['README.md', 'index.html']
            }
        ]
    }
})

// Files are accessible at:
// http://localhost:3000/app.js -> ./public/app.js
// http://localhost:3000/assets/logo.png -> ./assets/logo.png
// http://localhost:3000/docs/guide.html -> ./documentation/guide.html
```

## Configuration Options

### Static Configuration Interface

```typescript
interface HttpStaticConfig {
    scope?: string                      // URL scope (default: '')
    root?: string                       // Root directory (default: process.cwd())
    index?: string[]                    // Default files (default: ['index.html'])
    extensions?: `.${string}`[]         // Extensions to try (default: ['.html'])
    cache_size?: number                 // File cache size (default: 100)
    dotfile?: 'allow' | 'ignore' | 'deny'  // Dot-file handling (default: 'ignore')
    vary?: string[] | '*'               // Vary header
    cache_control?: ResponseCacheControl // Cache control settings
}
```

### Cache Control

Configure caching behavior:

```typescript
const platform = new Platform({
    http: {
        static: {
            root: './public',
            cache_control: {
                public: true,           // Public cache
                'max-age': 3600,       // Cache for 1 hour
                'must-revalidate': true // Must revalidate when stale
            }
        }
    }
})
```

### Dot-file Handling

Control access to hidden files:

```typescript
const platform = new Platform({
    http: {
        static: [
            {
                scope: 'public',
                root: './public',
                dotfile: 'ignore'       // Ignore dot-files (404)
            },
            {
                scope: 'config',
                root: './config',
                dotfile: 'deny'         // Deny access (403)
            },
            {
                scope: 'all',
                root: './files',
                dotfile: 'allow'        // Allow access
            }
        ]
    }
})
```

## Advanced Usage

### Custom Static Router

Create a custom router for static files:

```typescript
import { HttpStatic, TpRouter, Get, TpRequest, TpResponse } from '@tarpit/http'

@TpRouter('/static')
class StaticRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async serve_static(req: TpRequest, res: TpResponse) {
        try {
            const stream = await this.static_service.serve(req, res, {
                scope: 'static',
                cache_control: { public: true, 'max-age': 3600 }
            })
            return stream
        } catch (error) {
            res.status = 404
            return { error: 'File not found' }
        }
    }
}
```

### Conditional Static Serving

Serve different files based on conditions:

```typescript
@TpRouter('/app')
class AppRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async serve_app(req: TpRequest, res: TpResponse) {
        const user_agent = req.headers.get?.('user-agent') || ''
        const is_mobile = /Mobile|Android|iPhone/.test(user_agent)
        
        try {
            // Serve mobile or desktop version
            const scope = is_mobile ? 'mobile' : 'desktop'
            const stream = await this.static_service.serve(req, res, {
                scope,
                vary: ['User-Agent']
            })
            return stream
        } catch (error) {
            // Fallback to default
            const stream = await this.static_service.serve(req, res, {
                scope: 'default'
            })
            return stream
        }
    }
}
```

### Static File API

Integrate static files with API responses:

```typescript
@TpRouter('/api')
class ApiRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('preview/:filename')
    async preview_file(path_args: PathArgs, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        try {
            // Serve file directly
            const stream = await this.static_service.serve(
                { path: filename } as TpRequest, 
                res, 
                {
                    scope: 'previews',
                    cache_control: { private: true, 'max-age': 300 }
                }
            )
            return stream
        } catch (error) {
            throw new TpHttpFinish({
                status: 404,
                code: 'FILE_NOT_FOUND',
                msg: `Preview file ${filename} not found`
            })
        }
    }
    
    @Get('download/:filename')
    async download_file(path_args: PathArgs, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        // Force download
        res.set('Content-Disposition', `attachment; filename="${filename}"`)
        
        const stream = await this.static_service.serve(
            { path: filename } as TpRequest,
            res,
            { scope: 'downloads' }
        )
        return stream
    }
}
```

## Performance Optimization

### File Caching

The static service automatically caches file metadata:

```typescript
const platform = new Platform({
    http: {
        static: {
            root: './public',
            cache_size: 500,            // Cache metadata for 500 files
            cache_control: {
                public: true,
                'max-age': 86400        // Cache for 24 hours
            }
        }
    }
})
```

### ETags and Conditional Requests

Automatic ETag generation for efficient caching:

```typescript
// The static service automatically generates ETags based on:
// - File size
// - Last modified time
// 
// Example ETag: "1024-1640995200000" (size-mtime)
//
// Supports conditional requests:
// - If-None-Match: Check ETag
// - If-Modified-Since: Check last modified
// - If-Match: Validate ETag
// - If-Unmodified-Since: Validate not modified
```

### Compression

Enable compression for static files:

```typescript
@TpRouter('/compressed')
class CompressedStaticRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async serve_compressed(req: TpRequest, res: TpResponse) {
        const accept_encoding = req.headers.get?.('accept-encoding') || ''
        
        // Check for pre-compressed files
        if (accept_encoding.includes('gzip')) {
            try {
                // Try to serve .gz version first
                const gz_path = req.path + '.gz'
                const stream = await this.static_service.serve(
                    { ...req, path: gz_path },
                    res,
                    { scope: 'compressed' }
                )
                res.set('Content-Encoding', 'gzip')
                res.set('Vary', 'Accept-Encoding')
                return stream
            } catch {
                // Fall back to original file
            }
        }
        
        // Serve original file
        const stream = await this.static_service.serve(req, res, {
            scope: 'compressed'
        })
        return stream
    }
}
```

## Security Features

### Directory Traversal Protection

Automatic protection against path traversal attacks:

```typescript
// These requests are automatically blocked:
// GET /../../../etc/passwd
// GET /./../../config/secrets.json
// GET /..%2F..%2F..%2Fetc%2Fpasswd
//
// The service ensures all paths stay within the configured root
```

### Dot-file Security

Control access to hidden files:

```typescript
const platform = new Platform({
    http: {
        static: [
            {
                scope: 'safe',
                root: './public',
                dotfile: 'deny'         // Block access to .htaccess, .env, etc.
            },
            {
                scope: 'wellknown',
                root: './well-known',
                dotfile: 'allow'        // Allow .well-known files
            }
        ]
    }
})
```

### Custom Security Headers

Add security headers to static responses:

```typescript
@TpRouter('/secure')
class SecureStaticRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async serve_secure(req: TpRequest, res: TpResponse) {
        // Add security headers
        res.set('X-Content-Type-Options', 'nosniff')
        res.set('X-Frame-Options', 'DENY')
        res.set('X-XSS-Protection', '1; mode=block')
        
        const stream = await this.static_service.serve(req, res, {
            scope: 'secure',
            cache_control: { private: true, 'no-cache': true }
        })
        return stream
    }
}
```

## Working Examples

### Complete Static File Server

[View the complete static file example](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/static-files.ts) on GitHub.

### Example Directory Structure

```
project/
├── public/              # Main static files
│   ├── index.html
│   ├── styles.css
│   └── js/
│       └── app.js
├── assets/              # Asset files
│   ├── images/
│   │   ├── logo.png
│   │   └── banner.jpg
│   └── fonts/
│       └── custom.woff2
├── docs/                # Documentation
│   ├── README.md
│   └── api/
│       └── index.html
└── src/
    └── main.ts          # Application code
```

Configuration for this structure:

```typescript
const platform = new Platform({
    http: {
        port: 3000,
        static: [
            {
                scope: '',
                root: './public',
                index: ['index.html'],
                cache_control: { public: true, 'max-age': 300 }
            },
            {
                scope: 'assets',
                root: './assets',
                cache_control: { public: true, 'max-age': 86400 },
                vary: ['Accept-Encoding']
            },
            {
                scope: 'docs',
                root: './docs',
                index: ['README.md', 'index.html'],
                extensions: ['.md', '.html']
            }
        ]
    }
})
```

## Best Practices

### 1. Use Appropriate Cache Settings

```typescript
// Long cache for immutable assets
{
    scope: 'assets',
    root: './assets',
    cache_control: { public: true, 'max-age': 31536000, immutable: true }
}

// Short cache for frequently updated content
{
    scope: 'content',
    root: './content',
    cache_control: { public: true, 'max-age': 300, 'must-revalidate': true }
}
```

### 2. Organize by Content Type

```typescript
static: [
    { scope: 'js', root: './dist/js', cache_control: { 'max-age': 86400 } },
    { scope: 'css', root: './dist/css', cache_control: { 'max-age': 86400 } },
    { scope: 'images', root: './assets/images', cache_control: { 'max-age': 604800 } },
    { scope: 'fonts', root: './assets/fonts', cache_control: { 'max-age': 2592000 } }
]
```

### 3. Security Considerations

- Always use `dotfile: 'deny'` or `dotfile: 'ignore'` in production
- Set appropriate cache headers for sensitive content
- Use HTTPS for serving static files in production
- Consider Content Security Policy (CSP) headers

### 4. Performance Tips

- Enable compression at the reverse proxy level
- Use CDN for static assets in production
- Optimize file sizes (minification, image optimization)
- Consider HTTP/2 for better multiplexing

## Next Steps

- Learn about [File Manager](./5-file-manager.md) for dynamic file operations
- Explore [Authentication](./6-authentication.md) for securing static content
- Check out [Caching System](./7-caching.md) for advanced caching strategies 