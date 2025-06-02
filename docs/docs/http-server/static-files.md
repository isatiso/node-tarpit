---
sidebar_position: 5
---

# Static Files

:::info Working Examples
See [static-files.ts](https://github.com/isatiso/node-tarpit/blob/main/example/http-server/static-files.ts) for complete working examples.
:::

Static file serving in Tarpit allows you to efficiently serve static assets like HTML, CSS, JavaScript, images, and other resources. Tarpit provides built-in static file middleware with caching, compression, and security features.

## Basic Static File Serving

### Single Directory

Serve static files from a single directory:

```typescript
import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { HttpServerModule, StaticFileModule } from '@tarpit/http'

const config = load_config<TpConfigSchema>({
    http: { port: 3000 },
    static: {
        root: './public',      // Directory to serve
        prefix: '/static'      // URL prefix
    }
})

const platform = new Platform(config)
    .import(HttpServerModule)
    .import(StaticFileModule)
    .start()

// Files served:
// ./public/index.html -> http://localhost:3000/static/index.html
// ./public/css/style.css -> http://localhost:3000/static/css/style.css
// ./public/js/app.js -> http://localhost:3000/static/js/app.js
```

### Multiple Static Directories

Serve files from multiple directories with different prefixes:

```typescript
const config = load_config<TpConfigSchema>({
    http: { port: 3000 },
    static: [
        {
            root: './public',
            prefix: '/assets'
        },
        {
            root: './uploads',
            prefix: '/uploads'
        },
        {
            root: './docs',
            prefix: '/docs'
        }
    ]
})
```

## Configuration Options

### Basic Configuration

```typescript
interface StaticConfig {
    root: string                    // Directory to serve
    prefix?: string                 // URL prefix (default: '/')
    index?: string[]               // Index files (default: ['index.html'])
    cache_control?: string         // Cache-Control header
    max_age?: number              // Cache max age in seconds
    etag?: boolean                // Enable ETag headers (default: true)
    dot_files?: 'allow' | 'deny'  // Handle dot files (default: 'deny')
    extensions?: string[]         // Default file extensions
}
```

### Advanced Configuration

```typescript
const config = load_config<TpConfigSchema>({
    http: { port: 3000 },
    static: {
        root: './public',
        prefix: '/assets',
        index: ['index.html', 'index.htm', 'default.html'],
        cache_control: 'public, max-age=31536000', // 1 year
        etag: true,
        dot_files: 'deny',
        extensions: ['html', 'css', 'js', 'png', 'jpg', 'svg']
    }
})
```

## Caching

### Cache Headers

Configure caching for different file types:

```typescript
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        prefix: '/assets',
        cache_control: 'public, max-age=86400', // 24 hours default
        file_cache: {
            // Different cache settings for different file types
            '.css': 'public, max-age=31536000',    // 1 year for CSS
            '.js': 'public, max-age=31536000',     // 1 year for JS
            '.png': 'public, max-age=2592000',     // 30 days for images
            '.jpg': 'public, max-age=2592000',     // 30 days for images
            '.html': 'public, max-age=3600'       // 1 hour for HTML
        }
    }
})
```

### ETag Support

Enable ETag headers for client-side caching:

```typescript
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        etag: true,        // Enable ETag headers
        cache_control: 'public, max-age=3600'
    }
})
```

## Security

### Restrict File Access

Control which files can be accessed:

```typescript
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        dot_files: 'deny',                    // Deny access to .files
        extensions: ['html', 'css', 'js'],    // Only serve specific extensions
        ignore_patterns: [
            '*.config.js',                    // Ignore config files
            '*.env',                          // Ignore environment files
            'private/**'                      // Ignore private directory
        ]
    }
})
```

### Directory Traversal Protection

Built-in protection against directory traversal attacks:

```typescript
// These requests are automatically blocked:
// GET /assets/../../../etc/passwd
// GET /assets/..%2F..%2F..%2Fetc%2Fpasswd
// GET /assets/....//....//etc/passwd

// Tarpit automatically:
// 1. Normalizes paths
// 2. Prevents access outside root directory
// 3. Blocks suspicious patterns
```

## MIME Types

### Automatic MIME Detection

Tarpit automatically detects MIME types based on file extensions:

```typescript
// Automatic MIME type detection:
// .html -> text/html
// .css -> text/css
// .js -> application/javascript
// .json -> application/json
// .png -> image/png
// .jpg -> image/jpeg
// .svg -> image/svg+xml
```

### Custom MIME Types

Configure custom MIME types:

```typescript
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        mime_types: {
            '.md': 'text/markdown',
            '.woff2': 'font/woff2',
            '.custom': 'application/x-custom'
        }
    }
})
```

## Custom Static File Handlers

### Programmatic File Serving

Create custom static file handlers:

```typescript
@TpRouter('/files')
class FileRouter {
    @Get(':filename')
    async serve_file(args: PathArgs<{ filename: string }>, res: TpResponse) {
        const filename = args.ensure('filename', Jtl.string)
        const file_path = path.join('./uploads', filename)
        
        // Check if file exists and is safe
        if (!fs.existsSync(file_path) || !this.is_safe_path(file_path)) {
            throw new TpHttpFinish({ status: 404, msg: 'File not found' })
        }
        
        // Set appropriate headers
        const mime_type = this.get_mime_type(filename)
        res.headers.set('Content-Type', mime_type)
        res.headers.set('Cache-Control', 'public, max-age=3600')
        
        // Stream file
        const stream = fs.createReadStream(file_path)
        return stream
    }
    
    private is_safe_path(file_path: string): boolean {
        const resolved = path.resolve(file_path)
        const uploads_dir = path.resolve('./uploads')
        return resolved.startsWith(uploads_dir)
    }
    
    private get_mime_type(filename: string): string {
        const ext = path.extname(filename).toLowerCase()
        const mime_types: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain'
        }
        return mime_types[ext] || 'application/octet-stream'
    }
}
```

### File Download Handler

Create handlers for file downloads:

```typescript
@TpRouter('/download')
class DownloadRouter {
    @Get('report/:id')
    async download_report(args: PathArgs<{ id: string }>, res: TpResponse) {
        const id = args.ensure('id', Jtl.string)
        const report = await this.report_service.generate_report(id)
        
        // Set download headers
        res.headers.set('Content-Type', 'application/pdf')
        res.headers.set('Content-Disposition', `attachment; filename="report-${id}.pdf"`)
        res.headers.set('Content-Length', report.length.toString())
        
        return report
    }
    
    @Get('backup')
    async download_backup(res: TpResponse) {
        const backup_stream = await this.backup_service.create_backup()
        
        res.headers.set('Content-Type', 'application/gzip')
        res.headers.set('Content-Disposition', 'attachment; filename="backup.tar.gz"')
        res.headers.set('Transfer-Encoding', 'chunked')
        
        return backup_stream
    }
}
```

## Performance Optimization

### Compression

Enable compression for static files:

```typescript
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        compression: {
            enabled: true,
            threshold: 1024,                  // Compress files > 1KB
            algorithms: ['gzip', 'deflate'],  // Compression algorithms
            extensions: ['.html', '.css', '.js', '.json'] // File types to compress
        }
    }
})
```

### Pre-compressed Files

Serve pre-compressed files when available:

```typescript
// Directory structure:
// public/
//   ├── app.js (100KB)
//   ├── app.js.gz (30KB)
//   ├── app.js.br (25KB)
//   └── style.css
//   └── style.css.gz

const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        pre_compressed: true,  // Look for .gz and .br files
        compression_priority: ['br', 'gzip'] // Prefer Brotli over gzip
    }
})

// When client requests /app.js:
// 1. Check Accept-Encoding header
// 2. If supports br: serve app.js.br
// 3. If supports gzip: serve app.js.gz  
// 4. Otherwise: serve app.js
```

## Best Practices

### 1. Organize Static Assets

```typescript
// ✅ Good - Organized structure
public/
├── css/
│   ├── main.css
│   └── components/
├── js/
│   ├── app.js
│   └── modules/
├── images/
│   ├── icons/
│   └── photos/
└── fonts/

const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        prefix: '/assets'
    }
})
```

### 2. Use Appropriate Cache Headers

```typescript
// ✅ Good - Different cache strategies
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        file_cache: {
            // Long cache for versioned assets
            '.css': 'public, max-age=31536000, immutable',
            '.js': 'public, max-age=31536000, immutable',
            
            // Medium cache for images
            '.png': 'public, max-age=2592000',
            '.jpg': 'public, max-age=2592000',
            
            // Short cache for HTML
            '.html': 'public, max-age=300'
        }
    }
})
```

### 3. Security Configuration

```typescript
// ✅ Good - Secure static file serving
const config = load_config<TpConfigSchema>({
    static: {
        root: './public',
        dot_files: 'deny',                      // Block .env, .git, etc.
        extensions: ['.html', '.css', '.js'],   // Whitelist extensions
        ignore_patterns: [
            '*.config.*',                       // Block config files
            'private/**',                       // Block private directory
            'admin/**'                          // Block admin files
        ]
    }
})
```

### 4. Development vs Production

```typescript
// Development configuration
const dev_config = {
    static: {
        root: './public',
        cache_control: 'no-cache',  // No caching in development
        etag: false
    }
}

// Production configuration
const prod_config = {
    static: {
        root: './dist',
        cache_control: 'public, max-age=31536000',
        etag: true,
        compression: { enabled: true }
    }
}

const config = load_config<TpConfigSchema>(
    process.env.NODE_ENV === 'production' ? prod_config : dev_config
)
```

## Next Steps

- [**Routing**](./routing) - Learn about HTTP routing fundamentals
- [**Request Handling**](./request-handling) - Understand request processing
- [**Response Handling**](./response-handling) - Master response formatting 